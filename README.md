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

## Dashboard analytics (Google Analytics 4)

The dashboard reads live GA4 data through the backend — the browser never holds
GA credentials. Two independent halves must both be set up:

**1. Collection** — the public site (`kunphen-frontend`) sends the data.
Create a GA4 property + Web data stream for `kunphenherbalclinic.com`, then set
its measurement id in the frontend's Vercel env and redeploy:

```
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Left empty (as in local `.env`), the tag never loads, so dev traffic stays out of
the property.

**2. Reporting** — the backend reads the data back via the GA4 Data API:

1. In Google Cloud Console, enable the **Google Analytics Data API** and create a
   **service account**, then create a JSON key for it.
2. In GA Admin > *Property Access Management*, add that service account's email
   with the **Viewer** role on the property.
3. Set on the backend (Vercel env):

```
GA4_PROPERTY_ID=123456789          # numeric id from Admin > Property Settings
GA4_CREDENTIALS_JSON=<key JSON>    # raw JSON, or base64 of it
```

`GA4_PROPERTY_ID` is the numeric property id, **not** the `G-XXXXXXXXXX`
measurement id. Because Vercel env values mangle embedded newlines, prefer
base64: `base64 -w0 key.json`.

Until both halves are configured the dashboard shows a readable error instead of
numbers, and a brand-new property reports zeros until traffic arrives.

## Current scope

- Login (Google + dev bypass), dashboard with live GA4 analytics, protected routes
- Full CRUD for **Medicines**
- Articles and Gallery are placeholders and will follow the same pattern
