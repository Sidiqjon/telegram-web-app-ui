# Chatly — Telegram-inspired Realtime Chat Frontend

React + Vite + TypeScript + Tailwind CSS + Zustand + Axios + Socket.IO client.

Responsive for **desktop** and **smartphone** — on mobile you see either the chat list or the open conversation (with a back button); on desktop both show side by side.

## 1. Install

```bash
npm install
```

## 2. Configure the backend URL

```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_API_URL=http://localhost:3000
```
Point this at your NestJS backend's base URL — **no** `/api` suffix and **no** trailing slash (the app appends `/api` itself for REST calls, and connects Socket.IO to the bare origin).

For your deployed backend, this would be something like:
```
VITE_API_URL=https://chat-backend.your-team.northflank.app
```

## 3. Run locally

```bash
npm run dev
```
Opens at `http://localhost:5173`.

**Important:** make sure your backend's `CORS_ORIGIN` env var includes `http://localhost:5173` while developing locally.

## 4. Build

```bash
npm run build
```
Outputs static files to `dist/`.

## Project structure

```
src/
  types/        # TypeScript types mirroring backend response shapes
  services/     # Axios instance + one service per backend module (auth, users, conversations, messages) + Socket.IO wrapper
  store/        # Zustand stores: authStore (session) and chatStore (conversations/messages/typing/presence)
  hooks/        # (reserved for future custom hooks)
  components/
    common/     # Avatar, Button, Input, Modal, Spinner
    auth/       # ProtectedRoute, GuestRoute, AuthLayout
    layout/     # AppLayout (responsive split), Sidebar (chats/search/profile tabs)
    chat/       # ChatList, ChatWindow, MessageBubble, MessageInput, TypingIndicator, MessageStatusTicks
    search/     # UserSearchPanel
    profile/    # ProfilePanel
  pages/        # LoginPage, RegisterPage, ChatPage
  utils/        # formatTime, getInitials/avatar color, tokenStorage
```

## How it connects to the backend

- **Auth**: `authStore` calls `/api/auth/register` / `/api/auth/login`, stores `accessToken` + `refreshToken` in `localStorage`, and calls `/api/auth/me` on page load to restore the session (auto-login).
- **Axios interceptor** (`services/api.ts`) attaches the access token to every request and, on a 401, automatically calls `/api/auth/refresh`, retries the failed request, and queues any other requests that failed at the same time. If refresh itself fails, it clears tokens and the app redirects to `/login`.
- **Socket.IO** connects to the backend's root origin (not `/api`) with the access token in `socket.handshake.auth.token`, exactly matching the backend's `SocketAuthService`.
- **Realtime events** handled: `newMessage`, `messageUpdated`, `messageDeleted`, `messageStatusUpdate`, `typing`, `stopTyping`, `userStatus`. Emitted: `joinConversation`, `leaveConversation`, `typing`, `stopTyping`, `messageDelivered`, `messageRead`.
- Text messages are sent via the REST endpoint (`POST /api/messages`) rather than the `sendMessage` socket event, so the UI can show a "sending…" state and handle upload errors cleanly. The backend broadcasts the realtime update either way, since both paths emit the same internal event.
- On login, the app joins **every** conversation's Socket.IO room (not just the open one) so new-message badges and previews update in the chat list even for conversations you haven't opened yet.

## Deploying to Vercel

1. Push this project to GitHub.
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the repo.
3. Vercel auto-detects Vite. Confirm:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Under **Environment Variables**, add:
   ```
   VITE_API_URL=https://chat-backend.your-team.northflank.app
   ```
5. Deploy. Vercel gives you a URL like `https://your-app.vercel.app`.
6. **Go back to your Northflank backend** and set `CORS_ORIGIN` to that exact Vercel URL (protocol + domain, no trailing slash), then redeploy the backend so it accepts requests from your live frontend.

`vercel.json` is already included so client-side routing (React Router) works correctly on page refresh/direct links.

## Notes

- Message status ticks: gray single ✓ = sent, gray double ✓✓ = delivered, blue double ✓✓ = read.
- File/image messages have a 20MB client-side size check before upload (adjust `MAX_FILE_SIZE_MB` in `MessageInput.tsx` if your backend/ImageKit plan allows larger files).
- The chat list "online"/"last seen" state combines the initial REST snapshot with live `userStatus` socket updates.
