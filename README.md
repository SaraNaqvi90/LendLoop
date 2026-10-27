# LendLoop — Borrow More. Buy Less. Build Trust.

**A Peer-to-Peer Lending and Borrowing Platform for Hostel Students**

LendLoop is a full-stack web application designed to help students lend and borrow everyday items within their hostel or campus community. It promotes affordability, sustainability, and responsible sharing through item listings, booking management, refundable deposits, notifications, and community trust.

---

## 1. Problem Statement

Hostel students frequently need items such as chargers, bicycles, textbooks, cameras, sports equipment, and other everyday essentials for short periods.

Purchasing these items individually can be expensive and unnecessary, especially when other students already own them but use them infrequently.

Currently, students often rely on informal WhatsApp groups, personal contacts, or word of mouth to borrow items. These methods introduce several challenges:

- Difficulty finding available items.
- No centralized system for managing lending requests.
- Scheduling conflicts when multiple students request the same item.
- Lack of accountability for damaged or unreturned items.
- No structured deposit or reputation mechanism.
- Difficulty tracking borrowing history and return deadlines.

**LendLoop addresses these problems by creating a centralized, community-driven platform for secure and organized peer-to-peer lending.**

## 2. Target Users

LendLoop is primarily designed for:

- **Hostel students:** Students who want to borrow useful items without purchasing them.
- **Item owners:** Students who want to lend underutilized belongings to others.
- **Campus communities:** Groups seeking to promote affordable and sustainable resource sharing.
- **Administrators:** Authorized users responsible for managing and monitoring platform activity.

## 3. Proposed Solution

LendLoop provides a digital platform where students can discover, list, borrow, and manage shared items within their campus community.

Students can browse items by category, view item details and deposit requirements, and initiate borrowing requests.

Item owners can manage their listings and track lending activity. The platform also provides booking management, wallet functionality, notifications, and user profiles.

The system is designed around three principles:

1. **Accessibility:** Make useful items easily discoverable within the student community.
2. **Accountability:** Encourage responsible borrowing through structured bookings, deposits, and user reputation.
3. **Sustainability:** Reduce unnecessary purchases by encouraging reuse and resource sharing.

## 4. Key Features

### User Authentication and Authorization

- User registration and login.
- JWT-based authentication.
- Protected application routes.
- Session refresh and logout functionality.
- Role-based access to administrative pages.

### Item Discovery and Listings

- Browse items shared by students.
- Search for items using keywords.
- Filter items by category and hostel.
- View item descriptions, conditions, and deposit amounts.
- Create and manage personal item listings.

Supported item categories include electronics, bicycles, books, kitchen equipment, sports equipment, tools, and miscellaneous items.

### Booking Management

- Dedicated booking management interface.
- Item-specific borrowing workflows.
- Tracking of borrowing and lending activity.
- Backend booking service for processing borrowing operations.

The booking system is intended to support date-based availability and prevent conflicting reservations.

### Deposit and Wallet Management

- Display of refundable security deposits.
- Dedicated wallet interface.
- Backend wallet service for handling financial records associated with borrowing.

Deposit lifecycle handling, including deductions and refunds, should be validated through backend testing.

### Notifications

- Dedicated notifications page.
- Backend notification service.
- Infrastructure for communicating booking-related updates.

Automated return reminders can be integrated with scheduled backend jobs.

### Community Trust and Reputation

LendLoop is designed to encourage responsible sharing through borrower accountability and reputation.

The trust system can consider successful returns, late returns, item condition, and borrowing history when determining eligibility for high-value items.

### User Profile

- View account information.
- Access user-specific activity.
- Navigate to personal listings, bookings, and wallet information.

### Administrative Dashboard

- Role-restricted admin interface.
- Dedicated page for administrative operations.
- Foundation for monitoring platform activity and managing community operations.

---

## 5. Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React.js, JavaScript, HTML5, CSS3 |
| Frontend tooling | Vite |
| Routing | React Router |
| Backend | Node.js, Express.js |
| Database | MongoDB |
| Database integration | Mongoose |
| Authentication | JWT-based authentication |
| API communication | REST APIs, Fetch API |
| Development tools | VS Code, Git, GitHub |
| Database hosting | MongoDB Atlas |

## 6. System Architecture

LendLoop follows a client-server architecture with separate frontend, backend, and database components.

