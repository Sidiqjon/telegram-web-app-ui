# Chatly — Frontend

Realtime chat app built with React, Vite, TypeScript, Tailwind, Zustand, and Socket.IO client.

## Stack

- React + Vite + TypeScript
- Tailwind CSS
- Zustand for state (auth + chat)
- Axios with automatic token refresh
- Socket.IO client for realtime messaging, typing, and presence
- Deployed on Vercel

## Getting started

```bash
npm install
cp .env.example .env
```

Set `VITE_API_URL` to your backend's base URL (no `/api` suffix, no trailing slash):

```
VITE_API_URL=https://your-backend.up.railway.app
```

```bash
npm run dev
```

Runs at `http://localhost:5173`. Make sure the backend's `CORS_ORIGIN` includes this URL while developing locally.

## Project structure

```
src/
  types/        # types mirroring backend response shapes
  services/     # axios instance + api calls per module, socket wrapper
  store/        # authStore (session) and chatStore (conversations/messages/typing/presence)
  components/   # common, auth, layout, chat, search, profile
  pages/        # Login, Register, Chat
  utils/        # formatting helpers, token storage
```

## Deployment

Deployed on Vercel. `vercel.json` handles client-side routing. Set `VITE_API_URL` as an environment variable in the Vercel project settings, and make sure the backend's `CORS_ORIGIN` matches the deployed Vercel URL exactly.