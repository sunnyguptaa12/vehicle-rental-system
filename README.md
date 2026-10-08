# Vehicle Rental Management System

A full-stack vehicle rental platform built with React + Vite on the frontend and Core Java + JDBC + MySQL on the backend. The project is designed to be GitHub-ready and interview-friendly while following the requested architecture and restrictions.

## Features

- Customer registration and login
- Admin login with protected routes
- Vehicle search, filtering, sorting, and availability checks
- Booking creation with date validation and overlap checks
- Simulated payment flow with payment status tracking
- Booking history, confirmation, cancellation, and return processing
- Admin dashboard with vehicle, customer, booking, and revenue statistics
- JDBC-based DAO and service-layer architecture
- Responsive Tailwind UI

## Booking and Payment Flow

Select both a start date and an end date before the rental total is calculated or a booking can be submitted. The displayed total is based on the selected vehicle's daily rate, inclusive rental days, and 5% tax. The backend recalculates and stores the amount when creating the booking; payment requests use that stored amount rather than a client-provided value.

Creating a booking reserves the selected dates with a `PENDING_PAYMENT` status. The payment record is created only after the customer confirms payment. Retrying payment for a booking that is already paid returns the existing payment instead of creating a duplicate.

Customers can view their bookings, cancel future pending or confirmed bookings (a demo payment is marked as refunded), and return confirmed/active rentals from **My Bookings**. The payment-success page loads the saved booking and payment details for its printable receipt.

## Tech Stack

Frontend
- React.js
- Vite
- Tailwind CSS
- React Router DOM
- Axios

Backend
- Java 17
- Maven
- MySQL 8+
- JDBC
- Core Java HTTP Server

## Project Structure

```text
vehicle-rental-system/
├── backend/
│   ├── pom.xml
│   └── src/main/java/com/vehiclerental/
│       ├── Main.java
│       ├── config/
│       ├── controller/
│       ├── model/
│       ├── dao/
│       ├── service/
│       ├── exception/
│       └── util/
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   └── src/
├── database/
│   └── schema.sql
├── README.md
├── .gitignore
└── package-lock.json (generated after npm install)
```

## Database Setup

1. Start MySQL 8+
2. Create the database and tables:

```sql
source database/schema.sql;
```

3. Set environment variables for the backend:

```bash
export DB_URL=jdbc:mysql://localhost:3306/vehicle_rental_db
export DB_USERNAME=root
export DB_PASSWORD=
```

If your local MySQL install uses a non-empty root password, set it accordingly. The default project configuration now falls back to an empty password for local root-only setups.

For a new installation, create the first admin account by setting `ADMIN_USERNAME` and `ADMIN_PASSWORD` before starting the backend. The password must be at least 12 characters. Existing local databases that already contain an admin continue to work without these variables.

## Backend Setup

```bash
cd backend
mvn clean install
mvn exec:java -Dexec.mainClass=com.vehiclerental.Main
```

The backend will run on:
- http://localhost:8080

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal.

## Production Deployment (Vercel + Render + Aiven)

The frontend is deployed to Vercel, the Java API runs as a Docker web service on Render, and MySQL is hosted on Aiven.

### 1. Create the Aiven database

1. Create an Aiven for MySQL service and a database named `vehicle_rental_db`.
2. Run `database/schema.sql` once against that database. It creates the tables and fleet inventory; it does not create demo users, bookings, payments, or a default admin.
3. Keep Aiven's hostname, port, database username, and password private. Use TLS in the JDBC URL:

```text
jdbc:mysql://AIVEN_HOST:AIVEN_PORT/vehicle_rental_db?sslMode=REQUIRED
```

### 2. Deploy the backend to Render

1. Push this repository to GitHub and create a Render Blueprint from it using `render.yaml`.
2. Set the Blueprint's environment variables in Render:
   - `DB_URL`: the Aiven JDBC URL above
   - `DB_USERNAME` and `DB_PASSWORD`: the Aiven database credentials
   - `ADMIN_USERNAME`: the admin username you choose
   - `ADMIN_PASSWORD`: a unique password of at least 12 characters
   - `CORS_ALLOWED_ORIGINS`: initially set the Vercel origin you plan to use (no trailing slash)
3. Deploy and verify `https://YOUR-RENDER-SERVICE.onrender.com/api/health` returns HTTP 200.

The configured admin user is created/updated from Render environment variables at backend startup. Never use the local demo credentials on a public deployment.

### 3. Deploy the frontend to Vercel

1. Import the same GitHub repository in Vercel and set **Root Directory** to `frontend`.
2. Add the Vercel environment variable `VITE_API_BASE_URL` with the Render API URL ending in `/api`, for example:

```text
https://YOUR-RENDER-SERVICE.onrender.com/api
```

3. Deploy. `frontend/vercel.json` provides SPA route fallback for refreshed/deep links.
4. After Vercel assigns the production domain, make sure that exact origin is in Render's `CORS_ALLOWED_ORIGINS`, then redeploy/restart the API. If the origin wasn't known for the first Render deploy, use a temporary value, deploy Vercel, then replace it with the assigned origin.

Enter Aiven and admin secrets directly in the Render Environment settings; do not send them in chat or commit them. Do not commit `.env` files or production credentials. Session tokens and dashboard live events are held in backend memory; keep a single Render instance unless shared session/event storage is added.

## API Overview

### Authentication
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/admin-login

### Vehicles
- GET /api/vehicles
- GET /api/vehicles/{id}
- GET /api/vehicles/available
- GET /api/vehicles/search
- POST /api/vehicles
- PUT /api/vehicles/{id}
- DELETE /api/vehicles/{id}

### Bookings
- POST /api/bookings
- GET /api/bookings/{id}
- GET /api/bookings/customer/{customerId}
- GET /api/bookings
- PUT /api/bookings/{id}/return
- PUT /api/bookings/{id}/cancel

### Payments
- POST /api/payments
- GET /api/payments/{bookingId}
- GET /api/payments

### Admin
- GET /api/admin/dashboard
- GET /api/admin/customers
- GET /api/admin/bookings
- GET /api/admin/revenue

## Notes

This project follows the requested stack restrictions and architecture: React frontend communicating with a Core Java REST API that uses JDBC to interact with MySQL. All database work goes through DAO classes and the service layer.

## Future Improvements

- Replace in-memory login sessions with a shared, durable session/token store before scaling beyond one backend instance
- Integrate a real payment gateway and transactional notifications
- Add image upload support for vehicle listings
- Add booking reminders and late-fee scheduling
