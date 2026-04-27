# Cloth Rentals

A full-stack web application for renting clothing items online. Users can browse outfits, check date availability, and book rentals. Admins manage inventory, approve accounts, and track returns.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router, Axios |
| Backend | Node.js, Express |
| Database | MongoDB (Mongoose) |
| Image Storage | Cloudinary |
| Auth | JWT + bcrypt |

## Project Structure

```
cloth-rentals/
├── client/          # React + Vite frontend
├── server/          # Node.js + Express backend
├── scripts/         # Dev runner (starts both together)
└── docs/            # Project documentation & one-time scripts
```

## Getting Started

### Prerequisites

- Node.js v18+
- A MongoDB URI (or run without one — the app uses a built-in in-memory store automatically)
- A Cloudinary account (for image uploads)

### 1. Clone the repo

```bash
git clone https://github.com/abhi-2667/cloth-rentals.git
cd cloth-rentals
```

### 2. Install dependencies

```bash
# Root
npm install

# Client
cd client && npm install

# Server
cd ../server && npm install
```

### 3. Set up environment variables

```bash
cp server/.env.example server/.env
```

Edit `server/.env` and fill in your values:

```env
PORT=5000
MONGO_URI=your_mongodb_uri        # leave blank to use built-in dev store
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

```bash
cp client/.env.example client/.env
```

Edit `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Run the app

```bash
# From the root — starts both client and server together
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## Demo Accounts

These are seeded automatically on first run:

| Role | Email | Password |
|---|---|---|
| Admin | admin@cloth-rental.local | Admin1234! |
| User | user@cloth-rental.local | User1234! |

## Features

**Users**
- Browse and filter clothing by category, occasion, and gender
- Check real-time date availability before booking
- Book outfits for a date range with automatic price calculation
- Request returns and track booking history
- In-app notifications

**Admins**
- Approve or reject new user registrations
- Add, edit, and toggle availability of clothing items
- Track all active bookings and confirm returns
- View platform activity summary

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/clothes` | List all clothes |
| POST | `/api/clothes` | Add a new item (admin) |
| GET | `/api/bookings/cloth/:id/blocked` | Get blocked date ranges |
| POST | `/api/bookings` | Create a booking |
| PUT | `/api/bookings/:id/cancel` | Cancel a booking |
| PUT | `/api/bookings/:id/return-request` | Request a return |
| GET | `/api/users/profile` | Get current user profile |

Full API reference: `docs/postman/cloth-rental.postman_collection.json`

## License

MIT
