import os
from google import genai
# Removed direct import of types to use genai.types for consistency
from google.oauth2 import service_account
from pinecone import (Pinecone, ServerlessSpec)
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Constants
PROJECT_ID = "gen-ai-hack2skill-470416"
LOCATION = "us-central1"
MODEL = "gemini-2.0-flash-exp"
VOICE_NAME = "Puck"
SEND_SAMPLE_RATE = 16000

def read_text_file_best_effort(path: str) -> str:
    tried = []
    for enc in ("utf-8", "utf-8-sig", "cp1252", "latin-1"):
        try:
            with open(path, "r", encoding=enc) as f:
                text = f.read()
            logger.info(f"Loaded system_instruction.txt using encoding: {enc}")
            return text
        except UnicodeDecodeError:
            tried.append(enc)
            continue
        except FileNotFoundError:
            raise
    with open(path, "rb") as f:
        raw = f.read()
    logger.warning(f"Fell back to bytes decode with replacement. Tried encodings: {tried}")
    return raw.decode("utf-8", errors="replace")

# Load system instruction
try:
    file_path = os.path.join(os.path.dirname(__file__), "system_instruction.txt")
    SYSTEM_INSTRUCTION = read_text_file_best_effort(file_path)
except FileNotFoundError:
    logger.error("Error: system_instruction.txt not found. Using a default instruction.")
    SYSTEM_INSTRUCTION = "You are a helpful AI assistant."

# Authorization
KEY_PATH = os.path.join(os.path.dirname(__file__), "service-account.json")
SCOPES = ["https://www.googleapis.com/auth/cloud-platform"]
creds = service_account.Credentials.from_service_account_file(KEY_PATH, scopes=SCOPES)
# REMOVED: Redundant environment variable setting
client = genai.Client(
    vertexai=True,
    project=PROJECT_ID,
    location=LOCATION,
    credentials=creds,
)

# Initialize Pinecone
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY", "your-pinecone-api-key")
index_name = os.getenv("PINECONE_INDEX_NAME", "medical-chatbot")
# print(PINECONE_API_KEY)
pc = Pinecone(api_key=PINECONE_API_KEY)

# UPDATED: More modern way to check for index existence
if index_name not in pc.list_indexes().names():
    pc.create_index(
        name=index_name,
        dimension=768,  # Dimension of the embeddings (matches all-mpnet-base-v2)
        metric="cosine",  # Cosine similarity
        spec=ServerlessSpec(cloud="aws", region="us-east-1")
    )

index = pc.Index(index_name)

# Define tool objects

# RAG Tool for mental health resources
rag_tool = genai.types.Tool(
    function_declarations=[
        genai.types.FunctionDeclaration(
            name="retrieve_mental_health_resources",
            description="Retrieves information about medical conditions, symptoms, and treatments from a curated knowledge base.",
            parameters=genai.types.Schema(
                type=genai.types.Type.OBJECT,
                properties={
                    "query": genai.types.Schema(
                        type=genai.types.Type.STRING,
                        description="The user's query about a medical topic, symptom, or condition."
                    )
                },
                required=["query"]
            ),
        )
    ]
)

# CORRECTED: Single, correct definition for the Google Search tool
google_search_tool = genai.types.Tool(
    google_search_retrieval=genai.types.GoogleSearchRetrieval()
)

# LiveAPI Configuration
config = genai.types.LiveConnectConfig(
    response_modalities=["AUDIO"],
    output_audio_transcription={},
    input_audio_transcription={},
    speech_config=genai.types.SpeechConfig(
        voice_config=genai.types.VoiceConfig(
            prebuilt_voice_config=genai.types.PrebuiltVoiceConfig(voice_name=VOICE_NAME)
        )
    ),
    session_resumption=genai.types.SessionResumptionConfig(handle=None),
    system_instruction=SYSTEM_INSTRUCTION,
    tools=[rag_tool, google_search_tool],
)
