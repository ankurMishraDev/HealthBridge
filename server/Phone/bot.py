"""Telephony-facing bot that mirrors the Live API WebSocket assistant."""

from __future__ import annotations

import asyncio
import json
import os
import re
import sys
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

import requests
from dotenv import load_dotenv
from loguru import logger

from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.processors.aggregators.openai_llm_context import OpenAILLMContext
from pipecat.runner.types import RunnerArguments
from pipecat.runner.utils import parse_telephony_websocket
from pipecat.serializers.twilio import TwilioFrameSerializer
from pipecat.services.gemini_multimodal_live.gemini import GeminiMultimodalLiveLLMService
from pipecat.services.llm_service import FunctionCallParams
from pipecat.transports.base_transport import BaseTransport
from pipecat.transports.websocket.fastapi import (
    FastAPIWebsocketParams,
    FastAPIWebsocketTransport,
)

from google.genai import types

from config import MODEL, SYSTEM_INSTRUCTION, client
from rag import retrieve_mental_health_resources
from utils import extract_json, pick_summarizer_model, validate_mood_scores

load_dotenv(override=True)

logger.remove(0)
logger.add(sys.stderr, level="DEBUG")


# ---------------------------------------------------------------------------
# Helpers shared with the WebSocket server
# ---------------------------------------------------------------------------

def _extract_user_id(call_data: Dict[str, Any]) -> Optional[str]:
    """Best-effort extraction of the user id from Twilio call metadata."""

    params = call_data.get("parameters") or call_data.get("body") or {}
    candidate_keys = (
        "uid",
        "user_id",
        "userId",
        "uid_param",
        "phone_number",
        "phoneNumber",
        "from",
        "From",
        "caller",
        "caller_number",
        "userPhone",
    )
    for key in candidate_keys:
        if key in params and params[key]:
            return str(params[key])

    for key in ("from", "From", "caller", "caller_number"):
        value = call_data.get(key)
        if value:
            return str(value)

    if "user_id" in call_data and call_data["user_id"]:
        return str(call_data["user_id"])

    return call_data.get("call_id")


async def generate_dynamic_system_instruction(uid: Optional[str]) -> str:
    """Mirror the dynamic persona building used by the WebSocket server."""

    needs_name = True
    needs_age = True
    user_name = "there"
    latest_summary: Dict[str, Any] = {}

    if uid:
        try:
            response = requests.get(f"http://localhost:3000/user/{uid}", timeout=5)
            if response.status_code == 200:
                user_data: Dict[str, Any] = response.json()
                user_name = user_data.get("name") or "there"
                latest_summary = user_data.get("latestSummary", {}).get("summary_data", {})
                needs_name = not bool(user_data.get("name"))
                age_value = user_data.get("age")
                needs_age = age_value is None or str(age_value).strip() == ""
            else:
                logger.warning(
                    "Falling back to default persona context because status %s was returned",
                    response.status_code,
                )
        except requests.RequestException as exc:
            logger.error("Unable to fetch profile for uid %s: %s", uid, exc)
    else:
        logger.info("No uid provided; will prompt user for name and age.")

    generated_questions = ""
    if latest_summary:
        question_prompt = (
            "Based on the following summary of a user's previous session, "
            "generate 2-3 thoughtful, open-ended follow-up questions to help them continue "
            "exploring their feelings. The questions should be gentle, encouraging, and in "
            "line with the persona of a supportive mentor. Frame them as natural conversation "
            "starters.\n\n"
            f"PREVIOUS SUMMARY:\n{json.dumps(latest_summary, indent=2)}\n\n"
            "QUESTIONS:"
        )

        try:
            question_model = pick_summarizer_model(MODEL)

            question_response = await client.aio.models.generate_content(
                model=question_model,
                contents=[question_prompt],
            )

            if question_response and getattr(question_response, "candidates", None):
                for candidate in question_response.candidates:
                    content = getattr(candidate, "content", None)
                    if not content or not getattr(content, "parts", None):
                        continue
                    for part in content.parts:
                        if getattr(part, "text", None):
                            generated_questions += part.text
            generated_questions = generated_questions.strip()
        except Exception as exc:  # pragma: no cover
            logger.error("Error generating dynamic follow-up questions: %s", exc)
            generated_questions = "How have you been feeling since we last talked?"

    greeting = f"Start the conversation by warmly welcoming the user back. Greet them by name: '{user_name}'."

    dynamic_instruction = f"{SYSTEM_INSTRUCTION}\n\n--- Conversation Context ---\n{greeting}\n"

    if generated_questions:
        dynamic_instruction += (
            "After the greeting, gently ask one of the following questions to help them open up, "
            "based on their previous conversation. Choose the one that feels most natural.\n"
            f"{generated_questions}\n"
        )
    else:
        dynamic_instruction += (
            "After the greeting, ask a general open-ended question like 'What's been on your mind lately?' "
            "or 'How have things been for you?'.\n"
        )

    if needs_name and needs_age:
        dynamic_instruction += (
            "Because we do not yet have the user's name or age, politely ask for both right after the greeting. "
            "Explain that knowing their details helps personalize guidance.\n"
        )
    elif needs_name:
        dynamic_instruction += (
            "We are missing the user's name. After greeting them, gently ask what name they would like you to use during the call.\n"
        )
    elif needs_age:
        dynamic_instruction += (
            "We are missing the user's age. After greeting them, respectfully ask for their age so you can tailor health guidance appropriately.\n"
        )

    dynamic_instruction += "--------------------------"
    return dynamic_instruction


