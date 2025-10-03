# Lightweight React Template for KAVIA

This project provides a minimal React template with a clean, modern UI and minimal dependencies.

## Features

- **Lightweight**: No heavy UI frameworks - uses only vanilla CSS and React
- **Modern UI**: Clean, responsive design with KAVIA brand styling
- **Fast**: Minimal dependencies for quick loading times
- **Simple**: Easy to understand and modify

## Getting Started

In the project directory, you can run:

### `npm start`

Runs the app in development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### `npm test`

Launches the test runner in interactive watch mode.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

## API Configuration

The chat UI calls a backend endpoint at `/api/chat`.
By default, the app uses same-origin requests. If your backend runs on a different origin/port (e.g., FastAPI on http://localhost:8000), configure the base URL via environment variable:

1. Copy `.env.example` to `.env`
2. Set `REACT_APP_API_BASE_URL` to your backend’s base URL (no trailing slash), e.g.:
   - `REACT_APP_API_BASE_URL=http://localhost:8000`
   - `REACT_APP_API_BASE_URL=https://api.example.com`
3. Restart the dev server after changing `.env` (CTRL+C then `npm start`).

If `REACT_APP_API_BASE_URL` is not set, the app will use same-origin requests and you will likely see a 404 such as "Cannot POST /api/chat" during development unless a proxy is configured.

The frontend expects the backend to respond with JSON of shape:
```json
{ "reply": "string response from assistant" }
```

## Troubleshooting "failed to fetch response"

If the UI shows “failed to fetch response”:

- Ensure the backend is running and reachable at `${REACT_APP_API_BASE_URL || same-origin}/api/chat`
- If using a different host/port:
  - Set `REACT_APP_API_BASE_URL` in `.env`
  - Ensure CORS is enabled on the backend to allow the frontend origin
- Check that the backend returns valid JSON `{ "reply": "..." }` with a 2xx status
- Network timeouts and connection failures will surface with detailed hints in the UI error banner

## Customization

### Colors

The main brand colors are defined as CSS variables in `src/App.css`.

### Components

This template uses pure HTML/CSS components instead of a UI framework. You can find component styles in `src/App.css`. 

Common components include:
- Buttons (`.btn`, `.btn-large`)
- Container (`.container`)
- Navigation (`.navbar`)
- Typography (`.title`, `.subtitle`, `.description`)

## Learn More

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting
Moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size
Moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App
Moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration
Moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment
Moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify
Moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
