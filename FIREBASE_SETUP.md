# Firebase Setup Guide (Firestore + Cloud Storage for RuthAI)

RuthAI uses **Firebase Firestore** (`user_wikis/{userId}`) to store structured Personal LLM Wiki records and **Firebase Storage** (`wikis/{userId}/wiki/*.md`) to store living markdown wiki files.

When Firebase credentials are not configured, the server automatically falls back to local disk (`server/data/wikis/`) and in-memory storage.

---

## 1. Create / Configure Your Firebase Project

1. Open the [Firebase Console](https://console.firebase.google.com/) and create or select your project.
2. Enable **Cloud Firestore**:
   - Go to **Build → Firestore Database → Create database**.
   - Choose a location and start in **Production mode** (security rules are defined in `firestore.rules`).
3. Enable **Cloud Storage**:
   - Go to **Build → Storage → Get started**.
   - Note your bucket name (e.g., `your-project-id.firebasestorage.app` or `your-project-id.appspot.com`).
4. *(Optional)* Enable **Authentication**:
   - Go to **Build → Authentication → Get started** and enable **Email/Password** and **Google** sign-in providers.

---

## 2. Generate a Backend Service Account Key

1. In the Firebase Console, click **Project settings (gear icon) → Service accounts**.
2. Click **Generate new private key** and download the JSON file.
3. Save the file in the `server/` directory as:
   ```text
   ruthAI/server/serviceAccountKey.json
   ```
   > **Security Note:** `serviceAccountKey.json` is listed in `.gitignore` and must **never** be committed to Git.

---

## 3. Configure Environment Variables

### Server (`ruthAI/server/.env`)
Copy `ruthAI/server/.env.example` to `ruthAI/server/.env` and configure your credentials:

```env
PORT=5001
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Firebase Admin Service Account (path or JSON string)
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app

# Optional: Google Gemini API Key for live LLM responses
# GEMINI_API_KEY=
```

### Client (`ruthAI/client/.env`) — *(Optional for Web Auth)*
Copy `ruthAI/client/.env.example` to `ruthAI/client/.env` and add your Web App config from **Project settings → General → Your apps**:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_API_URL=/api
```

---

## 4. Deploy Firestore Security Rules

Update `.firebaserc` with your project ID:

```json
{
  "projects": {
    "default": "your-firebase-project-id"
  }
}
```

Deploy security rules using Firebase CLI:

```bash
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules
```

---

## 5. Verify Connection

Start the dev server:

```bash
npm run dev
```

In the server logs, confirm Firebase initialization:

```text
[Firebase Admin] Initialized (Firestore: active, Storage: your-project-id.firebasestorage.app).
```

When users chat with Ruth, extracted facts are automatically synced to:
- **Firestore Document:** `user_wikis/{userId}`
- **Firebase Storage Files:** `wikis/{userId}/wiki/{profile,financial_footprint,priorities_and_goals,lawyer_readiness,interaction_log}.md`

Triggering **Purge All Memory (CCPA & Safety)** automatically deletes both the Firestore document and all corresponding Storage markdown files.
