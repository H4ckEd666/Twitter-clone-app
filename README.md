# Twitter Clone App

Full‑stack Twitter/X clone with real‑time chat, notifications, and media uploads.

## Features

- JWT auth with httpOnly cookies
- Create/read/like/comment/share posts
- Follow/unfollow users + suggested users
- Notifications (read/unread + count)
- Real‑time chat with unread counts and online presence
- Image uploads (Cloudinary)

## Tech Stack

- **Frontend:** React + Vite, React Router, React Query, Tailwind + DaisyUI
- **Backend:** Node.js, Express, MongoDB (Mongoose)
- **Realtime:** Socket.IO
- **Media:** Cloudinary

## Repo Structure

```
backend/    # Express API + MongoDB
frontend/   # React app (Vite)
```

## Prerequisites

- Node.js 18+
- MongoDB connection string
- Cloudinary account

## Environment Variables

Create a .env in the repo root (used by backend):

```
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FRONTEND_URL=http://localhost:3000
```

## Install

```
npm install
```

Then install frontend deps:

```
cd frontend
npm install
```

## Run (Development)

From repo root:

```
npm run dev
```

Frontend dev server:

```
cd frontend
npm run dev
```

## API Overview (Backend)

Base URL: `/api`

- **Auth**: `/auth/*`
- **Users**: `/users/*`
- **Posts**: `/posts/*`
- **Notifications**: `/notifications/*`
- **Chat**: `/chat/*`

All protected routes require a valid `jwt` cookie.

## Realtime (Socket.IO)

The client connects with `auth: { userId }`.
Server broadcasts online users via `users:online` and emits messages via `message:new`.

## Notes

- Image uploads are base64 strings validated before Cloudinary upload.
- Pagination supported on posts and notifications via `?page` and `?limit`.
- CSRF checks use Origin/Referer validation for non‑GET requests.

## Scripts

- Root: `npm run dev` (backend with nodemon)
- Frontend: `npm run dev` (Vite)

## License

MIT
