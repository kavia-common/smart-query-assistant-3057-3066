import os
from typing import List, Literal, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator

# App metadata and tags for OpenAPI
app = FastAPI(
    title="Smart Query Assistant Backend",
    description=(
        "FastAPI backend for the Smart Query Assistant. "
        "Provides a single /api/chat endpoint that accepts chat messages and returns an assistant reply. "
        "If OpenAI environment/configuration is present, requests are proxied to the OpenAI Chat Completions API; "
        "otherwise, a mocked reply is returned."
    ),
    version="1.0.0",
    openapi_tags=[
        {
            "name": "chat",
            "description": "Endpoints for chatting with the assistant.",
        },
        {
            "name": "websocket",
            "description": "Reserved for real-time features (not used in this project).",
        },
    ],
)

# CORS configuration
# Allow the React dev server and same-origin by default.
# Frontend may set REACT_APP_API_BASE_URL; ensure this backend allows it via CORS.
frontend_origins = os.getenv("CORS_ALLOW_ORIGINS", "")
allowed_origins = (
    [o.strip() for o in frontend_origins.split(",") if o.strip()]
    if frontend_origins
    else ["*"]  # Default to permissive for development; tighten for production.
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Models
Role = Literal["user", "assistant", "system"]


class ChatMessage(BaseModel):
    role: Role = Field(..., description="Role of the message author: user | assistant | system")
    content: str = Field(..., description="Message text content")

    @validator("content")
    def non_empty_content(cls, v: str):
        if not v or not v.strip():
            raise ValueError("content must be a non-empty string")
        return v.strip()


class ChatRequest(BaseModel):
    # Accepts either a single message as 'message' or an array under 'messages'
    message: Optional[str] = Field(None, description="Single message string (shorthand for a user message)")
    messages: Optional[List[ChatMessage]] = Field(
        None, description="Full conversation context as a list of messages"
    )
    prompt: Optional[str] = Field(
        None,
        description="Optional duplicate of the latest user message for compatibility with some frontends",
    )

    @validator("message")
    def normalize_message(cls, v: Optional[str]):
        if v is None:
            return v
        if not v.strip():
            raise ValueError("message must be a non-empty string when provided")
        return v.strip()

    def normalized_messages(self) -> List[ChatMessage]:
        """
        Normalize input into a messages list:
        - If `messages` provided, use as-is.
        - Else if `message` provided, construct a single user message.
        - Else if `prompt` provided, construct a single user message.
        - Else error is raised in the route handler.
        """
        if self.messages and len(self.messages) > 0:
            return self.messages
        text = self.message or self.prompt
        if text and text.strip():
            return [ChatMessage(role="user", content=text.strip())]
        return []


class ChatResponse(BaseModel):
    reply: str = Field(..., description="Assistant's reply message content")


# OpenAI integration utils
def _get_openai_config():
    """
    Read OpenAI configuration from environment variables.
    - OPENAI_API_KEY: API key
    - OPENAI_API_BASE: Optional custom base URL
    - OPENAI_MODEL: Optional model name, defaults to 'gpt-3.5-turbo' or 'gpt-4o-mini' style
    """
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    api_base = os.getenv("OPENAI_API_BASE", "").strip()
    model = os.getenv("OPENAI_MODEL", "").strip() or "gpt-3.5-turbo"
    return api_key, api_base, model


def _openai_available() -> bool:
    api_key, _, _ = _get_openai_config()
    return bool(api_key)


async def _call_openai(messages: List[ChatMessage]) -> str:
    """
    Call OpenAI Chat Completions API if configured.
    Uses httpx to avoid adding heavyweight dependencies; falls back if not configured.
    """
    import json
    import httpx

    api_key, api_base, model = _get_openai_config()
    if not api_key:
        raise RuntimeError("OpenAI API key missing")

    base_url = api_base or "https://api.openai.com"
    url = f"{base_url}/v1/chat/completions"

    # Convert Pydantic ChatMessage list to API structure
    payload = {
        "model": model,
        "messages": [{"role": m.role, "content": m.content} for m in messages],
        "temperature": 0.7,
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    timeout = float(os.getenv("OPENAI_TIMEOUT", "30"))
    async with httpx.AsyncClient(timeout=timeout) as client:
        resp = await client.post(url, headers=headers, content=json.dumps(payload))
        if resp.status_code >= 400:
            # Try to return body for clarity
            detail = resp.text[:500] if resp.text else f"HTTP {resp.status_code}"
            raise RuntimeError(f"OpenAI API error: {detail}")
        data = resp.json()
        # Extract assistant message
        try:
            return data["choices"][0]["message"]["content"]
        except Exception:
            raise RuntimeError("Unexpected response structure from OpenAI")


def _mock_reply(messages: List[ChatMessage]) -> str:
    """
    Provide a sensible fallback response when OpenAI is not configured.
    """
    last_user = next((m.content for m in reversed(messages) if m.role == "user"), "")
    prefix = "Mocked assistant response"
    if last_user:
        return f"{prefix}: You said - \"{last_user}\". Please configure OPENAI_API_KEY to get real AI responses."
    return f"{prefix}. Please configure OPENAI_API_KEY to get real AI responses."


@app.get(
    "/",
    tags=["chat"],
    summary="Service info",
    description="Basic info endpoint to verify the service is running.",
)
# PUBLIC_INTERFACE
def root_info():
    """Return basic health/info for the backend."""
    return {
        "service": "Smart Query Assistant Backend",
        "version": app.version,
        "openapi": "/openapi.json",
        "docs": "/docs",
        "chat_endpoint": "/api/chat",
        "cors_allow_origins": allowed_origins,
    }


@app.get(
    "/api/websocket-usage",
    tags=["websocket"],
    summary="WebSocket usage",
    description="This project does not use WebSockets, but this route documents that HTTP is used for chat.",
)
# PUBLIC_INTERFACE
def websocket_usage():
    """Explain that chat is over HTTP in this project."""
    return {
        "note": "No WebSocket endpoints are used in this project.",
        "chat_over_http": True,
        "http_endpoint": "/api/chat",
    }


@app.post(
    "/api/chat",
    response_model=ChatResponse,
    tags=["chat"],
    summary="Send chat messages and receive assistant reply",
    description=(
        "Accepts either a single message via 'message' or a list of messages via 'messages'. "
        "If OpenAI configuration is provided via environment (OPENAI_API_KEY), the request is sent to OpenAI; "
        "otherwise a mocked response is returned. Responds with JSON of shape { 'reply': '...' }."
    ),
)
# PUBLIC_INTERFACE
async def chat_endpoint(payload: ChatRequest) -> ChatResponse:
    """
    POST /api/chat
    Accepts:
      - { message: str } OR
      - { messages: [{ role: 'user'|'assistant'|'system', content: str }], prompt?: str }

    Returns:
      - { reply: str }

    Error handling:
      - Returns 400 if no message content provided.
      - Returns 502 with details if upstream OpenAI call fails when configured.
    """
    messages = payload.normalized_messages()
    if not messages:
        raise HTTPException(status_code=400, detail="Provide 'message' or 'messages' with at least one item.")

    # Try OpenAI if configured; otherwise fallback
    if _openai_available():
        try:
            reply_text = await _call_openai(messages)
        except Exception as e:
            # Log-like detail for client visibility while not leaking secrets
            raise HTTPException(
                status_code=502,
                detail=f"Upstream LLM error: {str(e)}",
            )
    else:
        reply_text = _mock_reply(messages)

    return ChatResponse(reply=reply_text)
