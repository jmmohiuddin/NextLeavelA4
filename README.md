# 🏋️ GearUp — Sports & Outdoor Gear Rental API

A robust, production-ready REST API for a sports and outdoor equipment rental platform. Built with Node.js, Express, TypeScript, PostgreSQL, and Prisma ORM. Integrated with **SSLCommerz** for real payment processing.

---

## 🔐 Admin Credentials

```
Admin Email    : admin@gearup.com
Admin Password : Admin@1234
```

**Other Demo Accounts:**
```
Provider Email : provider1@gearup.com  | Password: Provider@1234
Provider Email : provider2@gearup.com  | Password: Provider@1234
Customer Email : customer@gearup.com   | Password: Customer@1234
```

---

## 🚀 Live Deployment

| Resource | Link |
|----------|------|
| **Live API** | `https://gearup-backend-eta.vercel.app` |
| **API Docs** | [Postman Collection (Local JSON)](./gearup.postman_collection.json) |
| **GitHub Repo** | `https://github.com/jmmohiuddin/NextLeavelA4` |

---

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| Node.js + Express | REST API Framework |
| TypeScript | Type Safety |
| PostgreSQL | Relational Database |
| Prisma ORM | Database Access & Migrations |
| JWT (jsonwebtoken) | Authentication |
| bcryptjs | Password Hashing |
| Zod | Input Validation |
| SSLCommerz | Payment Gateway |
| Helmet | Security Headers |
| Morgan | HTTP Logging |
| CORS | Cross-Origin Resource Sharing |

---

## 📁 Project Structure

```
gearup-backend/
├── prisma/
│   ├── schema.prisma          # Database schema (6 models)
│   └── seed.ts                # Database seed script
├── src/
│   ├── config/
│   │   ├── config.ts          # Environment config
│   │   └── prisma.ts          # Prisma client singleton
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── gear.controller.ts
│   │   ├── rental.controller.ts
│   │   ├── payment.controller.ts
│   │   ├── provider.controller.ts
│   │   ├── review.controller.ts
│   │   └── admin.controller.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts      # JWT verification
│   │   ├── role.middleware.ts      # RBAC guard
│   │   ├── validate.middleware.ts  # Zod validation
│   │   └── error.middleware.ts     # Global error handler
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── gear.routes.ts
│   │   ├── rental.routes.ts
│   │   ├── payment.routes.ts
│   │   ├── provider.routes.ts
│   │   ├── review.routes.ts
│   │   └── admin.routes.ts
│   ├── validations/
│   │   ├── auth.validation.ts
│   │   ├── gear.validation.ts
│   │   ├── rental.validation.ts
│   │   └── payment.review.validation.ts
│   ├── utils/
│   │   ├── response.ts            # Standardized API responses
│   │   └── jwt.ts                 # JWT sign/verify helpers
│   ├── app.ts                     # Express app setup
│   └── server.ts                  # Server entry point
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## ⚙️ Local Setup

### Prerequisites
- Node.js v18+
- PostgreSQL database (local or cloud: [Neon](https://neon.tech), [Supabase](https://supabase.com), [Railway](https://railway.app))
- SSLCommerz sandbox account (free at [developer.sslcommerz.com](https://developer.sslcommerz.com))

### 1. Clone & Install

```bash
git clone https://github.com/your-username/gearup-backend.git
cd gearup-backend
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/gearup?schema=public"
JWT_SECRET="your_very_secret_key_here"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV="development"

# SSLCommerz (Get from https://developer.sslcommerz.com)
SSLCOMMERZ_STORE_ID="your_store_id"
SSLCOMMERZ_STORE_PASSWORD="your_store_password"
SSLCOMMERZ_IS_LIVE=false

BASE_URL="http://localhost:5000"
CLIENT_URL="http://localhost:3000"
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed with demo data
npm run seed
```

### 4. Start Development Server

```bash
npm run dev
```

Server runs at: `http://localhost:5000`

