# Vercel Deployment Guide

This guide deploys the full project (frontend + backend) as a single Vercel project.

## Prerequisites

- GitHub repository with this code pushed
- Vercel account connected to GitHub
- MongoDB database URI (Atlas recommended)
- SMTP credentials for OTP email flow
- At least one AI provider key (Gemini, OpenAI, or xAI)

## Project Setup Status

This repository is already configured with:

- Vercel routing/build config in `vercel.json`
- API serverless-compatible entry in `server/server.js`
- Shared Express app in `server/app.js`
- Environment template in `.env.example`
- Ignore rules in `.gitignore`

## Step 1: Import Project in Vercel

1. Open Vercel dashboard.
2. Click **Add New Project**.
3. Import your GitHub repository.
4. Keep the project root as the repository root.
5. Leave framework detection as default (routing is controlled by `vercel.json`).

## Step 2: Configure Environment Variables

In Vercel: **Project Settings -> Environment Variables**

### Required

- `NODE_ENV=production`
- `MONGO_URI=<your_mongodb_connection_string>`
- `JWT_SECRET=<long_random_secret>`
- `JWT_REFRESH_SECRET=<long_random_refresh_secret>`
- `CLIENT_URL=https://<your-vercel-domain>`
- `EMAIL_USER=<smtp_or_gmail_user>`
- `EMAIL_PASS=<smtp_or_gmail_password_or_app_password>`

### AI Provider (set at least one key)

- `GEMINI_API_KEY=<key>` or
- `OPENAI_API_KEY=<key>` or
- `XAI_API_KEY=<key>`

### AI Runtime Options

- `AI_PROVIDER=gemini` (or `openai`, `xai`)
- `AI_FALLBACK=true`
- `AI_FORCE_LOCAL=false`
- `AI_LOCAL_FALLBACK=true`
- `AI_LOCAL_FALLBACK_GENERATION=false`

### Optional Model Overrides

- `GEMINI_MODEL=<model_name>`
- `OPENAI_MODEL=gpt-4o-mini`
- `XAI_MODEL=grok-4.20-reasoning`
- `XAI_BASE_URL=https://api.x.ai/v1`

## Step 3: Deploy

1. Trigger deployment from Vercel dashboard.
2. Wait for build to complete.
3. Open deployment URL.

## Step 4: Validate Deployment

1. API health check: `https://<your-vercel-domain>/api/health`
2. Open app root and verify login page loads.
3. Test OTP send + verify.
4. Login as student and teacher.
5. Upload and analyze one sample report.

## Troubleshooting

### Build fails for frontend

- Ensure dependencies are listed in `client/package.json`.
- Confirm no syntax/runtime errors in the client app.

### API returns CORS errors

- Verify `CLIENT_URL` exactly matches your frontend domain.
- Ensure protocol is correct (`https://`).

### OTP email not delivered

- Re-check `EMAIL_USER` and `EMAIL_PASS` values.
- If Gmail is used, ensure App Password is configured.

### AI analysis fails

- Verify selected provider key exists.
- Confirm `AI_PROVIDER` matches an available API key.
- Check provider quota and billing limits.

## Important Limitation (Uploads on Vercel)

Current upload handling writes files to the local server filesystem (`server/uploads`).
Vercel serverless storage is ephemeral, so files are not durable across invocations.

For production reliability, migrate uploads to persistent object storage (for example AWS S3, Vercel Blob, Cloudinary, or GridFS).

## Suggested Next Improvement

Implement cloud storage for report files before production rollout to avoid upload and re-download reliability issues.
