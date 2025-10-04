import asyncio
import json
import base64
import logging
import re
import websockets
import traceback
import requests
from datetime import datetime, timezone
from websockets.exceptions import ConnectionClosed
from config import client, MODEL, VOICE_NAME, SYSTEM_INSTRUCTION, rag_tool, SEND_SAMPLE_RATE
from google.genai import types
from utils import extract_json, validate_mood_scores, pick_summarizer_model
from rag import retrieve_mental_health_resources

logger = logging.getLogger(__name__)

def _extract_name_and_age_from_transcript(transcript):
    name = None
    age = None

    for message in transcript:
        if message.get("role") != "user":
            continue

        text = message.get("text", "")
        if not text:
            continue

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


class LiveAPIWebSocketServer:
    """WebSocket server implementation using Gemini LiveAPI directly."""

    def __init__(self, host="0.0.0.0", port=8765):
        self.host = host
        self.port = port
        self.active_clients = {}
        self.session_transcripts = {}
        self.session_ids = {}
        self.user_ids = {}

    async def start(self):
        logger.info(f"Starting WebSocket server on {self.host}:{self.port}")
        async with websockets.serve(self.handle_client, self.host, self.port):
            await asyncio.Future()

    async def handle_client(self, websocket):
        """Handle a new WebSocket client connection"""
        client_id = id(websocket)
        logger.info(f"New client connected: {client_id}")

        # Send ready message to client
        await websocket.send(json.dumps({"type": "ready"}))

        try:
            # Start the audio processing for this client
            await self.process_audio(websocket, client_id)
        except ConnectionClosed:
            logger.info(f"Client disconnected: {client_id}")
        except Exception as e:
            logger.error(f"Error handling client {client_id}: {e}")
            logger.error(traceback.format_exc())
        finally:
            # Summarize and clean up on disconnect
            logger.info(f"Cleaning up connection for client {client_id}")
            uid = self.user_ids.get(client_id)
            if uid and self.session_transcripts.get(client_id):
                logger.info(f"Connection closed for UID {uid}. Summarizing transcript.")
                try:
                    await self.summarize_and_store(client_id, uid)
                except Exception as e:
                    logger.error(f"Error during cleanup summarization for client {client_id}: {e}")

            # Clean up dictionaries
            if client_id in self.active_clients:
                del self.active_clients[client_id]
            if client_id in self.session_transcripts:
                del self.session_transcripts[client_id]
            if client_id in self.session_ids:
                del self.session_ids[client_id]
            if client_id in self.user_ids:
                del self.user_ids[client_id]

    async def generate_dynamic_system_instruction(self, uid: str) -> str:
        """
        Generates a dynamic system instruction based on user data from the database.
        """

        needs_name = True
        needs_age = True
        user_name = "there"
        latest_summary = {}

        if uid:
            try:
                # 1. Fetch user data from the Node.js server
                response = requests.get(f"http://localhost:3000/user/{uid}")
                if response.status_code == 200:
                    user_data = response.json()
                    user_name = user_data.get("name") or "there"
                    latest_summary = user_data.get("latestSummary", {}).get("summary_data", {})
                    needs_name = not bool(user_data.get("name"))
                    age_value = user_data.get("age")
                    needs_age = age_value is None or str(age_value).strip() == ""
                else:
                    logger.error(f"Failed to fetch user data for UID {uid}. Status: {response.status_code}")
            except requests.exceptions.RequestException as e:
                logger.error(f"RequestException when fetching user data: {e}")
        else:
            logger.warning("No UID provided, will prompt user for name and age.")

        # 2. Generate questions using Gemini based on the summary
        generated_questions = ""
        if latest_summary:
            question_prompt = (
                "Based on the following summary of a user's previous session, "
                    "generate 2-3 thoughtful, open-ended follow-up questions to help them reflect on their health and daily well-being. "
                    "The questions should encourage the user to share more about their current physical condition, lifestyle habits, and any changes they have noticed. "
                    "Keep the tone compassionate, respectful, and in line with the persona of a supportive community health guide like Anamai. "
                    "Focus on exploring general health, self-care practices, and early signs of possible concerns in a natural conversational way.\n\n"            
                    f"PREVIOUS SUMMARY:\n{json.dumps(latest_summary, indent=2)}\n\n"
                    "QUESTIONS:"
            )

            try:
                question_model = pick_summarizer_model(MODEL)
                question_response = await client.aio.models.generate_content(
                    model=question_model,
                    contents=[question_prompt],
                    config=types.GenerateContentConfig(temperature=0.7)
                )
                # Safely extract text from response
                if question_response and getattr(question_response, "candidates", None):
                    for c in question_response.candidates:
                        if getattr(c, "content", None) and getattr(c.content, "parts", None):
                            for p in c.content.parts:
                                if getattr(p, "text", None):
                                    generated_questions += p.text
                generated_questions = generated_questions.strip()
            except Exception as e:
                logger.error(f"Error generating questions with Gemini: {e}")
                generated_questions = "How have you been feeling since we last talked?" # Fallback question

        # 3. Construct the dynamic system instruction
        greeting = f"Start the conversation by warmly welcoming the user back. Greet them by name: '{user_name}'."

        dynamic_instruction = (
            f"{SYSTEM_INSTRUCTION}\n\n"
            f"--- Conversation Context ---\n"
            f"{greeting}\n"
        )

        if generated_questions:
            dynamic_instruction += (
                "After the greeting, gently ask one of the following questions to help them open up, "
                "based on their previous conversation. Choose the one that feels most natural.\n"
                f"{generated_questions}\n"
            )
        else:
            dynamic_instruction += "After the greeting, ask a general open-ended question like 'What's been on your mind lately?' or 'How have things been for you?'.\n"

        if needs_name and needs_age:
            dynamic_instruction += (
                "Because we do not yet have the user's name or age, politely ask for both immediately after greeting them. "
                "Let them know it helps personalize the guidance you provide.\n"
            )
        elif needs_name:
            dynamic_instruction += (
                "We do not have the user's name yet. After the greeting, gently ask what name they would like you to use.\n"
            )
        elif needs_age:
            dynamic_instruction += (
                "We are missing the user's age. After greeting them, respectfully ask for their age so recommendations stay age-appropriate.\n"
            )

        dynamic_instruction += "--------------------------"

        logger.info(f"Generated dynamic instruction for UID {uid}")
        return dynamic_instruction

    async def process_audio(self, websocket, client_id):
        # Store reference to client
        self.active_clients[client_id] = websocket

        # Init transcript buffer for this client
        self.session_transcripts[client_id] = []

        # Wait for the initial user_id message before starting the session
        uid = None
        try:
            message = await asyncio.wait_for(websocket.recv(), timeout=10.0)
            data = json.loads(message)
            if data.get("type") == "user_id":
                uid = data.get("data")
                self.user_ids[client_id] = uid
                logger.info(f"Received user ID: {uid}")
            else:
                logger.error("First message from client was not 'user_id'. Closing connection.")
                await websocket.close(code=1008, reason="user_id message expected")
                return
        except asyncio.TimeoutError:
            logger.error("Client did not send user_id in time. Closing connection.")
            await websocket.close(code=1008, reason="user_id timeout")
            return
        except (json.JSONDecodeError, websockets.exceptions.ConnectionClosed) as e:
            logger.error(f"Error receiving user_id from client: {e}")
            return # Connection is likely already closed or message was malformed

        # Generate dynamic system instruction using the received UID
        dynamic_system_instruction = await self.generate_dynamic_system_instruction(uid)

        # Create a new LiveAPI Config for this session with the dynamic instruction
        live_config = types.LiveConnectConfig(
            response_modalities=["AUDIO"],
            output_audio_transcription={},
            input_audio_transcription={},
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=VOICE_NAME)
                )
            ),
            session_resumption=types.SessionResumptionConfig(handle=None),
            system_instruction=dynamic_system_instruction,
            tools=[rag_tool],
        )

        # Connect to Gemini using LiveAPI with the session-specific config
        async with client.aio.live.connect(model=MODEL, config=live_config) as session:
            async with asyncio.TaskGroup() as tg:
                # Create a queue for audio data from the client
                audio_queue = asyncio.Queue()

                # Task to process incoming WebSocket messages (audio, text, end)
                async def handle_websocket_messages():
                    async for message in websocket:
                        try:
                            data = json.loads(message)
                            if data.get("type") == "audio":
                                audio_bytes = base64.b64decode(data.get("data", ""))
                                await audio_queue.put(audio_bytes)
                            elif data.get("type") == "end":
                                logger.info("Received end signal from client")
                                # Summarize on demand when client signals end
                                try:
                                    uid = self.user_ids.get(client_id)
                                    if not uid:
                                        logger.error("No user ID found for client")
                                        continue

                                    saved_path = await self.summarize_and_store(client_id, uid)
                                    try:
                                        await websocket.send(json.dumps({
                                            "type": "summary_saved",
                                            "data": saved_path or "ok"
                                        }))
                                    except Exception as se:
                                        logger.error(f"Error sending summary_saved over WS: {se}")
                                except Exception as e:
                                    logger.error(f"Summarization error: {e}")
                                    try:
                                        await websocket.send(json.dumps({
                                            "type": "summary_saved",
                                            "data": f"error: {e}"
                                        }))
                                    except Exception as se:
                                        logger.error(f"Error sending error over WS: {se}")
                            elif data.get("type") == "text":
                                txt = data.get("data")
                                logger.info(f"Received text: {txt}")
                                # Record explicit text messages from client as user turns
                                if txt:
                                    self.session_transcripts[client_id].append({
                                        "role": "user",
                                        "text": txt,
                                        "ts": datetime.now(timezone.utc).isoformat()
                                    })
                                    # Corrected method to send text content
                                    await session.send_realtime_input(text=txt)
                            elif data.get("type") == "user_id":
                                # This shouldn't happen if client logic is correct, but log it.
                                logger.warning(f"Received subsequent user_id message for client {client_id}.")
                        except json.JSONDecodeError:
                            logger.error("Invalid JSON message received")
                        except Exception as e:
                            logger.error(f"Error processing message: {e}")

                # Task to process and send audio to Gemini
                async def process_and_send_audio():
                    while True:
                        data = await audio_queue.get()
                        await session.send_realtime_input(
                            media={
                                "data": data,
                                "mime_type": f"audio/pcm;rate={SEND_SAMPLE_RATE}",
                            }
                        )
                        audio_queue.task_done()

                # Task to receive and play responses
                async def receive_and_play():
                    while True:
                        input_transcriptions = []
                        output_transcriptions = []

                        async for response in session.receive():
                            if response.session_resumption_update:
                                update = response.session_resumption_update
                                if update.resumable and update.new_handle:
                                    session_id = update.new_handle
                                    logger.info(f"New SESSION: {session_id}")
                                    # Keep latest handle per client
                                    self.session_ids[client_id] = session_id

                                    session_id_msg = json.dumps({
                                        "type": "session_id", "data": session_id
                                    })
                                    try:
                                        await websocket.send(session_id_msg)
                                    except Exception as se:
                                        logger.error(f"Error sending session_id over WS: {se}")

                            if response.go_away is not None:
                                logger.info(f"Session will terminate in: {response.go_away.time_left}")

                            server_content = response.server_content

                            if (hasattr(server_content, "interrupted") and server_content.interrupted):
                                logger.info("🤐 INTERRUPTION DETECTED")
                                try:
                                    await websocket.send(json.dumps({
                                        "type": "interrupted",
                                        "data": "Response interrupted by user input"
                                    }))
                                except Exception as se:
                                    logger.error(f"Error sending interrupted over WS: {se}")

                            if server_content and server_content.model_turn:
                                for part in server_content.model_turn.parts:
                                    if part.inline_data:
                                        b64_audio = base64.b64encode(part.inline_data.data).decode('utf-8')
                                        try:
                                            await websocket.send(json.dumps({
                                                "type": "audio", "data": b64_audio
                                            }))
                                        except Exception as se:
                                            logger.error(f"Error sending audio over WS: {se}")

                            if server_content and server_content.turn_complete:
                                logger.info("✅ Gemini done talking")
                                try:
                                    await websocket.send(json.dumps({ "type": "turn_complete" }))
                                except Exception as se:
                                    logger.error(f"Error sending turn_complete over WS: {se}")

                            # Handle tool calls
                            if server_content and hasattr(server_content, 'tool_call') and server_content.tool_call:
                                tool_call = server_content.tool_call
                                logger.info(f"Tool call received: {tool_call}")
                                try:
                                    if tool_call.function_calls:
                                        for call in tool_call.function_calls:
                                            if call.name == "retrieve_mental_health_resources":
                                                query = call.args.get("query", "")
                                                result = retrieve_mental_health_resources(query)
                                                # Send the tool result back to the session
                                                await session.send_realtime_input(
                                                    tool_result={
                                                        "name": call.name,
                                                        "call_id": call.call_id,
                                                        "result": result
                                                    }
                                                )
                                except Exception as e:
                                    logger.error(f"Error handling tool call: {e}")

                            output_transcription = getattr(response.server_content, "output_transcription", None)
                            if output_transcription and output_transcription.text:
                                text_out = output_transcription.text
                                output_transcriptions.append(text_out)

                                # Check for and save suggested exercises
                                try:
                                    if '"suggested_exercises"' in text_out:
                                        start = text_out.find("{")
                                        end = text_out.rfind("}") + 1
                                        if 0 <= start < end:
                                            json_str = text_out[start:end]
                                            data = json.loads(json_str)
                                            exercise_ids = data.get("suggested_exercises")
                                            uid = self.user_ids.get(client_id)
                                            if uid and exercise_ids and isinstance(exercise_ids, list):
                                                logger.info(f"Found suggested exercises: {exercise_ids} for user {uid}. Sending to db-server...")
                                                payload = {"uid": uid, "exerciseIds": exercise_ids}
                                                try:
                                                    # This is a blocking call, consider using an async library like aiohttp in production
                                                    response = requests.post("http://localhost:3000/save-exercises", json=payload)
                                                    logger.info(f"Save exercises response status: {response.status_code}")
                                                    logger.info(f"Save exercises response body: {response.text}")
                                                except requests.exceptions.RequestException as req_e:
                                                    logger.error(f"HTTP Request error when saving exercises: {req_e}")
                                except Exception as e:
                                    logger.error(f"Error processing suggested exercises: {e}")

                                try:
                                    await websocket.send(json.dumps({
                                        "type": "text", "data": text_out
                                    }))
                                except Exception as se:
                                    logger.error(f"Error sending text over WS: {se}")
                                # Record assistant outputs
                                self.session_transcripts[client_id].append({
                                    "role": "assistant",
                                    "text": text_out,
                                    "ts": datetime.now(timezone.utc).isoformat()
                                })

                            input_transcription = getattr(response.server_content, "input_transcription", None)
                            if input_transcription and input_transcription.text:
                                text_in = input_transcription.text
                                input_transcriptions.append(text_in)
                                # Record user recognized speech
                                self.session_transcripts[client_id].append({
                                    "role": "user",
                                    "text": text_in,
                                    "ts": datetime.now(timezone.utc).isoformat()
                                })

                        logger.info(f"Output transcription: {''.join(output_transcriptions)}")
                        logger.info(f"Input transcription: {''.join(input_transcriptions)}")

                # Start all tasks
                tg.create_task(handle_websocket_messages())
                tg.create_task(process_and_send_audio())
                tg.create_task(receive_and_play())

    # ---------- Summarize & store function ----------
    async def summarize_and_store(self, client_id: str, uid: str):
        """
        Summarizes the full transcript with a focus on clinical, user-reported health data
        and sends it to the Node.js backend.
        """
        transcript = self.session_transcripts.get(client_id, [])
        if not transcript:
            logger.info("No transcript found; skipping summary.")
            return None

        user_name, extracted_age = _extract_name_and_age_from_transcript(transcript)

        if user_name:
            try:
                requests.post(
                    "http://localhost:3000/save-name",
                    json={"uid": uid, "name": user_name},
                    timeout=5,
                )
            except requests.exceptions.RequestException as e:
                logger.error(f"Error saving user name: {e}")

        if extracted_age is not None:
            try:
                requests.post(
                    "http://localhost:3000/update-profile",
                    json={"uid": uid, "age": extracted_age},
                    timeout=5,
                )
            except requests.exceptions.RequestException as e:
                logger.error(f"Error saving user age: {e}")

        # This part for fetching previous summary remains the same
        previous_summary = ""
        try:
            response = requests.get(f"http://localhost:3000/get-summary/{uid}")
            if response.status_code == 200:
                previous_summary = response.json().get("latestSummary", {}).get("summary_data", {}).get("summary", "")
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching previous summary: {e}")

        flat_transcript = "\n".join(
            f"{turn.get('role', 'user').upper()}: {turn.get('text', '').strip()}"
            for turn in transcript if turn.get("text", "").strip()
        )

        session_handle = self.session_ids.get(client_id)

        # --- UPDATED SCHEMA: More Medical Background ---
        # This schema focuses on capturing objective, user-reported clinical information.
        schema_hint = {
        "session_id": session_handle or "",
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "disclaimer": "This is an AI-generated summary based on user conversation and is NOT a medical record.",
        "summary_of_interaction": "",  # Brief, top-level purpose and outcome.
        "reported_symptoms": [],       # e.g., ["Fever", "Persistent cough"]
        "symptom_details": "",         # Onset, duration, severity, triggers (as described by user).
        "mentioned_medical_history": [],   # e.g., ["Diabetes since 2010"]
        "mentioned_medications": [],       # e.g., ["Paracetamol 500mg (self-reported)"]
        "physical_assessment_notes": "",   # e.g., "mentioned a rash on left forearm"
        "find_main_problems": [],          # Key problems/issues extracted from the conversation.
        "level_of_pain": {                 # Overall pain level (user-described)
            "score": -1,                   # Range: -1 (mild) to 5 (highest), per your spec
            "body_site": "",               # e.g., "right ankle"
            "character": "",               # e.g., "sharp", "dull", "burning"
            "aggravating_relieving_factors": ""  # e.g., "worse on walking, better with rest"
        },
        "lifestyle_factors": {
        "smoking": False,
        "alcohol_use": False,
        "diet_type": "",                 # "Vegetarian", "Non-vegetarian", "Mixed"
        "water_intake": "",              # "Adequate", "Low"
        "sleep_hours": "",               # "Good", "Poor", etc.
        "physical_activity_level": ""    # "Low", "Moderate", "High"
        },
        "problems_concern": "",            # User-described incidents/causes (e.g., "fell from bike, leg hurt")
        "AI_based_conclusion": "",         # Tentative, non-diagnostic summary of likely issue(s) with uncertainty.
        "solution": "",                    # Advice provided by AI during session (self-care, hydration, rest, etc.)
        "triage_recommendation": "",       # Final recommendation (e.g., "Go to hospital now", "See a doctor in 24–48h")
        "suggested_doctors": [],           # e.g., ["General Physician", "Orthopedic Surgeon", "Pediatrician"]
        "risk_flags": {
            "is_urgent_medical_situation": False  # True if red-flag symptoms present (chest pain, dyspnea, etc.)
        }
    }


        # --- UPDATED PROMPT: Aligned with Medical Schema ---
        # This prompt instructs the AI to act as a clinical information extractor, not a diagnostician.
        user_prompt = (
    "You are a clinical information extractor assisting a user from a RURAL area. "
    "Your job is to EXTRACT and ORGANIZE medical information from the transcript into the provided JSON schema. "
    "DO NOT provide a diagnosis or medical opinion. Be objective and only use information explicitly present in the transcript. "
    "For 'symptom_details', capture onset, duration, severity, and triggers as stated by the user. "
    "For 'find_main_problems', list the key problems the user is facing in concise bullet-like phrases. "
    "For 'level_of_pain', set 'score' to the user-stated level on a scale from -1 (mild pain) to 5 (highest pain); "
    "if a specific number is not stated, infer conservatively from descriptors (e.g., 'mild', 'severe') and note the body site and character. "
    "In 'problems_concern', summarize any incidents or causes the user mentions (e.g., fall, burn, injury). "
    "In 'AI_based_conclusion', provide a cautious, non-diagnostic synthesis of what the AI inferred from symptoms (use phrases like 'may be consistent with', 'could suggest', and state uncertainty). "
    "In 'solution', record only the advice the AI actually provided during the conversation (e.g., rest, fluids, cold compress), not new advice. "
    "In 'triage_recommendation', record the final advice about urgency and where to seek care. "
    "In 'suggested_doctors', list any doctor types/specialties the AI suggested (e.g., 'General Physician', 'Orthopedic Surgeon'). "
    "Set 'risk_flags.is_urgent_medical_situation' to true ONLY if the transcript contains life-threatening red flags "
    "(e.g., chest pain/pressure, difficulty breathing, severe bleeding, sudden confusion/fainting, stroke signs). "
    "Return ONLY the completed JSON object with fields exactly as in the schema (no extra commentary)."
    "\n\n"
    f"PREVIOUS_SUMMARY:\n{previous_summary}\n\n"
    f"JSON_SCHEMA_EXAMPLE:\n{json.dumps(schema_hint, ensure_ascii=False, indent=2)}\n\n"
    f"TRANSCRIPT:\n{flat_transcript}"
    )

        # --- UPDATED PROMPT: Aligned with Medical Schema ---
        # This prompt instructs the AI to act as a clinical information extractor, not a diagnostician.
        user_prompt = (
            "You are a clinical assistant analyzing a conversation with a user from a RURAL area. "
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


        # Pick a compatible model for generateContent (avoids INVALID_ARGUMENT)
        summarizer_model = pick_summarizer_model(MODEL)
        if summarizer_model != MODEL:
            logger.info(f"Using summarizer model '{summarizer_model}' for generateContent (from '{MODEL}')")

        # Build Content/Part properly
        user_content = types.Content(
            role="user",
            parts=[types.Part(text=user_prompt)]
        )

        # Call the text model
        gen = await client.aio.models.generate_content(
            model=summarizer_model,
            contents=[user_content],  # could also pass contents=user_prompt (string)
            config=types.GenerateContentConfig(
                temperature=0.3,
                system_instruction=SYSTEM_INSTRUCTION,
                response_mime_type="application/json"
            )
        )

        # Extract text safely
        text = ""
        if gen and getattr(gen, "candidates", None):
            for c in gen.candidates:
                if getattr(c, "content", None) and getattr(c.content, "parts", None):
                    for p in c.content.parts:
                        if getattr(p, "text", None):
                            text += p.text

        logger.info(f"Raw AI response: {text}")
        summary_obj = extract_json(text) if text else {"raw": ""}
        
        # Validate and correct mood scores
        summary_obj = validate_mood_scores(summary_obj)
        logger.info(f"Parsed and validated summary object: {json.dumps(summary_obj, indent=2)}")

        # Send to Node.js backend
        try:
            payload = {
                "uid": uid,
                "summary": {
                    "summary_data": summary_obj,
                    "meta": {
                        "client_id": client_id,
                        "session_id": session_handle,
                        "saved_at_utc": datetime.now(timezone.utc).isoformat(),
                    }
                }
            }
            response = requests.post("http://localhost:3000/save-summary", json=payload)
            response.raise_for_status()  # Raise an exception for bad status codes
            logger.info(f"✅ Summary sent to Node.js backend: {response.text}")
            return "ok"
        except requests.exceptions.RequestException as e:
            logger.error(f"Error sending summary to Node.js backend: {e}")
            return None