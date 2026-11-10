# Deploy RecapitulateAI on Render

This project can run as **one Render Web Service**. During deployment, Vite builds the React frontend into `dist/`; in production, Express serves those static files and the `/api/*` endpoints from the same Render-assigned port.

## 1. Push the project to GitHub

1. Extract the project folder from the ZIP.
2. Create a new empty GitHub repository.
3. Open a terminal in the folder containing `package.json` and run:

   ```bash
   git init
   git add .
   git commit -m "Prepare RecapitulateAI for Render"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
   git push -u origin main
   ```

4. Make sure `.env` is not committed. The `.gitignore` excludes it.

## 2. Deploy using the included Render Blueprint (recommended)

1. Sign in to <https://dashboard.render.com/>.
2. Select **New + → Blueprint**.
3. Connect the GitHub repository containing this project.
4. Render detects `render.yaml`. Review the service settings and create the Blueprint.
5. When prompted, enter your Gemini API key for `GEMINI_API_KEY`.
6. Wait for the first deploy to finish.

The Blueprint configures:

- Runtime: Node.js 24.22.1
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Health check: `/api/health`
- `NODE_ENV=production`
- Gemini model: `gemini-2.5-flash`

## 3. Or create the Web Service manually

Choose **New + → Web Service**, connect the repository, and use:

| Setting | Value |
| --- | --- |
| Runtime | Node |
| Root Directory | Leave blank when `package.json` is at repository root |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |
| Plan | Free for a demo, or a paid plan if you need always-on service |

Under **Environment**, add these variables:

| Key | Value |
| --- | --- |
| `NODE_VERSION` | `24.22.1` |
| `NODE_ENV` | `production` |
| `GEMINI_API_KEY` | Your Gemini API key (secret) |
| `GEMINI_MODEL` | `gemini-2.5-flash` (or the model that you verified locally) |
| `AI_PROVIDER_TIMEOUT_MS` | `18000` |
| `ENABLE_FAULT_SIMULATOR` | `false` |

Do **not** set `PORT` manually. Render provides it at runtime, and the Express server already reads `process.env.PORT` through its configuration.

## 4. Verify the deployment

Once Render reports the service as live, open:

- `https://YOUR-SERVICE.onrender.com/api/health` — should return JSON with `"status":"ok"`.
- `https://YOUR-SERVICE.onrender.com/` — should load the RecapitulateAI React application.

Then generate a small flashcard pack and a short quiz to verify the real Gemini API integration.

## 5. Important notes

- Never commit `.env` or put `GEMINI_API_KEY` in a `VITE_*` variable. Add the key only in Render's server-side Environment settings.
- `npm run dev` remains the local development command. It starts Vite and Express together.
- `npm start` is now the production command. It starts only Express, which serves both the compiled frontend and API.
- Free Render web services spin down after 15 minutes without inbound traffic and can take about a minute to wake up. This is normal for a free demo.
- The app saves study sessions in the browser's `localStorage`; those saved sessions remain in the same browser. Do not rely on the server's local filesystem for persistent user data.
