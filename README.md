# CoursePilot - Coursera Completion Support

A responsive React + Cashfree starter for low-cost, learner-led Coursera course completion support.

Important: This project is positioned for study planning, doubt-solving, revision guidance, accountability, and completion strategy. Learners complete their own Coursera coursework, quizzes, assignments, peer reviews, exams, and account activity. Certificates are issued by Coursera or the course provider according to their rules; this site must not promise or supply certificates on a learner's behalf.

## Stack

- Client: React + Vite + React Router
- Server: Node.js + Express + MongoDB/Mongoose
- Payments: Cashfree Payment Gateway (sandbox by default)

## 1. Requirements

- Node.js 20+
- MongoDB local instance or MongoDB Atlas database
- Cashfree merchant account with sandbox credentials

## 2. Install

Open two terminals.

### Server

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

Fill `MONGODB_URI`, `CASHFREE_APP_ID`, and `CASHFREE_SECRET_KEY` in `server/.env`.

### Client

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

## 3. Test Payments

- Keep `CASHFREE_ENV=sandbox`.
- Use Cashfree sandbox test payment methods and instructions.
- Never use real customer payments while in sandbox mode.
- Do not put the Cashfree secret key in the client `.env` or any `VITE_` variable.

## 4. Before Going Live

- Complete Cashfree merchant onboarding and obtain production credentials.
- Deploy the client and server over HTTPS.
- Set `CLIENT_URL` to your deployed client origin and `API_BASE_URL` to your public API URL.
- Configure a Cashfree webhook pointing to `POST /api/payments/webhook`.
- Review privacy policy, terms, refund/cancellation policy, contact information, tax and business disclosures, and Cashfree merchant rules.
- Implement rate limiting, spam protection, operational monitoring, and email notifications before production.
- Have a qualified developer review the payment and webhook code before accepting live payments.

## 5. Package Prices

The server controls package prices. Do not trust a price supplied by the browser.

- Single Sprint, 1 Coursera course: Rs.99
- Duo Saver, 2 Coursera courses: Rs.169
- Fast Track, 3 Coursera courses: Rs.229
- Full Bundle, 4 Coursera courses: Rs.279

These represent guided completion support packages, not completion of graded work by a third party.
