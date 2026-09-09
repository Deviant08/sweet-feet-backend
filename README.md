# Sweet Feet Backend

Standalone **TypeScript + Express + MongoDB** API for the [Sweet Feet](https://github.com/Deviant08/Sweet-Feet) multi-vendor footwear marketplace.

Frontend repo: [Deviant08/Sweet-Feet](https://github.com/Deviant08/Sweet-Feet)

## Stack

- Node.js ≥ 16
- Express + TypeScript
- MongoDB (Mongoose)
- JWT auth (customers & retailers)
- Paystack payments
- WebSocket chat at `/ws/chat`

## Setup (local)

```bash
cd sweet-feet-backend
cp .env.example .env
# edit .env — MongoDB URI, JWT_SECRET, Paystack keys, CORS_ORIGINS

npm install
npm run dev
```

API base: **`http://localhost:5000/api/v1`**

Chat socket: **`ws://localhost:5000/ws/chat?token=JWT`**

Health check: `GET http://localhost:5000/` → `{ message: "Welcome to Sweet Feet API" }`

## Link to frontend

The frontend uses `js/api.js`:

```js
API_BASE = "http://localhost:5000/api/v1"
window.SF_API_BASE = "https://YOUR-BACKEND-HOST/api/v1"
window.SF_WS_URL = "wss://YOUR-BACKEND-HOST/ws/chat"
```

CORS is controlled by `CORS_ORIGINS` in `.env` (comma-separated, no trailing slash).

## Chat protocol (`/ws/chat`)

Connect with `?token=<JWT>` (or cookie `jwt`).

Client → server:
- `{ "type": "join", "partnerId": "<other party id>" }`
- `{ "type": "message", "text": "hello", "partnerId": "...", "productId": "optional" }`
- `{ "type": "typing", "on": true }`
- `{ "type": "ping" }`

Server → client:
- `{ "type": "ready", "self": { "id", "role", "name" } }`
- `{ "type": "joined", "room" }`
- `{ "type": "message", "data": { ...saved Message } }`
- `{ "type": "inbox", "partnerId", "last_message" }`
- `{ "type": "typing", "on", "from" }`
- `{ "type": "error", "message" }`

REST `/api/v1/messages` is still used to load history.

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
