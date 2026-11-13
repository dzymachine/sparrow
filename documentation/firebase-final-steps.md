# Final Steps to Connect Live Firebase (Per-User Knowledge Base)

The RuthAI backend is wired to hydrate and persist each user's Personal LLM Wiki knowledge base (`profile.md`, `financial_footprint.md`, `priorities_and_goals.md`, `lawyer_readiness.md`, and `interaction_log.md`) to:

- **Cloud Firestore:** `user_wikis/{userId}`
- **Firebase Storage:** `wikis/{userId}/wiki/*.md`

Complete the final steps below to switch from local disk fallback mode to live Firebase persistence.

---

## 1. Add Your Backend Service Account Key

Download a private key from **Firebase Console → Project settings → Service accounts → Generate new private key**, and save it to:

```text
ruthAI/server/serviceAccountKey.json
```

> **Note:** `firebaseAdmin.js` automatically detects `ruthAI/server/serviceAccountKey.json` if present. Never commit this file to Git.

---

## 2. Configure `ruthAI/server/.env`

Create `ruthAI/server/.env` (using `ruthAI/server/.env.example` as a template) and set your Firebase Storage bucket:

```env
PORT=5001
NODE_ENV=development
CLIENT_URL=http://localhost:5173

FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
FIREBASE_STORAGE_BUCKET=<your-project-id>.firebasestorage.app
```

*(If `FIREBASE_STORAGE_BUCKET` is omitted, the server defaults to `<project_id>.firebasestorage.app` from `serviceAccountKey.json`.)*

---

## 3. Restart the Server & Verify

Start or restart the server:

```bash
cd ruthAI/server
npm run dev
```

Confirm the startup log shows:

```text
[Firebase Admin] Initialized (Firestore: active, Storage: <your-project-id>.firebasestorage.app).
```

You can also verify live status by hitting the health endpoint:

```bash
curl http://localhost:5001/api/health
```

Expected `firebase` payload:

```json
{
  "configured": true,
  "firestore": true,
  "storageBucket": "<your-project-id>.firebasestorage.app"
}
```

---

## 4. Verify Per-User Knowledge Base Writes

1. Send a chat message or update a user profile via the UI or `POST /api/agent/chat`.
2. In the Firebase Console:
   - **Firestore** should contain `user_wikis/{userId}`.
   - **Storage** should contain `wikis/{userId}/wiki/profile.md`, `financial_footprint.md`, `priorities_and_goals.md`, `lawyer_readiness.md`, and `interaction_log.md`.
3. Triggering **Purge All Memory** (`DELETE /api/agent/wiki/:userId`) removes both the Firestore document and the Storage `wikis/{userId}/` files.
