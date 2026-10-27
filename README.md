# LendLoop

LendLoop is a campus lending marketplace. The React/Vite frontend talks to the Express API in `backend/`; MongoDB Atlas stores accounts, listings, bookings, trust events, notifications, and the mock wallet ledger.

## Requirements

- Node.js 24 LTS (includes npm)
- A MongoDB Atlas cluster configured as a replica set (Atlas clusters support transactions)
- VS Code, if you want to edit the project

## Configure

1. Extract this project ZIP and open its folder in VS Code (the folder containing `package.json`).
2. In the project root, copy `.env.example` to `.env`.
3. Set `MONGO_URI` to your Atlas connection string. Put the database name in the URI and keep Atlas Network Access configured for your IP.
4. Set `JWT_SECRET` to a long random value. For example, in PowerShell run `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` and paste the result.
5. Keep `CLIENT_ORIGIN=http://localhost:5173` and `VITE_API_BASE_URL=http://localhost:4000/api/v1` for local development. Leave `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` blank: wallet top-ups are mock credits and do not process payments.

The `.env` file stays local and is ignored by Git. Do not paste secrets into `.env.example`.

## Install and run

Open two VS Code terminals in the project folder.

**Terminal 1 — API:**

```powershell
cd backend
npm install
npm run dev
```

**Terminal 2 — web app (project root):**

```powershell
npm install
npm run dev
```

Open the Vite URL printed in the second terminal (normally `http://localhost:5173`). The API health check is `http://localhost:4000/health`. Keep both terminals running. The frontend will automatically use the root `.env` API URL.

To create your first admin, sign up through the app, then in a terminal run:

```powershell
cd backend
npm run make-admin -- your-email@college.edu
```

Sign out and back in for the admin role to appear in your access token. Admin pages are available at `/admin`.

## Included flows

- Account registration/login with short-lived access JWTs and rotating refresh cookies
- Browse and search listings, category/hostel filters, item details, and availability calendar
- Create and manage listings using image URLs
- Request, approve/reject, cancel, hand over, return, dispute, and resolve bookings
- Mock wallet top-ups, deposit holds/releases, ledger history, trust score, notifications, and reviews API
- Admin stats, dispute review, and account bans

The lending API uses MongoDB transactions for multi-record booking and wallet changes. Connect it to an Atlas replica set, not a standalone local MongoDB server. Photo uploads use plain image URLs for now.

## Useful commands

From the project root, `npm run build` creates the production frontend in `dist/`. From `backend/`, `npm start` starts the API without nodemon.
