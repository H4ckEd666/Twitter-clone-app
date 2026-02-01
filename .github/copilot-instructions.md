# Copilot instructions

## Big picture architecture

- Fullstack monorepo: Express + MongoDB API in backend/, Vite + React UI in frontend/.
- API is RESTful under /api/\* and mounted in backend/server.js; auth, users, posts, notifications are separated by route/controller pairs in backend/routes/ and backend/controllers/.
- Auth uses JWT stored in an httpOnly cookie named jwt (see backend/lib/utils/generateToken.js). Protected endpoints require protectRoute middleware (backend/middleware/protecRoute.js).
- Data models are Mongoose schemas in backend/models/. Posts, users, and notifications drive most cross-feature behavior (e.g., likes/comments/follows create Notification docs).
- Image uploads are sent as base64 strings from the UI and uploaded to Cloudinary in backend/controllers/posts.controller.js and user.controller.js.

## Frontend patterns

- React Query is the data layer; queries use keys like ["authUser"], ["posts"], and ["suggestedUsers"]. Mutations usually invalidate these keys or update cache directly (see frontend/src/components/common/Post.jsx).
- API calls use relative paths like /api/posts/create; Vite dev server proxies /api to http://localhost:5000 (frontend/vite.config.js).
- UI uses Tailwind + DaisyUI; components live in frontend/src/components/common/ and pages in frontend/src/pages/.
- Some pages still use placeholder data and alerts (e.g., frontend/src/pages/profile/ProfilePage.jsx, frontend/src/pages/notification/NotificationPage.jsx, frontend/src/pages/profile/EditProfileModal.jsx).

## Developer workflows

- Backend dev server: npm run dev from repo root (uses nodemon on backend/server.js).
- Frontend dev server: npm run dev from frontend/ (Vite on port 3000).
- No tests are configured in package.json.

## Integration & config

- Required backend env vars: MONGO*URI, JWT_SECRET, CLOUDINARY*\* (set in .env).
- If running both apps locally, align backend PORT with the Vite proxy target or update frontend/vite.config.js.
