# ChessKo – Backend

This is the backend part of ChessKo (REST API + Socket.IO server).

Below is everything you need for local setup.

---

## Pre-requisites

- Node.js (recommended LTS, e.g. 18+)
- npm (part of Node.js)
- Running PostgreSQL server
- Firebase project with service account for Firebase Admin SDK

---

### 1. Copy the example files

```bash
cp .env.example .env
cp serviceAccountKey.json.example serviceAccountKey.json
```

- Fill in the real values to the .env file and the service account key json file
- For getting the service account key variables you need to set up the firebase project with the service account
- You can find the instructions for setup of the firebase project with the service account *in the repository's root directory README.md file*

### 2. Install dependencies

```bash
npm install
```

### 3. Run the Prisma migrations and create/modify the database according to prisma/schema.prisma

```bash
npm run migrate:up
```

- Manual generation of Prisma client

```bash
npx prisma generate
```

### 4.1 Run the backend in development mode (recommanded settings for development)

```bash
npm run dev
```

### 4.2 Build & production start

```bash
npm run build
npm start
```