def _build_tools() -> list[Dict[str, Any]]:
    """Return the Gemini tool specification used across both surfaces."""

    return [
        {
            "function_declarations": [
                {
                    "name": "retrieve_mental_health_resources",
                    "description": (
                        "Retrieves information about medical conditions, symptoms, and treatments "
                        "from a curated knowledge base."
                    ),
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "query": {
                                "type": "string",
                                "description": (
                                    "The user's query about a medical topic, symptom, or condition."
                                ),
                            }
                        },
                        "required": ["query"],
                    },
                }
            ]
        }
    ]


async def _rag_handler(params: FunctionCallParams) -> None:
    """Adapter that lets Gemini call into the shared Pinecone-backed RAG stack."""

    query = params.arguments.get("query") if isinstance(params.arguments, dict) else None
    query_text = str(query).strip() if query else ""
    if not query_text:
        await params.result_callback({"result": "No query provided."})
        return

    loop = asyncio.get_running_loop()
    response = await loop.run_in_executor(None, retrieve_mental_health_resources, query_text)
    await params.result_callback({"result": response})


def _flatten_message_content(content: Any) -> str:
    if isinstance(content, str):
        return content.strip()
    if isinstance(content, list):
        texts: List[str] = []
        for part in content:
            if isinstance(part, dict):
                if part.get("type") == "text" and part.get("text"):
                    texts.append(str(part["text"]))
                elif part.get("text"):
                    texts.append(str(part["text"]))
            elif isinstance(part, str):
                texts.append(part)
        return " ".join(t.strip() for t in texts if t and t.strip())
    return ""


def _context_to_transcript(context: OpenAILLMContext) -> List[Dict[str, str]]:
    transcript: List[Dict[str, str]] = []
    for message in context.get_messages_for_persistent_storage():
        role = message.get("role")
        if role not in {"user", "assistant"}:
            continue
        text = _flatten_message_content(message.get("content"))
        if not text:
            continue
        if role == "user" and text.strip().lower() == "say hello.":
            continue
        transcript.append({"role": str(role), "text": text.strip()})
    return transcript


def _extract_demographics(transcript: List[Dict[str, str]]) -> Tuple[Optional[str], Optional[int]]:
    name: Optional[str] = None
    age: Optional[int] = None

    for turn in transcript:
        if turn.get("role") != "user":
            continue

        text = turn.get("text", "")
        if not name:
            name_match = re.search(
                r"\b(?:my\s+name\s+is|i'm\s+called|call\s+me)\s+([A-Za-z][A-Za-z\s'.-]{1,40})",
                text,
                re.IGNORECASE,
            )
            if name_match:
                candidate = name_match.group(1).strip()
                if candidate:
                    name = candidate.title()

        if age is None:
            age_match = re.search(
                r"\b(?:i am|i'm|my\s+age\s+is|age\s+is|i\s*am\s*)(\d{1,3})(?:\s*(?:years?\s*old|yrs?\s*old|yo))?\b",
                text,
                re.IGNORECASE,
            )
            if age_match:
                try:
                    candidate_age = int(age_match.group(1))
                except ValueError:
                    candidate_age = None
                if candidate_age and 0 < candidate_age < 130:
                    age = candidate_age

        if name and age is not None:
            break

    return name, age


