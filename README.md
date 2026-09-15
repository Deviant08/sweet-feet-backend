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

The live site on Render + MongoDB Atlas is unchanged. This is a **separate**
database on your machine.

```bash
cd sweet-feet-backend
cp .env.example .env
# .env already points at local Mongo:
#   DATABASE_HOSTED=mongodb://127.0.0.1:27017/sweetfeet
#   NODE_ENV=development
# Do not paste the Atlas mongodb+srv URI here.

docker compose up -d          # local Mongo on port 27017
npm install
npm run dev                   # API on http://localhost:5000
npm run seed                  # demo retailers + products (local only)
```

API base: **`http://localhost:5000/api/v1`**

Chat socket: **`ws://localhost:5000/ws/chat?token=JWT`**

Health check: `GET http://localhost:5000/` → `{ message: "Welcome to Sweet Feet API" }`

Demo logins (password `SweetFeet123!`):

| Role | Email |
|------|--------|
| Customer | `customer@sweetfeet.demo` |
| Retailer | `lagoskicks@sweetfeet.demo` |
| Retailer | `abuja.style@sweetfeet.demo` |
| Admin | `admin@sweetfeet.demo` |

Seed is **blocked on Render** so it cannot overwrite Atlas.

## Link to frontend

Live Vercel keeps using Render. To try the shop against **your** database,
open the shop once and in the browser console:

```js
localStorage.setItem("sf_api_base", "http://localhost:5000/api/v1");
location.reload();
```

To go back to the live API:

```js
localStorage.removeItem("sf_api_base");
location.reload();
```

`window.SF_API_BASE` still overrides everything if you set it.

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
| `npm run db:up` | Start local Mongo (Docker) |
| `npm run db:down` | Stop local Mongo |
| `npm run seed` | Load demo catalogue into **local** Mongo |

## Security notes

- **Never commit `.env`** — only `.env.example`
- Rotate any secrets that were ever pushed to GitHub
- JWT: `Authorization: Bearer <token>` or cookie `jwt`
- Retailer tokens include `type: "retailer"`; customers use `type: "user"`
