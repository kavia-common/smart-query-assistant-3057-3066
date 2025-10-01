import React, { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import { sendChatRequest, getApiBaseUrl } from './api';

/**
 * Ocean Professional themed Chat UI
 * - Header with title
 * - Chat transcript
 * - Input area fixed at bottom
 * - Smooth transitions and accessibility
 */

// Types
/**
 * @typedef {"user" | "assistant" | "system"} Role
 * @typedef {{ id: string, role: Role, content: string, status?: "pending" | "done" | "error" }} Message
 */

// Helpers
const uid = () => Math.random().toString(36).slice(2, 10);

// PUBLIC_INTERFACE
export default function App() {
  /** Theme handling with system preference default */
  const prefersDark = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches,
    []
  );
  const [theme, setTheme] = useState(prefersDark ? 'dark' : 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  /** Chat state */
  const [messages, setMessages] = useState(
    /** @type {Message[]} */ [
      {
        id: uid(),
        role: 'assistant',
        content:
          "Hello! I'm your AI assistant. Ask me anything and I'll do my best to help.",
        status: 'done',
      },
    ]
  );
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const listRef = useRef(null);
  const inputRef = useRef(null);

  /** Auto scroll to bottom on message updates */
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  /** Focus input on mount */
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  /** Handle submit */
  async function handleSend(e) {
    e?.preventDefault?.();
    setErrorMsg('');
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg =
      /** @type {Message} */ {
        id: uid(),
        role: 'user',
        content: trimmed,
        status: 'done',
      };

    const pendingAssistant =
      /** @type {Message} */ {
        id: uid(),
        role: 'assistant',
        content: 'Thinking…',
        status: 'pending',
      };

    setMessages((prev) => [...prev, userMsg, pendingAssistant]);
    setInput('');
    setIsLoading(true);

    try {
      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const reply = await sendChatRequest({ messages: history, prompt: trimmed });
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingAssistant.id ? { ...m, content: reply, status: 'done' } : m
        )
      );
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      const base = getApiBaseUrl() || '(same-origin)';
      const detail = err?.message || 'Unknown error';
      setErrorMsg(
        `There was a problem contacting the assistant. ${detail} If your backend runs on another origin, set REACT_APP_API_BASE_URL (current: ${base}).`
      );
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingAssistant.id
            ? {
                ...m,
                content:
                  'Error: failed to fetch response. Please check API configuration and try again.',
                status: 'error',
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  /** Keyboard accessibility: Shift+Enter for newline, Enter to send */
  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSend(e);
    }
  }

  return (
    <div className="App" role="application" aria-label="ChatGPT Chat Interface">
      {/* Header */}
      <header className="header" aria-label="Application Header">
        <div className="header-inner">
          <div className="brand">
            <div className="logo" aria-hidden="true">
              💬
            </div>
            <div className="titles">
              <h1 className="title">Smart Query Assistant</h1>
              <p className="subtitle">Ocean Professional</p>
            </div>
          </div>
          <div className="header-actions">
            <button
              className="btn ghost"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            >
              {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
            </button>
            <button
              className="btn accent"
              onClick={() =>
                setMessages([
                  {
                    id: uid(),
                    role: 'assistant',
                    content: 'New chat started. How can I assist you today?',
                    status: 'done',
                  },
                ])
              }
              aria-label="Start a new chat"
            >
              New Chat
            </button>
          </div>
        </div>
      </header>

      {/* Chat area */}
      <main className="chat" aria-live="polite" aria-label="Chat messages">
        <div className="chat-inner" ref={listRef}>
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
          {errorMsg ? (
            <div className="error" role="alert">
              {errorMsg}
            </div>
          ) : null}
        </div>
      </main>

      {/* Input area */}
      <footer className="composer" aria-label="Message composer">
        <form className="composer-form" onSubmit={handleSend}>
          <label htmlFor="chat-input" className="sr-only">
            Type your message
          </label>
          <textarea
            id="chat-input"
            ref={inputRef}
            className="input"
            placeholder="Ask anything…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            aria-label="Chat message input"
          />
          <div className="actions">
            <button
              type="submit"
              className="btn primary"
              disabled={isLoading || !input.trim()}
              aria-disabled={isLoading || !input.trim()}
              aria-label="Send message"
            >
              {isLoading ? 'Sending…' : 'Send'}
            </button>
          </div>
        </form>
        <p className="helper">
          Press Enter to send • Shift+Enter for a new line • API:{' '}
          {getApiBaseUrl() || '(same-origin)'}
        </p>
      </footer>
    </div>
  );
}

/** Message bubble component */
// PUBLIC_INTERFACE
function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const classes = `bubble ${isUser ? 'user' : 'assistant'} ${
    message.status === 'error' ? 'error-bubble' : ''
  }`;
  return (
    <div className={classes} role="group" aria-roledescription="message">
      <div className="avatar" aria-hidden="true">
        {isUser ? '🧑' : '🤖'}
      </div>
      <div className="content">
        <div className="author" aria-hidden="true">
          {isUser ? 'You' : 'Assistant'}
        </div>
        <div className="text">{message.content}</div>
      </div>
    </div>
  );
}