def _save_demographics(uid: Optional[str], name: Optional[str], age: Optional[int]) -> None:
    if not uid:
        return

    if name:
        try:
            requests.post(
                "http://localhost:3000/save-name",
                json={"uid": uid, "name": name},
                timeout=5,
            )
        except requests.RequestException as exc:
            logger.error("Error saving user name for %s: %s", uid, exc)

    if age is not None:
        try:
            requests.post(
                "http://localhost:3000/update-profile",
                json={"uid": uid, "age": age},
                timeout=5,
            )
        except requests.RequestException as exc:
            logger.error("Error saving user age for %s: %s", uid, exc)


async def _summarize_and_store(
    uid: Optional[str],
    call_id: Optional[str],
    context: OpenAILLMContext,
) -> None:
    transcript = _context_to_transcript(context)
    if not transcript:
        logger.info("No transcript captured; skipping call summary.")
        return

    identifier = uid or call_id
    if not identifier:
        logger.warning("Unable to determine identifier for summary storage; skipping.")
        return

    name, age = _extract_demographics(transcript)
    _save_demographics(uid, name, age)

    previous_summary = ""
    if uid:
        try:
            response = requests.get(
                f"http://localhost:3000/get-summary/{uid}", timeout=5
            )
            if response.status_code == 200:
                previous_summary = (
                    response.json()
                    .get("latestSummary", {})
                    .get("summary_data", {})
                    .get("summary", "")
                )
        except requests.RequestException as exc:
            logger.error("Error fetching previous summary for %s: %s", uid, exc)

    flat_transcript = "\n".join(
        f"{turn['role'].upper()}: {turn['text']}" for turn in transcript if turn.get("text")
    )

    schema_hint = {
        "session_id": call_id or "",
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "disclaimer": (
            "This is an AI-generated summary based on user conversation and is NOT a medical record."
        ),
        "summary_of_interaction": "",
        "reported_symptoms": [],
        "symptom_details": "",
        "mentioned_medical_history": [],
        "mentioned_medications": [],
        "physical_assessment_notes": "",
        "triage_recommendation": "",
        "risk_flags": {
            "mentions_self_harm": False,
            "mentions_harming_others": False,
            "mentions_abuse_or_unsafe": False,
            "is_urgent_medical_situation": False,
        },
    }

    user_prompt = (
        "You are a clinical assistant analyzing a phone conversation with a user from a RURAL area. "
        "Your role is to EXTRACT and ORGANIZE medical information provided by the user. DO NOT provide a diagnosis or medical opinion. "
        "Analyze the following transcript to populate the provided JSON schema. "
        "In 'symptom_details', describe the symptoms including onset, duration, and severity as stated by the user. "
        "In 'triage_recommendation', record the final advice the bot gave. "
        "Set 'is_urgent_medical_situation' to true if the user describes life-threatening symptoms (e.g., chest pain, difficulty breathing, uncontrolled bleeding, severe confusion). "
        "Be precise and objective, using only information from the transcript. "
        "Return ONLY the completed JSON object."
        "\n\n"
        f"PREVIOUS_SUMMARY:\n{previous_summary}\n\n"
        f"JSON_SCHEMA_EXAMPLE:\n{json.dumps(schema_hint, ensure_ascii=False, indent=2)}\n\n"
        f"TRANSCRIPT:\n{flat_transcript}"
    )

    summarizer_model = pick_summarizer_model(MODEL)
    if summarizer_model != MODEL:
        logger.info(
            "Using summarizer model '%s' for generateContent (from '%s')",
            summarizer_model,
            MODEL,
        )

    user_content = types.Content(role="user", parts=[types.Part(text=user_prompt)])

    gen = await client.aio.models.generate_content(
        model=summarizer_model,
        contents=[user_content],
        config=types.GenerateContentConfig(
            temperature=0.3,
            system_instruction=SYSTEM_INSTRUCTION,
            response_mime_type="application/json",
        ),
    )

    text = ""
    if gen and getattr(gen, "candidates", None):
        for candidate in gen.candidates:
            content = getattr(candidate, "content", None)
            if not content or not getattr(content, "parts", None):
                continue
            for part in content.parts:
                if getattr(part, "text", None):
                    text += part.text

    summary_obj = extract_json(text) if text else {"raw": ""}
    summary_obj = validate_mood_scores(summary_obj)

    payload = {
        "uid": identifier,
        "summary": {
            "summary_data": summary_obj,
            "meta": {
                "source": "phone",
                "call_id": call_id,
                "saved_at_utc": datetime.now(timezone.utc).isoformat(),
            },
        },
    }

    try:
        response = requests.post(
            "http://localhost:3000/save-summary", json=payload, timeout=5
        )
        response.raise_for_status()
        logger.info("Saved phone summary for %s", identifier)
    except requests.RequestException as exc:
        logger.error("Error sending summary to backend for %s: %s", identifier, exc)


