# Madonna Shopping Arena

A full-stack e-commerce storefront for Madonna Link Express Ventures, built with **React + Vite** (frontend) and **Express** (backend API), deployed on **Vercel** as a serverless function, with **Firebase** for auth/database and **Paystack** for payments.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router v7, TailwindCSS, shadcn/ui |
| Backend | Express 5 (Vercel Serverless Function) |
| Auth | Firebase Auth (email + Google) |
| Database | Firestore (Firebase Admin SDK) |
| Payments | Paystack |
| Email | Resend |
| Images | Cloudinary |

---

## Local Development

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
Copy `.env.example` to `.env` and fill in all values:
```bash
cp .env.example .env
```

See the [Environment Variables](#environment-variables) section below for details on each variable.

### 3. Run the app
This starts both the Express API server (port 3001) and the Vite dev server (port 3000) concurrently:
```bash
npm run dev
```

- Frontend: http://localhost:3000
- API: http://localhost:3001

> The Vite dev server proxies all `/api/*` requests to `:3001` automatically.

### Other Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start both frontend and backend in watch mode |
| `npm run dev:web` | Start only the Vite frontend |
| `npm run dev:api` | Start only the Express API server |
| `npm run build` | Build the frontend for production |
| `npm run lint` | TypeScript type check |
| `npm run seed` | Seed sample products into Firestore |
| `npm run make-admin` | Promote a Firebase user to admin role |
| `npm run doctor` | Check environment variable configuration |

---

## Environment Variables

All variables must be added both to your local `.env` file **and** to the [Vercel Dashboard → Settings → Environment Variables](https://vercel.com/dashboard) for production.

### Firebase (Frontend)
These are embedded into the client bundle by Vite and are safe to expose.

| Variable | Description |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase project API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase Analytics measurement ID |

### Firebase Admin SDK (Backend — Keep Secret)
| Variable | Description |
|---|---|
| `FIREBASE_PROJECT_ID` | Same as project ID above |
| `FIREBASE_CLIENT_EMAIL` | Service account client email |
| `FIREBASE_PRIVATE_KEY` | Service account private key. In Vercel, paste the raw key with **real newlines** (not `\n`). |

### App Configuration
| Variable | Description |
|---|---|
| `CORS_ORIGINS` | Comma-separated list of allowed origins, e.g. `https://yourapp.vercel.app` |
| `APP_URL` | Canonical public URL of the app, e.g. `https://yourapp.vercel.app` |

### Paystack
| Variable | Description |
|---|---|
| `PAYSTACK_PUBLIC_KEY` | Paystack public key (used on frontend if needed) |
| `PAYSTACK_SECRET_KEY` | Paystack secret key (**backend only — never expose to frontend**) |

### Email
| Variable | Description |
|---|---|
| `RESEND_API_KEY` | Resend API key for transactional emails |
| `EMAIL_FROM` | Sender address e.g. `Store Name <orders@yourdomain.com>` |

### Cloudinary
| Variable | Description |
|---|---|
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

---

## Deployment (Vercel)

This project is configured to deploy on Vercel as a **Vite SPA + Serverless API**.

### How it works
- `vercel.json` routes `/api/*` requests to `api/index.ts` (the Express app as a serverless function)
- All other routes serve `index.html` (SPA client-side routing)

### Steps
1. Push to GitHub
2. Import the repo in Vercel
3. Add all environment variables in Vercel Dashboard → Settings → Environment Variables
4. Deploy

> **Important:** `FIREBASE_PRIVATE_KEY` must be pasted with **real newlines** in the Vercel dashboard, not the `\n` escape sequence. Copy the raw key text from your service account JSON file.

---

## Project Structure

```
/
├── api/
│   └── index.ts          # Vercel serverless entry — exports the Express app
├── backend/
│   ├── server.ts         # Express app with all API routes
│   └── auth.ts           # Firebase auth middleware helpers
├── src/
│   ├── components/
│   │   ├── admin/        # Admin dashboard components
│   │   ├── layout/       # Header, footer
│   │   ├── providers/    # React context providers (auth, cart)
│   │   ├── store/        # Product card, cart drawer, page clients
│   │   └── ui/           # shadcn/ui base components
│   ├── hooks/            # Custom React hooks
│   ├── lib/
│   │   ├── firebase/     # Admin SDK + client SDK setup
│   │   ├── constants.ts  # Business constants (name, phone, etc.)
│   │   ├── email.ts      # Resend email sender
│   │   ├── schemas/      # Zod validation schemas
│   │   └── utils.ts      # Utility helpers
│   ├── spa/
│   │   ├── App.tsx       # Root router
│   │   └── pages/        # Page-level components
│   └── types/            # TypeScript type definitions
├── scripts/              # CLI scripts (seed, make-admin, doctor)
├── .env.example          # Environment variable template
└── vercel.json           # Vercel routing configuration
```

---

## Making a User Admin

```bash
npm run make-admin -- --email=user@example.com
```

This sets the `role: "admin"` field on the user's Firestore document, giving them access to `/admin/*` routes.

---

## License

Private. All rights reserved — Madonna Link Express Ventures.
