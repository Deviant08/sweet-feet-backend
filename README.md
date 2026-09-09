# Sweet Feet Backend

Standalone **TypeScript + Express + MongoDB** API for the [Sweet Feet](https://github.com/Deviant08/Sweet-Feet) multi-vendor footwear marketplace.

Frontend repo: [Deviant08/Sweet-Feet](https://github.com/Deviant08/Sweet-Feet)

## Stack

- Node.js ≥ 16
- Express + TypeScript
- MongoDB (Mongoose)
- JWT auth (customers & retailers)
- Paystack payments

## Setup (local)

```bash
cd sweet-feet-backend
cp .env.example .env
# edit .env — MongoDB URI, JWT_SECRET, Paystack keys, CORS_ORIGINS

npm install
npm run dev
```

API base: **`http://localhost:5000/api/v1`**

Health check: `GET http://localhost:5000/` → `{ message: "Welcome to Sweet Feet API" }`

## Link to frontend

The frontend uses `js/api.js`:

```js
// default for local
API_BASE = "http://localhost:5000/api/v1"

// production — set before modules load, or change the default:
window.SF_API_BASE = "https://YOUR-BACKEND-HOST/api/v1"
```

CORS is controlled by `CORS_ORIGINS` in `.env` (comma-separated, no trailing slash).

## Main routes (`/api/v1`)

| Area | Paths |
|------|--------|
| Auth | `POST /auth/register`, `/auth/login`, `/auth/retailer/register`, `/auth/retailer/login`, `/auth/logout`, `GET /auth/me` |
| Products | `GET /products`, `GET /products/:id`, `GET /products/mine`, `POST/PATCH/DELETE /products` |
| Orders | `POST /orders`, `POST /orders/verify`, `GET /orders/mine`, `GET /orders/retailer`, `PATCH /orders/item-status` |
| Retailers | `GET /retailers`, `GET /retailers/:id`, `PATCH /retailers/:id/status` (admin) |
| Messages | under `/messages` |
| Feedback | under `/feedback` |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Compile + watch + run |
| `npm run build` | `tsc` → `dist/` |
| `npm start` | Run `dist/server.js` (production) |

## Security notes

- **Never commit `.env`** — only `.env.example`
- Rotate any secrets that were ever pushed to GitHub
- JWT: `Authorization: Bearer <token>` or cookie `jwt`
- Retailer tokens include `type: "retailer"`; customers use `type: "user"`