async def run_bot(
    transport: BaseTransport,
    handle_sigint: bool,
    *,
    uid: Optional[str],
    call_id: Optional[str],
) -> None:
    """Create the Pipecat pipeline using a dynamic instruction and shared tools."""

    system_instruction = await generate_dynamic_system_instruction(uid)

    llm = GeminiMultimodalLiveLLMService(
        api_key=os.getenv("GOOGLE_API_KEY"),
        system_instruction=system_instruction,
        tools=_build_tools(),
        voice_id="Puck",
        transcribe_user_audio=True,
        transcribe_model_audio=True,
    )

    llm.register_function("retrieve_mental_health_resources", _rag_handler)

    context = OpenAILLMContext(
        [{"role": "user", "content": "Say hello."}],
    )
    context_aggregator = llm.create_context_aggregator(context)

    summary_sent = False

    async def finalize_summary() -> None:
        nonlocal summary_sent
        if summary_sent:
            return
        summary_sent = True
        try:
            await _summarize_and_store(uid, call_id, context)
        except Exception as exc:  # pragma: no cover - defensive logging
            logger.error("Failed to summarize phone session: %s", exc)

    pipeline = Pipeline(
        [
            transport.input(),
            context_aggregator.user(),
            llm,
            transport.output(),
            context_aggregator.assistant(),
        ]
    )

    task = PipelineTask(
        pipeline,
        params=PipelineParams(
            audio_in_sample_rate=8000,
            audio_out_sample_rate=8000,
            enable_metrics=True,
            enable_usage_metrics=True,
        ),
    )

    @transport.event_handler("on_client_connected")
    async def on_client_connected(transport: BaseTransport, client: Any) -> None:  # pragma: no cover
        logger.info("Starting outbound call conversation for uid=%s", uid)

    @transport.event_handler("on_client_disconnected")
    async def on_client_disconnected(transport: BaseTransport, client: Any) -> None:  # pragma: no cover
        logger.info("Outbound call ended for uid=%s", uid)
        await finalize_summary()
        await task.cancel()

    runner = PipelineRunner(handle_sigint=handle_sigint)
    try:
        await runner.run(task)
    finally:
        await finalize_summary()


async def bot(runner_args: RunnerArguments) -> None:
    """Main bot entry point compatible with Pipecat Cloud."""

    transport_type, call_data = await parse_telephony_websocket(runner_args.websocket)
    logger.info("Auto-detected transport: %s", transport_type)

    serializer = TwilioFrameSerializer(
        stream_sid=call_data["stream_id"],
        call_sid=call_data["call_id"],
        account_sid=os.getenv("TWILIO_ACCOUNT_SID", ""),
        auth_token=os.getenv("TWILIO_AUTH_TOKEN", ""),
    )

    transport = FastAPIWebsocketTransport(
        websocket=runner_args.websocket,
        params=FastAPIWebsocketParams(
            audio_in_enabled=True,
            audio_out_enabled=True,
            add_wav_header=False,
            vad_analyzer=SileroVADAnalyzer(),
            serializer=serializer,
        ),
    )

    uid = _extract_user_id(call_data)
    call_id = call_data.get("call_id")
    handle_sigint = runner_args.handle_sigint

    await run_bot(transport, handle_sigint, uid=uid, call_id=call_id)