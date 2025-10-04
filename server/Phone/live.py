"""FastAPI server that mirrors the web Live API workflow for phone calls."""

from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Any, Dict

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from twilio.rest import Client as TwilioClient
from twilio.twiml.voice_response import Connect, Stream, VoiceResponse

load_dotenv(override=True)

CURRENT_DIR = Path(__file__).resolve().parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

# Local import after path tweaks to keep parity with the original entrypoint.
from bot import bot  # pylint: disable=wrong-import-position
from pipecat.runner.types import WebSocketRunnerArguments  # pylint: disable=wrong-import-position

call_body_data: Dict[str, Dict[str, Any]] = {}


def _normalise_body_payload(payload: Any) -> Dict[str, Any]:
    """Twilio allows arbitrary JSON; ensure we only work with dictionaries."""

    if isinstance(payload, dict):
        return payload

    return {}


def get_websocket_url(host: str) -> str:
    env = os.getenv("ENV", "local").lower()
    if env == "production":
        return "wss://api.pipecat.daily.co/ws/twilio"
    return f"wss://{host}/ws"


def generate_twiml(host: str, body_data: Dict[str, Any] | None = None) -> str:
    websocket_url = get_websocket_url(host)

    response = VoiceResponse()
    connect = Connect()
    stream = Stream(url=websocket_url)

    env = os.getenv("ENV", "local").lower()
    if env == "production":
        agent_name = os.getenv("AGENT_NAME")
        org_name = os.getenv("ORGANIZATION_NAME")
        if agent_name and org_name:
            service_host = f"{agent_name}.{org_name}"
            stream.parameter(name="_pipecatCloudServiceHost", value=service_host)

    if body_data:
        for key, value in body_data.items():
            stream.parameter(name=key, value=value)

    connect.append(stream)
    response.append(connect)
    response.pause(length=20)
    return str(response)


def make_twilio_call(to_number: str, from_number: str, twiml_url: str) -> Dict[str, str]:
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")

    if not account_sid or not auth_token:
        raise ValueError("Missing Twilio credentials")

    client = TwilioClient(account_sid, auth_token)
    call = client.calls.create(to=to_number, from_=from_number, url=twiml_url, method="POST")
    return {"sid": call.sid}


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/make-call")
async def make_call(request: Request) -> JSONResponse:
    """
    Endpoint to initiate an outbound call.
    Expects a JSON body with a "to_number" key.
    """
    try:
        data = await request.json()
        to_number = data.get("to_number")
        if not to_number:
            raise HTTPException(status_code=400, detail="Missing 'to_number' in request body")

        host = request.headers.get("host")
        if not host:
            raise HTTPException(status_code=400, detail="Unable to determine server host")

        protocol = "https" if not host.startswith("localhost") and not host.startswith("127.0.0.1") else "http"
        twiml_url = f"{protocol}://{host}/twiml"

        call_result = make_twilio_call(
            to_number=to_number,
            from_number=os.getenv("TWILIO_PHONE_NUMBER"),
            twiml_url=twiml_url,
        )

        call_sid = call_result["sid"]
        # You can add any additional data to call_body_data if needed
        # For example, call_body_data[call_sid] = {"custom_data": "some_value"}

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Server error: {exc}") from exc

    return JSONResponse({"call_sid": call_sid, "status": "call_initiated", "to_number": to_number})


@app.post("/twiml")
async def get_twiml(request: Request) -> HTMLResponse:
    form_data = await request.form()
    call_sid = form_data.get("CallSid", "")
    body_data = call_body_data.get(call_sid, {})
    if call_sid and body_data:
        del call_body_data[call_sid]

    env = os.getenv("ENV", "local").lower()
    if env == "production" and (not os.getenv("AGENT_NAME") or not os.getenv("ORGANIZATION_NAME")):
        raise HTTPException(
            status_code=500,
            detail="AGENT_NAME and ORGANIZATION_NAME must be set for production deployment",
        )

    host = request.headers.get("host")
    if not host:
        raise HTTPException(status_code=400, detail="Unable to determine server host")

    twiml_content = generate_twiml(host, body_data)
    return HTMLResponse(content=twiml_content, media_type="application/xml")


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    runner_args = WebSocketRunnerArguments(websocket=websocket)
    runner_args.handle_sigint = False
    try:
        await bot(runner_args)
    except Exception as exc:  # pragma: no cover - defensive
        await websocket.close()
        raise exc


if __name__ == "__main__":
    port = int(os.getenv("PORT", "7860"))
    uvicorn.run(app, host="0.0.0.0", port=port)
