# 💸 Expense Tracker

A full-stack personal finance tracker — log income and expenses, categorize spending, and see where your money goes. Built with a React (Vite) frontend and an Express/MongoDB REST API, secured with JWT authentication.

## Features

- 🔐 User registration and login with hashed passwords (bcrypt) and JWT-based auth
- 💰 Add, view, and delete income/expense transactions
- 🗂️ Categorize transactions and tag a payment method (Cash, Credit Card, Debit Card, Bank Transfer)
- 📊 Visual breakdowns of spending (charts on the dashboard, powered by Recharts)
- 🌓 Per-user theme and currency preference stored on the account (USD, INR, EUR, GBP, CAD)
- 🔒 Transactions are scoped to the logged-in user — no one can read or delete another user's data

## Tech Stack

**Frontend** — `FRONTEND/my-react-app`
- React 19 + Vite
- React Router for page navigation (`/login`, `/register`, `/dashboard`)
- Axios for API calls
- Recharts for charts

**Backend** — `BACKEND`
- Node.js + Express 5
- MongoDB with Mongoose
- JWT (`jsonwebtoken`) for authentication
- bcryptjs for password hashing
- dotenv for configuration, cors for cross-origin requests

## Project Structure

```
expense-tracker/
├── BACKEND/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/
│   │   ├── transactionController.js
│   │   └── userController.js
│   ├── middleware/
│   │   └── authMiddleware.js      # JWT verification (protect route)
│   ├── models/
│   │   ├── transaction.js
│   │   └── user.js
│   ├── routes/
│   │   ├── transactionRoutes.js
│   │   └── userRoutes.js
│   ├── server.js                  # App entry point
│   └── package.json
│
└── FRONTEND/
    └── my-react-app/
        ├── src/
        │   ├── pages/
        │   │   ├── login/
        │   │   ├── register/
        │   │   └── dashboard/
        │   ├── App.jsx
        │   └── main.jsx
        ├── index.html
        └── package.json
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- A MongoDB instance — either a local MongoDB server or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

### 1. Clone the repo

```bash
git clone https://github.com/Venom-2006/expense-tracker.git
cd expense-tracker
```

### 2. Set up the backend

```bash
cd BACKEND
npm install
```

Create a `.env` file inside `BACKEND/`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

Start the API server:

```bash
npx nodemon server.js
# or: node server.js
```

The API will run at `http://localhost:5000`.

### 3. Set up the frontend

In a separate terminal:

```bash
cd FRONTEND/my-react-app
npm install
npm run dev
```

The app will run at the URL Vite prints (typically `http://localhost:5173`).

> **Note:** the frontend currently calls the API at a hardcoded `http://localhost:5000` base URL. If you deploy the backend elsewhere, update those calls (or introduce an environment variable, e.g. `VITE_API_URL`) accordingly.

## API Reference

All transaction routes require an `Authorization: Bearer <token>` header, obtained from login/register.

| Method | Endpoint                  | Description                          | Auth required |
|--------|----------------------------|---------------------------------------|:--:|
| POST   | `/api/users/register`      | Create a new account                  | ❌ |
| POST   | `/api/users/login`         | Log in and receive a JWT              | ❌ |
| POST   | `/api/users/profile`       | Get a user's profile by `userId`      | ❌ |
| GET    | `/api/transactions`        | Get all transactions for the logged-in user | ✅ |
| POST   | `/api/transactions`        | Create a new transaction              | ✅ |
| DELETE | `/api/transactions/:id`    | Delete a transaction (owner only)     | ✅ |

### Transaction fields

| Field | Type | Notes |
|---|---|---|
| `title` | String | required, max 50 chars |
| `amount` | Number | required, > 0 |
| `type` | String | `"income"` or `"expense"` |
| `category` | String | required |
| `paymentMethod` | String | one of `Cash`, `Credit Card`, `Debit Card`, `Bank Transfer` |
| `notes` | String | optional, max 200 chars |
| `date` | Date | defaults to now |

## Roadmap / Ideas

- [ ] Edit existing transactions
- [ ] Filter/search transaction history by date range or category
- [ ] Export transactions to CSV
- [ ] Recurring transactions / budgets

## Contributing

Issues and pull requests are welcome. If you're planning a larger change, please open an issue first to discuss what you'd like to change.

## License

No license has been specified for this project yet. Consider adding one (e.g. [MIT](https://choosealicense.com/licenses/mit/)) so others know how they can use this code.
