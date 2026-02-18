# ChessKo

ChessKo is an online chess platform with:

- classic games (friendly + rated, multiple time controls),
- Swiss-system tournaments,
- a “special chess” mode with variants and magical upgrades.

This repository contains both **backend** (Node.js + TypeScript, REST + Socket.IO) and **frontend** (React + TypeScript) parts.

---

## Repository structure

- `backend/` – API server, game/tournament logic, Firebase Admin auth
- `frontend/` – React SPA client

Each part has its own README with detailed setup instructions.  
This root README focuses on **setting up Firebase + service account**, which the
application needs for authentication.

---

## Firebase project & service account (for backend)

The backend uses the **Firebase Admin SDK** to verify ID tokens from the frontend.  
To make this work, you need:

- a Firebase project
- a service account JSON key for the Firebase Admin SDK

### 1. Create a Firebase project

1. Go to the [Firebase console](https://console.firebase.google.com/).
2. Click **Add project** (or **Create project**).
3. Choose a **project name** and finish the wizard (terms, optional Google Analytics, etc.).
4. When finished, you’ll land on your new project’s overview page.

If you need more details, see the official guide:  
**Add the Firebase Admin SDK to your server**  
https://firebase.google.com/docs/admin/setup

### 2. Create a Firebase Admin service account key

1. In the Firebase console, open your project.
2. Click the gear icon ⚙ → **Project settings**.
3. Go to the **Service accounts** tab.
4. Under **Firebase Admin SDK**, select **Node.js**.
5. Click **Generate new private key**, then **Confirm**.
6. A JSON file will be downloaded to your computer.

This JSON file contains at least:

```json
{
  "project_id": "your-project-id",
  "client_email": "firebase-adminsdk-xxxx@your-project-id.iam.gserviceaccount.com",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
}
```

Once these steps are done, you are ready to move on to backend and frontend setup (each has individual README.md).
