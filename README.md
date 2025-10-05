# Table of Contents

- [Table of Contents](#table-of-contents)
  - [AnamAi — Voice AI health agent for low-connectivity areas](#anamai--voice-ai-health-agent-for-low-connectivity-areas)
  - [Features](#features)
  - [Screenshots](#screenshots)
    - [Landing Page](#landing-page)
    - [User Dashboard](#user-dashboard)
    - [AI Session](#ai-session)
    - [Sign Up](#sign-up)
  - [Repository layout](#repository-layout)
  - [Key server files](#key-server-files)
  - [Important design \& safety notes](#important-design--safety-notes)
  - [Prerequisites](#prerequisites)
  - [Required configuration](#required-configuration)
  - [Quick start — local development](#quick-start--local-development)
  - [Features](#features-1)
  - [Doctor Features](#doctor-features)
  - [Notes about the AI and retrieval tools](#notes-about-the-ai-and-retrieval-tools)
  - [Localization](#localization)
  - [Developer tips](#developer-tips)
  - [License \& ethics](#license--ethics)

## AnamAi — Voice AI health agent for low-connectivity areas

This repository contains HealthBridge (AnamAi), a voice-first, low-bandwidth capable AI health assistant built to provide first-level medical guidance and mental wellness support for users in rural or low-connectivity environments. It is intended to offer practical, non-diagnostic advice, basic symptom checks, and triage recommendations — and to connect users with clinicians when needed.

## Features

- Voice-first interaction (phone/low-bandwidth chat)
- Multi-language support and offline-friendly content
- First-level symptom checks and safe self-care suggestions
- Emergency red-flag detection and triage prompts (AI does NOT diagnose or prescribe)
- RAG + Google Search retrieval tooling for augmented information
- Doctor dashboard for creating medical drive posts and managing patients
- Patient notification system for doctor announcements
- Breathing exercises and relaxation techniques for mental wellness
- Journaling and mindfulness activities

## Screenshots

### Landing Page
![Landing Page](public/images/Landing.png)

### User Dashboard
![User Dashboard](public/images/userDashboard.jpg)

### AI Session
![AI Session](public/images/AISession.jpg)

### Sign Up
![Sign Up](public/images/login.jpg)



## Repository layout

- `app/` — Next.js frontend (UI, pages, components, locales, doctor dashboard)
- `server/` — Python WebSocket AI server and supporting modules (Gemini LiveAPI, config, rag, summarization)
- `scripts/` — Node.js helper scripts (database server, language file utilities)
- `locales/` — Translation files (e.g., `en.json`) used by the frontend
- `components/` — Frontend components including doctor dashboard components
- `contexts/`, `hooks/`, `lib/` — Frontend utilities and helpers
- `public/images/` — Screenshots and exercise images for the application

## Key server files

- `server/websocket_server.py` — WebSocket server connecting clients to Gemini LiveAPI sessions, handles audio, text, transcript summaries, and tool calls
- `server/config.py` — Genie/Vertex client setup, LiveAPI default config, tool definitions (RAG tool, Google Search retrieval tool), Pinecone init
- `server/system_instruction.txt` — Persona and safety system instruction (used as the assistant's default instruction)

## Important design & safety notes

- AnamAi provides guidance and education only. It MUST NOT diagnose, prescribe, or alter medications.
- Emergency red-flag symptoms (chest pain, severe bleeding, difficulty breathing, stroke signs, severe confusion, seizures) should lead users to seek immediate care; AnamAi will recommend emergency services when these appear.
- Sensitive data is encrypted and controlled by user consent. See `server/config.py` and `server/service-account.json` (not in source control) for credential locations.

## Prerequisites

- Node.js (frontend and scripts)
- Python 3.10+ (server)
- Google Cloud project with Vertex AI access and an appropriate service account
- Pinecone account (optional — used for RAG index)
- Firebase project (for auth and storing user data) if you use the included Node.js DB server

## Required configuration

- `server/service-account.json` — Google service account credentials used by the Python server (Vertex APIs). Place it in `server/` or update `server/config.py` to point to your path.
- Environment variables (example):
  - `PINECONE_API_KEY` — Pinecone API key (optional)
  - `PINECONE_INDEX_NAME` — index name (defaults to `medical-chatbot`)
  - Frontend envs: `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_WS_PATH`, etc. (see `.env.local` usage in frontend)

## Quick start — local development

1. Install frontend deps

```powershell
cd .\
pnpm install    # or npm install
```

2. Start the database helper (scripts)

```powershell
cd scripts
nodemon db_server.js
```

3. Prepare Python server credentials and dependencies

```powershell
cd server
python -m pip install -r requirements.txt
# Place your Google service account JSON at server/service-account.json
# Set envs like PINECONE_API_KEY if you use Pinecone
python server.py
```

4. Run the frontend

```powershell
cd ..\
pnpm run dev    # or npm run dev
```

5. Access the application

- User features: Sign up/login at the main landing page
- Doctor features: Navigate to `/doctor/auth` for doctor login and onboarding
- Doctor dashboard includes posts creation and patient management

## Features
- **Multilingual by default**: Auto-detect,handle code-switching,simple phrasing.

- **Low connectivity first**: Telephony IVR + real-time voice; adaptive bitrate; SMS/WhatsApp fallback; DTMF menu; missed-call callback.

- **24×7 ops**: Load-based queueing, failover, callback if wait is long, outage IVR tips.

- **Safe triage**: Cautious impression (no diagnosis), home steps first, red-flag detection → emergency script, “doctor-soon” ladder only if criteria met.

- **Rural access**: Toll-free option, slow/clear prompts, caregiver mode, send steps via SMS.

- **Local health education**: Short audio lessons (ORS, hygiene, vaccination), post-call summary tips.

- **Human in the loop**: Warm transfer when needed; language-matched doctors; consent capture.

- **Doctor directory match**: Filter by language, fees/UPI, locality, modes; suggest top 3; queue-aware fallback.

- **Privacy/consent**: Minimal data, explicit consent, encryption, auto-expiry for casual sessions.

- **Monitoring & quality**: Call analytics, ASR error tags, anonymized symptom clustering for ops.

## Doctor Features

- **Doctor Onboarding**: Complete profile setup with expertise, qualifications, experience, and clinic details
- **Medical Drive Posts**: Create announcements about upcoming medical camps and health drives
- **Patient Management**: View and manage associated patients (primary doctor and consulting relationships)
- **Patient Notifications**: Broadcast posts to all patients with automatic notification delivery
- **Dashboard Interface**: Dedicated doctor dashboard with posts and patient management sections

## Notes about the AI and retrieval tools

- The Python server uses the Google Generative AI (Gemini) client via `google.genai`.
- `server/config.py` defines two tools: `rag_tool` (custom RAG function) and `google_search_tool` (GoogleSearchRetrieval). These are exposed to LiveAPI sessions so the model can call them when appropriate.
- If you enable Google Search retrieval, ensure your Google Cloud project and the used service account have the required permissions and billing enabled.

## Localization

- Translations live in `locales/` as JSON files (for example `locales/en.json`). The frontend loads these for UI text and FAQs.
- `scripts/create-lang-files.js` can help generate translation scaffolding — review and run it if you update text keys.

## Developer tips

- To change the assistant persona and safety rules, edit `server/system_instruction.txt` (used as SYSTEM_INSTRUCTION in `server/config.py`).
- Tooling calls from Gemini appear as `tool_call` in `websocket_server.py`. The server already handles a RAG function; if you add handlers for Google Search results, ensure to forward `tool_result` back into the session as needed.



## License & ethics

- This project is intended to help with first-level health guidance. It is not a replacement for professional medical care. Follow local regulations and medical privacy laws when deploying.
