# Offline UPI Payment Simulation using Mesh Network (MERN)

A simulation of offline digital payments. A payment made with no internet is signed, stored on the phone,
relayed across a simulated mesh of phones, and settled by the server when a "bridge" phone gets internet.
**No real Bluetooth is used.** Do not call this "real offline UPI".

## Run locally
Server: `cd server && cp .env.example .env` (set MONGO_URI, JWT_SECRET, ADMIN_EMAIL) `&& npm install && npm run dev`
Client: `cd client && npm install && npm run dev` then open http://localhost:5173
(The Offline PWA cache works only after `npm run build && npm run preview` or when deployed.)

## Demo script
1. Register two users (one with the ADMIN_EMAIL). Each gets Rs 5000 and a signing key created on the device.
2. User 1: tap "Online" in the top bar (it becomes Offline). Send 500 to user 2's UPI ID. A signed packet is saved as PENDING.
3. Mesh page: "Run mesh round" x3. The packet hops A, B, C, Bridge, then the server settles it.
4. Try "Attack: replay" (Duplicate packet) and "Attack: tamper" (Invalid signature).
5. Turn Bridge internet OFF to show a packet waiting at the Bridge. Admin page shows the server view.

## Stages
1. Setup: GET /api/health
2. Auth, user, wallet: /api/auth/register|login|me, /api/wallet, /api/users/lookup/:upiId
3. Send money: POST /api/payment/send (atomic debit), GET /api/payment/transactions
4. Offline: IndexedDB packets, ECDSA signing (Web Crypto), POST /api/bridge/sync, POST /api/users/public-key
5. Mesh: /api/mesh/devices, Mesh page animation, attack demos
6. Security, UI, deploy: see below

## How double-spending is handled
- Each packet has a unique `packetId`. The server inserts it into `offlinepackets` (unique index) BEFORE moving money,
  so the same packet can settle only once, even if two bridges upload it together.
- Balance is checked on the server at sync time with an atomic debit. If the sender overspent offline, the packet is REJECTED.
- Offline packets are limited to Rs 2000 each and the app blocks spending more than the last known balance.
- The receiver should treat an offline payment as PENDING until the server settles it. That is the real limitation of offline payments.

## Security in this project
- bcrypt password hashes, JWT auth, generic login errors, login/register/payment rate limits, helmet headers, 100kb body limit
- typeof checks on inputs (blocks NoSQL operator injection)
- ECDSA P-256 signatures: private key is non-extractable and stays in IndexedDB; the server stores only the public key.
  A bridge cannot change a packet. Invalid packets are not stored, so nobody can "burn" a packetId.
- Known limits: JWT in localStorage (XSS risk), one signing key per device (new device = no offline payments), shared mesh device flags,
  no real Bluetooth. Good future work: refresh tokens in httpOnly cookies, key rotation, background sync.

## Deploy
- Database: MongoDB Atlas (allow network access 0.0.0.0/0 for the demo).
- Server on Render: New Web Service, root dir `server`, build `npm install`, start `npm start`.
  Env: MONGO_URI, JWT_SECRET, ADMIN_EMAIL, CLIENT_URL (your Vercel URL, no trailing slash).
- Client on Vercel: root dir `client`, framework Vite, env VITE_API_URL = your Render URL. `vercel.json` handles page refresh routes.
- Must be served over HTTPS for Web Crypto and the PWA (Render and Vercel are).
