# Smart Query Assistant Backend (FastAPI)

FastAPI backend service that exposes POST /api/chat. It accepts chat messages and returns an assistant reply. If OpenAI configuration is present via environment, it forwards to OpenAI; otherwise it returns a mocked reply.

## Quick start

1. Create and activate a virtual environment (optional)
2. Install dependencies:
   pip install -r requirements.txt
3. Run the server:
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

Open http://localhost:8000/docs to view API docs.

## Environment variables

Create a .env file (do not commit) and set:

- OPENAI_API_KEY: Your OpenAI API key (optional; if not set, backend returns mocked responses)
- OPENAI_API_BASE: Optional custom base URL for OpenAI (default: https://api.openai.com)
- OPENAI_MODEL: Optional model name (default: gpt-3.5-turbo)
- OPENAI_TIMEOUT: Request timeout in seconds (default: 30)
- CORS_ALLOW_ORIGINS: Comma-separated list of allowed origins for CORS (default: * for dev)

Example .env.example:
OPENAI_API_KEY=sk-...
OPENAI_API_BASE=
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_TIMEOUT=30
CORS_ALLOW_ORIGINS=http://localhost:3000

## API

POST /api/chat
Accepts either:
- { "message": "Hello" }
- { "messages": [{ "role": "user", "content": "Hello" }], "prompt": "Hello" }

Returns:
- { "reply": "..." }

Error handling:
- 400 if the request is missing message content
- 502 if the upstream OpenAI call fails (when configured)
