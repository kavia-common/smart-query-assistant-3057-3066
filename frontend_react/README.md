# Smart Query Assistant Frontend (React)

A modern, minimalist chat UI for interacting with the Smart Query Assistant backend (FastAPI). Styled with the Ocean Professional theme (blue & amber accents, subtle shadows, rounded corners, smooth transitions).

## Features

- Ocean Professional theme with light/dark toggle
- Header with branding and "New Chat" control
- Main chat area with user and assistant bubbles
- Bottom composer with Enter to send / Shift+Enter for newline
- REST integration with FastAPI backend `/api/chat`
- Clear error handling with helpful hints
- Accessible and responsive

## Getting Started

Install dependencies and start the dev server:

- npm install
- npm start

Open http://localhost:3000 to view it.

## API Configuration

The UI calls a backend endpoint at `/api/chat`. If your backend runs on a different origin/port, configure:

1. Copy `.env.example` to `.env`
2. Set `REACT_APP_API_BASE_URL` (no trailing slash), e.g.:
   - REACT_APP_API_BASE_URL=http://localhost:8000
   - REACT_APP_API_BASE_URL=https://api.example.com
3. Restart `npm start` after editing `.env`

If `REACT_APP_API_BASE_URL` is not set, the app uses same-origin requests.

Expected backend response:
{
  "reply": "string response from assistant"
}

## Troubleshooting

If you see “failed to fetch response”:
- Ensure backend is running and reachable at `${REACT_APP_API_BASE_URL || same-origin}/api/chat`
- Set REACT_APP_API_BASE_URL in `.env` if using a different host/port
- Ensure backend CORS allows the frontend origin
- Check backend responds with valid JSON `{ "reply": "..." }` and a 2xx status

## Theming and Customization

- Theme variables in `src/App.css`
- Lightweight, framework-free CSS
- Components are plain React function components for easy extension

## Scripts

- npm start
- npm test
- npm run build
- npm run eject

## License

MIT
