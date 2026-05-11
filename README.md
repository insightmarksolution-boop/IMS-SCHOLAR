# IMS Scholar

Installable PWA version of the IMS Scholar academic document generator.

## What This Build Adds

- Front end: `index.html`, app icons, social image, manifest and service worker.
- Back end: `api/generate.js`, a Vercel serverless function that calls Gemini securely.
- Phone install: PWA manifest with standalone display, home-screen icon and offline shell cache.
- Documents: generated documents are saved in the app on the current device and can be downloaded as Word `.doc` or plain text `.txt`.

## Important API Key Note

Do not put the Gemini API key in `index.html`. The key must live only in server environment variables.

Because the key was shared in chat, rotate it in Google AI Studio before publishing the app.

## Local Run

1. Copy `.env.example` to `.env.local`.
2. Put your Gemini key in `.env.local`:

```bash
GEMINI_API_KEY=your-new-key
GEMINI_MODEL=gemini-2.5-flash
```

3. Start the local server:

```bash
npm start
```

4. Open `http://localhost:4173`.

## Free Hosting

Recommended free setup: Vercel Hobby.

Vercel can host the static front end and the `/api/generate.js` serverless backend from the same project.

1. Create a GitHub repository and upload this folder.
2. Import the repository into Vercel.
3. In Vercel Project Settings, add Environment Variables:

```bash
GEMINI_API_KEY=your-new-key
GEMINI_MODEL=gemini-2.5-flash
```

4. Deploy.

## Phone Install

After deployment, open the HTTPS Vercel URL on the phone. Use the in-app Install button when available, or use the browser menu and choose Add to Home Screen. The app opens as a standalone phone app after installation.

For a real Play Store APK later, wrap this same PWA with Capacitor or Bubblewrap/TWA.

## Storage

Saved documents are stored locally on the device in the PWA/browser storage. They are not synced across phones. If cloud syncing is needed later, add a free database such as Supabase or Firebase and user login.