### Architecture Diagram

```text
             STUDENT / ADMIN
                    |
                    v
            REACT FRONTEND
          (React + Vite + CSS)
                    |
                    v
             REST API CALLS
                    |
                    v
          NODE.JS + EXPRESS
                    |
       +------------+------------+
       |            |            |
       v            v            v
 Authentication   Item and     Booking
    Module        User APIs     Service
       |            |            |
       +------------+------------+
                    |
             Wallet and
         Notification Services
                    |
                    v
                MONGOOSE
                    |
                    v
              MONGODB ATLAS
```

### Frontend Architecture

The frontend is built using React and organized into reusable components, pages, context providers, and API services.

Major components include:

- `App.jsx` — application routes and protected pages.
- `AuthContext.jsx` — authentication state and session management.
- `Shell.jsx` — common navigation and application layout.
- `Pages.jsx` — item browsing, listings, bookings, wallet, notifications, profiles, and admin pages.
- `api.js` — centralized API requests, authentication headers, and token refresh handling.

### Backend Architecture

The backend uses Node.js and Express with a modular structure.

Major backend directories include:

- `config/` — database and application configuration.
- `models/` — database schemas.
- `routes/` — API route definitions.
- `controllers/` — HTTP request handling.
- `services/` — application business logic.
- `middleware/` — authentication, authorization, and request processing.
- `jobs/` — background task infrastructure.
- `utils/` — shared utility functions.

The application separates API request handling from business logic to improve maintainability and scalability.

### Database Architecture

MongoDB stores application data associated with users, item listings, bookings, and other platform operations.

Mongoose provides schema-based modeling and database interaction.

The intended data relationships include:

- One user can list multiple items.
- One item can receive multiple borrowing requests over time.
- Each booking connects an item owner, borrower, and item.
- Wallet records represent deposit-related activity.
- Notifications communicate important account and booking events.

## 7. Local Setup and Installation

### Prerequisites

Ensure the following are installed:

- Node.js and npm
- Git
- MongoDB Atlas account or a local MongoDB instance
- Visual Studio Code or another code editor

### Step 1: Clone the Repository

```bash
git clone https://github.com/SaraNaqvi90/LendLoop.git
cd LendLoop
```

### Step 2: Install Frontend Dependencies

From the project root:

```bash
npm install
```

### Step 3: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 4: Configure Environment Variables

Create the required `.env` files using the environment variable instructions below.

### Step 5: Start the Backend

From the `backend` directory:

```bash
npm run dev
```

Use the start command defined in `backend/package.json` if it differs.

### Step 6: Start the Frontend

Open a second terminal in the project root and run:

```bash
npm run dev
```

The Vite development server normally runs at:

```text
http://localhost:5173
```

The backend API is configured separately. The frontend defaults to:

```text
http://localhost:4000/api/v1
```

Ensure the backend is running at the configured address before testing application features.

## 8. Environment Variables

Environment variables are used to store database configuration, authentication secrets, and application settings.

### Frontend Configuration

Create a `.env` file in the project root:

```env
VITE_API_BASE_URL=http://localhost:4000/api/v1
```

### Backend Configuration

Configure the backend environment with the values required by its server and database initialization code.

Example configuration:

```env
PORT=4000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

These are illustrative variable names; the actual backend variable names must match the application source code.

**Security:** Never commit real `.env` files, database passwords, JWT secrets, or API credentials to GitHub.


## 10. Future Enhancements

Planned improvements include:

- Interactive availability calendars.
- Stronger booking conflict prevention with concurrency-safe reservations.
- Automated return reminders through scheduled jobs.
- A calculated trust score based on borrowing behavior.
- Trust-based restrictions for high-value items.
- Improved dispute resolution for damaged or unreturned items.
- Campus email verification.
- Enhanced administrative reporting and analytics.
- Mobile-responsive improvements and accessibility enhancements.

## 11. Project Impact

LendLoop aims to make hostel life more affordable, convenient, and sustainable by transforming individually owned items into shared community resources.

By reducing unnecessary purchases and providing a structured lending process, the platform encourages collaboration, responsible ownership, and trust among students.

**Borrow More. Buy Less. Build Trust.**

---

*Note: Booking conflict handling, automated reminders, reputation calculations, and complete deposit processing require backend verification before being presented as fully tested functionality.*