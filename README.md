# LendLoop

## Problem Statement
Students often need items for temporary use but may not want to purchase them. Meanwhile, many students own items that remain unused. Informal lending can also create challenges involving trust, deposits, and returns.

## Target Users
College students who want to borrow or lend items within their campus community.

## Solution
LendLoop is a peer-to-peer campus lending platform that allows students to list items, discover available items, request bookings, and manage lending and borrowing through a centralized application.

## Key Features
- User registration and authentication.
- Create and browse item listings.
- Search for items and view their details.
- Request and manage bookings.
- Wallet and deposit management.
- Razorpay payment integration.
- Booking expiry, overdue tracking, and return processing.
- Trust scores, reviews, and notifications.

## Tech Stack
- **Frontend:** React, Vite, CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas, Mongoose
- **Authentication:** JWT, bcryptjs, cookies
- **Payments:** Razorpay
- **Security:** Helmet, CORS, express-rate-limit
- **Background Jobs:** node-cron
- **Deployment:** Vercel (frontend), Render (backend)

## Architecture
LendLoop uses a client-server architecture. The React frontend communicates with the Express REST API over HTTP. The backend handles authentication, listings, bookings, wallet operations, and payments, while MongoDB Atlas stores application data. Scheduled background jobs process overdue bookings, expired requests, and returned bookings.

## Local Setup

### Prerequisites
- Node.js and npm
- MongoDB Atlas account and a database configured to support transactions

### Installation

Clone the repository:

```bash
git clone https://github.com/SaraNaqvi90/LendLoop.git
cd LendLoop
```

Install frontend dependencies:

```bash
npm install
```

Install backend dependencies:

```bash
cd backend
npm install
```

Create the required environment files using the variable names listed below.

Start the backend:

```bash
npm run dev
```

In a separate terminal, from the project root, start the frontend:

```bash
npm run dev
```

Open the local frontend URL printed by Vite, typically `http://localhost:5173`.

## Environment Variables

Configure these variables locally in `.env` files as expected by the application. In production, configure them through Vercel and Render dashboards. Do not commit secrets to GitHub.

| Variable | Purpose |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing authentication tokens |
| `RAZORPAY_KEY_ID` | Razorpay API key ID |
| `RAZORPAY_KEY_SECRET` | Private Razorpay API secret |
| `PORT` | Backend port; defaults to `4000` locally |
| `NODE_ENV` | Application environment |
| `CLIENT_ORIGIN` | Frontend origin allowed by backend CORS |
| `ALLOWED_EMAIL_DOMAIN` | Optional allowed email domain |
| `DEPOSIT_GRACE_HOURS` | Grace period used in late-fee calculations |
| `DISPUTE_WINDOW_HOURS` | Post-return dispute window |
| `VITE_API_BASE_URL` | Base URL used by the frontend to call the API |

For local development, `CLIENT_ORIGIN` is typically `http://localhost:5173` and `VITE_API_BASE_URL` is typically `http://localhost:4000/api/v1`. Use your deployed URLs in production.

## Deployment

- **Live Application:** https://lendloop-frontend.vercel.app
- **Backend API:** https://lendloop-api-3cjw.onrender.com
- **Backend Health Check:** https://lendloop-api-3cjw.onrender.com/health

The frontend is deployed on Vercel, the backend on Render, and the database is hosted on MongoDB Atlas.

