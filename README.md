# LPU OS Lab Report Analyser

A full-stack web application for analysing Operating System Lab Reports at Lovely Professional University using AI (Google Gemini 1.5 Flash).

## Tech Stack

- **Frontend**: React 18 + Vite + React Router v6 + Tailwind CSS + Framer Motion
- **Backend**: Node.js + Express.js
- **Database**: MongoDB + Mongoose
- **Auth**: JWT (access=15min + refresh=7d) + Nodemailer OTP
- **AI**: Google Gemini 1.5 Flash
- **File Handling**: Multer + pdf-parse + mammoth + xlsx
- **PDF Generation**: PDFKit

## Setup

1. Clone the repository
2. Copy `.env.example` to `server/.env` and fill in the values
3. Install dependencies:
   ```bash
   npm run install:all
   ```
4. Start MongoDB locally
5. Run the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

See `.env.example` for required environment variables.

## Deploy On Vercel

This repository is configured for a single Vercel project with:
- Frontend build from `client/` (Vite static build)
- Backend API from `server/server.js` (Node serverless function)
- API routing at `/api/*`

### 1) Import project to Vercel

1. Push this repository to GitHub.
2. In Vercel, click **Add New Project** and import the repo.
3. Keep the default root (repo root). `vercel.json` handles routing/builds.

### 2) Configure environment variables in Vercel

Add these in Vercel Project Settings -> Environment Variables:

- `NODE_ENV=production`
- `MONGO_URI=...`
- `JWT_SECRET=...`
- `JWT_REFRESH_SECRET=...`
- `CLIENT_URL=https://<your-vercel-domain>`
- `EMAIL_USER=...`
- `EMAIL_PASS=...`

AI variables (choose one provider minimum):

- `GEMINI_API_KEY=...` (if using Gemini)
- `OPENAI_API_KEY=...` (if using OpenAI)
- `XAI_API_KEY=...` (if using xAI)
- `AI_PROVIDER=gemini|openai|xai`

Optional AI config:

- `AI_FALLBACK=true`
- `AI_FORCE_LOCAL=false`
- `AI_LOCAL_FALLBACK=true`
- `AI_LOCAL_FALLBACK_GENERATION=false`
- `GEMINI_MODEL=...`
- `OPENAI_MODEL=...`
- `XAI_MODEL=...`
- `XAI_BASE_URL=...`

### 3) Deploy

Trigger a deployment from Vercel UI (or push to your configured branch).

### 4) Post-deploy checks

1. Open `https://<your-vercel-domain>/api/health` and verify `status: ok`.
2. Open app root and test login/OTP flow.
3. Upload and analyze a sample report.

## Important Note About File Storage On Vercel

This app currently stores uploaded files on the local server filesystem (`server/uploads`).
Vercel serverless functions use ephemeral storage, so uploaded files are not durable between invocations.

For production reliability, move report file storage to a persistent service (for example: AWS S3, Cloudinary, Vercel Blob, or MongoDB GridFS).

## Features

- Email OTP authentication with JWT
- Student and Teacher dashboards
- AI-powered lab report analysis using Google Gemini
- MD5 hash-based caching of analysis results
- PDF report generation
- File support: PDF, DOCX, DOC, XLSX, XLS
- Real-time score visualization
- Teacher submission management
