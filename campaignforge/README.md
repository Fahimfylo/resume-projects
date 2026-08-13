# Campaign Forge

Campaign strategy AI workspace: React + Vite frontend with an Express + MongoDB API.

## Run Locally

**Prerequisites:** Node.js, a MongoDB connection string, and a Gemini API key.

1. Install dependencies (root and server):
   ```
   npm install
   cd server && npm install
   ```
2. Configure environment:
   - Copy `server/.env.example` values into `server/.env` (MongoDB URI, JWT secrets, Gemini key, Google OAuth credentials).
   - Copy root `.env.example` to `.env.local` (sets `VITE_API_BASE_URL=http://localhost:4000/api/v1`).
3. Start the API and the frontend:
   ```
   cd server && npm run dev    # API on :4000
   npm run dev                 # frontend on :3000
   ```

## Deploy (Vercel)

`server/.env` is gitignored, so all server env vars must be set in the Vercel dashboard (Settings → Environment Variables):

| Variable | Value |
|---|---|
| `MONGODB_URI` | Your MongoDB connection string |
| `JWT_ACCESS_SECRET` | Long random string |
| `JWT_REFRESH_SECRET` | Long random string |
| `GEMINI_API_KEY` | Your Gemini API key |
| `GOOGLE_CLIENT_ID` | OAuth 2.0 client ID |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 client secret |
| `APP_URL` | `https://<your-app>.vercel.app` |
| `CORS_ORIGIN` | `https://<your-app>.vercel.app` |
| `GOOGLE_CALLBACK_URL` | `https://<your-app>.vercel.app/api/v1/auth/google/callback` |
| `VITE_API_BASE_URL` | `https://<your-app>.vercel.app/api/v1` |

Also add `GOOGLE_CALLBACK_URL` to your Google OAuth client's **Authorized redirect URIs** in Google Cloud Console.

`vercel.json` builds the frontend (`dist/`) and the server, and rewrites `/api/*` to the serverless entry point.
