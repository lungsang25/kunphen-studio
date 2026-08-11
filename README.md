# Kunphen Studio

CMS frontend for the Kunphen website — manage Medicines, Articles, and Gallery served by `kunphen-backend`.

## Stack

- Vite + React 18 + TypeScript
- TailwindCSS + shadcn-style components (Radix)
- TanStack Query, react-router-dom, @react-oauth/google, sonner

## Setup

```bash
npm install
cp .env.example .env   # adjust values if needed
```

Environment variables:

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend URL (default `http://localhost:8000`) |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID; leave empty to hide the Google button |
| `VITE_DEV_AUTH_ENABLED` | `true` shows a dev-only login bypass (never in production) |

## Run

```bash
cd /home/lungsang/Project/kunphen/kunphen-studio
npm run dev   # http://localhost:5173
```

Requires the backend running on port 8000. For the dev login bypass, the backend
must have `DEV_AUTH_ENABLED=true` in its `.env`.

## Real Google sign-in

1. Create an OAuth Client ID (Web) in Google Cloud Console with
   `http://localhost:5173` as an authorized JavaScript origin.
2. Backend `.env`: set `GOOGLE_CLIENT_ID`, `ALLOWED_EMAILS` (comma-separated allowlist),
   and a strong `JWT_SECRET`.
3. Studio `.env`: set the same client ID in `VITE_GOOGLE_CLIENT_ID`.
4. Set `VITE_DEV_AUTH_ENABLED=false` and `DEV_AUTH_ENABLED=false` when done.

## Current scope

- Login (Google + dev bypass), dashboard, protected routes
- Full CRUD for **Medicines**
- Articles and Gallery are placeholders and will follow the same pattern