---

## 📡 API Endpoints

### Base URL
```
http://localhost:5000/api
```

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Register (customer/provider) | Public |
| POST | `/auth/login` | Login, returns JWT | Public |
| GET | `/auth/me` | Get current user | 🔒 Any |

### Gear (Public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/gear` | All gear (filter: category, brand, price, search) |
| GET | `/gear/:id` | Gear details with reviews |
| GET | `/categories` | All categories |

### Rentals

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/rentals` | Create rental order | 🔒 Customer |
| GET | `/rentals` | My rental orders | 🔒 Customer |
| GET | `/rentals/:id` | Rental details | 🔒 Customer/Provider/Admin |

### Payments (SSLCommerz)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/payments/create` | Create payment session | 🔒 Customer |
| POST | `/payments/confirm/success` | SSLCommerz success callback | Public |
| POST | `/payments/confirm/ipn` | SSLCommerz IPN | Public |
| POST | `/payments/confirm/fail` | SSLCommerz fail callback | Public |
| POST | `/payments/confirm/cancel` | SSLCommerz cancel callback | Public |
| GET | `/payments` | My payment history | 🔒 Customer |
| GET | `/payments/:id` | Payment details | 🔒 Customer/Admin |

### Provider

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/provider/gear` | Add gear to inventory | 🔒 Provider |
| PUT | `/provider/gear/:id` | Update gear listing | 🔒 Provider |
| DELETE | `/provider/gear/:id` | Remove gear | 🔒 Provider |
| GET | `/provider/orders` | View incoming orders | 🔒 Provider |
| PATCH | `/provider/orders/:id` | Update order status | 🔒 Provider |

### Reviews

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/reviews` | Submit review (RETURNED orders only) | 🔒 Customer |

### Admin

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/admin/users` | All users | 🔒 Admin |
| PATCH | `/admin/users/:id` | Suspend/activate user | 🔒 Admin |
| GET | `/admin/gear` | All gear listings | 🔒 Admin |
| GET | `/admin/rentals` | All rental orders | 🔒 Admin |

---

## 📊 Rental Order Status Flow

```
PLACED → CONFIRMED (by Provider)  OR  CANCELLED (by Provider)
CONFIRMED → PAID (after SSLCommerz payment)
PAID → PICKED_UP (by Provider)
PICKED_UP → RETURNED (by Provider)
```

---

## 🔐 Consistent Error Response Format

All errors follow this structure:

```json
{
  "success": false,
  "message": "Descriptive error message.",
  "errorDetails": { ... }
}
```

All success responses follow this structure:

```json
{
  "success": true,
  "message": "Descriptive success message.",
  "data": { ... },
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10
  }
}
```

---

## 💳 Payment Flow (SSLCommerz)

1. Provider confirms rental order → status: `CONFIRMED`
2. Customer calls `POST /api/payments/create` with `rentalOrderId`
3. API creates SSLCommerz session → returns `gatewayUrl`
4. Customer completes payment on SSLCommerz gateway
5. SSLCommerz calls `POST /api/payments/confirm/success` (IPN)
6. API validates the payment → updates order status to `PAID`

---

## 🚀 Deployment (Render)

1. Push to GitHub
2. Create a new **Web Service** on [Render](https://render.com)
3. Connect your repository
4. Set build command: `npm install && npm run build && npm run prisma:migrate:prod`
5. Set start command: `npm start`
6. Add all environment variables from `.env.example`
7. Add `DATABASE_URL` from Render's PostgreSQL or Neon

---

## 🎥 Demo Video

**Duration:** 3-5 minutes  
**Link:** [Google Drive / Loom Link Here]

**Covers:**
- Project overview
- All 3 roles (Admin, Provider, Customer) via Postman
- Full rental flow: Register → Browse → Order → Pay → Return → Review
- Error handling demonstrations
- Validation examples

---

*Built for Programming Hero Assignment 4 — GearUp 🏋️*

