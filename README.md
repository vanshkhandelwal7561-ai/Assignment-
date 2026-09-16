# Equipment Rental Management System

A college AV-room rental system for tracking equipment, availability, bookings, returns, late fees, deposits, and borrower limits. The application is built for a small assessment-friendly workflow: authenticated students can browse and book equipment, while admins manage inventory and monitor rentals.

## Features

- User registration and login with bcrypt and JWT
- Protected routes and admin-only operations
- Equipment list with multiple physical units
- Admin equipment add, edit, and deactivation
- Date-range availability checks with inclusive overlap detection
- Booking quantity and borrowing-limit validation
- My rentals and admin all-rentals views
- Equipment return workflow
- Overdue and due-soon reminders
- Late-day calculation, late fees, and refundable deposits
- Codespaces-compatible Vite and Express servers

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, React Router, Axios
- Backend: Node.js, Express.js
- Database: MongoDB Atlas with Mongoose
- Authentication: JWT and bcrypt

## Requirements

- Node.js 20 or newer
- npm
- MongoDB Atlas account and cluster
- MongoDB Atlas network access configured for the development environment

## Installation

From the repository root:

```bash
cd equipment-rental/server
npm install

cd ../client
npm install
```

## Environment Variables

Create the backend environment file:

```bash
cd equipment-rental/server
cp .env.example .env
```

Set these values in `server/.env`:

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/equipment_rental
JWT_SECRET=replace-with-a-long-random-secret
PORT=5000
```

The client uses `/api` by default. This is proxied by Vite to the backend and works with forwarded GitHub Codespaces ports. A client `.env` is normally not needed; if created, use:

```env
VITE_API_URL=/api
```

Never commit `.env` files or real credentials.

## MongoDB Setup

1. Create a MongoDB Atlas cluster.
2. Create a database user and password.
3. Add the Codespace network address under Atlas **Network Access**. For a short-lived assessment environment, `0.0.0.0/0` can be used temporarily, then removed.
4. Copy the Atlas connection string into `server/.env`.
5. Use a database name such as `equipment_rental` in the URI.

The backend connects to MongoDB before listening on port 5000 and logs either a success or a clear connection error.

## Run the Frontend

In one terminal:

```bash
cd equipment-rental/client
npm run dev
```

Open the forwarded port 5173 in Codespaces.

## Run the Backend

In a second terminal:

```bash
cd equipment-rental/server
npm run dev
```

The API listens on port 5000. The server binds to `0.0.0.0` for Codespaces access.

## API Endpoints

### Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Equipment

- `GET /api/equipment` - authenticated users
- `GET /api/equipment/:id` - authenticated users
- `GET /api/equipment/:id/availability?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` - authenticated users
- `POST /api/equipment` - admins
- `PUT /api/equipment/:id` - admins
- `DELETE /api/equipment/:id` - admins; deactivates equipment with rental history

### Rentals

- `POST /api/rentals` - authenticated users
- `GET /api/rentals/my` - authenticated users
- `GET /api/rentals/:id` - owner or admin
- `GET /api/rentals` - admins
- `POST /api/rentals/:id/return` - borrower or admin

### Health

- `GET /api/health`

Send protected requests with:

```text
Authorization: Bearer <JWT>
```

## Business Rules

- New users have role `USER` by default.
- Admin-only equipment mutations require role `ADMIN`.
- A rental is initially `BOOKED`.
- A rental overlap exists when:

```text
existing.startDate <= requested.endDate
AND existing.expectedReturnDate >= requested.startDate
```

- `BOOKED`, `ACTIVE`, and `OVERDUE` rentals reserve equipment units.
- Available quantity is never negative.
- A user may have at most 5 active/upcoming units.
- Equipment with rental history is deactivated rather than deleted.
- A return can be processed only by the borrower or an admin.
- A returned rental cannot be returned again.

## Financial Formulas

Late days:

```text
lateDays = max(0, calendar days between actualReturnDate and expectedReturnDate)
```

Late fee:

```text
lateFee = lateDays × equipment.dailyLateFee × rental.quantity
```

Booking deposit:

```text
depositAmount = quantity × equipment.depositPerUnit
```

Refund:

```text
refundableAmount = max(0, depositAmount - lateFee)
```

## Borrowing Limit

```text
existing active/upcoming units + requested quantity <= 5
```

Returned and cancelled rentals do not count toward this limit.

## Troubleshooting

### `npm run dev` says package.json is missing

Run the command from the app directory, not the repository root:

```bash
cd equipment-rental/server
npm run dev
```

For the frontend:

```bash
cd equipment-rental/client
npm run dev
```

### MongoDB connection fails

Check that `server/.env` exists, `MONGO_URI` is non-empty, the Atlas username/password are correct, and the Codespace IP/network is allowed in Atlas Network Access.

### Frontend cannot reach the API in Codespaces

Use the forwarded frontend port 5173. Keep `VITE_API_URL=/api` or unset it so Vite proxies `/api` to port 5000. Do not use a browser-side `http://localhost:5000` URL in Codespaces.

### Equipment page says authentication is required

Open `/auth`, create an account or sign in, then return to the dashboard. The JWT is stored in browser local storage for protected API requests.

### Port already in use

Inspect listeners with:

```bash
ss -ltnp | grep -E ':(5000|5173)\\b'
```

Stop the old project process or use a different port and update the corresponding configuration.

## Verification Commands

```bash
cd equipment-rental/client
npm run lint
npm run build

cd ../server
node --check server.js
curl http://localhost:5000/api/health
```
