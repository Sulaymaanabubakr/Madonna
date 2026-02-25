# Madonna Shopping Arena - Premium E-commerce Platform

Production-ready Next.js 14+ ecommerce website for **Madonna Shopping Arena** (Lagos, Nigeria) with store + admin CMS in one project.

## Stack

- Next.js (App Router) + TypeScript
- TailwindCSS + shadcn/ui + Radix UI
- Framer Motion animations
- Firebase Auth + Firestore
- Firebase Admin SDK for secured server APIs
- Cloudinary image uploads/delivery
- Paystack payment initialize + verify (server-verified)
- Resend transactional emails
- Vercel-ready

## Business Details

- **Business Name**: Madonna Shopping Arena
- **Store / Landmark**: Madonna Shopping Arena
- **Address**: 21/22 Akinosho Street, Off Afariogun, Along Airport Road, Oshodi, Lagos, Nigeria
- **Phone**: 07063006033
- **Email**: madonnaexpresslinkventure@gmail.com

## Features

### Storefront
- Home, Shop, Category, Product details, Cart, Checkout
- Account auth (email/password + Google)
- Public order tracking with email/phone verification
- Contact and newsletter submission endpoints
- Product search/filter/sort + pagination
- Framer Motion hero/cards transitions
- Skeleton loaders + toasts + responsive cart drawer

### Admin CMS (`/admin`)
- Overview metrics
- Product CRUD with Cloudinary upload
- Category CRUD
- Order management + status timeline updates
- Customers list + purchase count
- Inventory updates
- Store settings (delivery fee, contact)

### Payments (Paystack)
- Server-side initialize
- Redirect to Paystack
- Server-side verify endpoint
- Pending order creation before redirect, then server-side verification to confirm payment
- Duplicate-reference protection

### Security
- Firestore security rules in `firebase/firestore.rules`
- Admin role checks in server API routes using Firebase ID token
- Secrets only server-side

## Project Structure

```txt
src/
  app/
    admin/...
    api/...
    account/...
    cart/
    category/[slug]/
    checkout/
    product/[slug]/
    shop/
    track/[orderId]/
  components/
    admin/
    layout/
    providers/
    store/
    ui/
  lib/
    firebase/
    schemas/
    constants.ts
    paystack.ts
    cloudinary.ts
  server/
firebase/
  firestore.rules
  firestore.indexes.json
scripts/
  seed.ts
  make-admin.ts
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill values:

```bash
cp .env.example .env.local
```

Required:
- Firebase web config (`NEXT_PUBLIC_FIREBASE_*`)
- Firebase Admin SDK (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`)
- `PAYSTACK_PUBLIC_KEY`, `PAYSTACK_SECRET_KEY`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `RESEND_API_KEY`, `EMAIL_FROM`

## Firebase Setup

1. Create Firebase project.
2. Enable Authentication:
- Email/Password
- Google (optional)
3. Create Firestore database.
4. Deploy rules/indexes:

```bash
firebase deploy --only firestore:rules --project <project-id>
firebase deploy --only firestore:indexes --project <project-id>
```

5. Ensure `users/{uid}` documents are created when users sign in.

## Seed Data

```bash
npm run seed
```

Seeds categories/products/settings using admin credentials from env.

## Create First Admin

1. Sign up as normal user from `/account`.
2. Run:

```bash
npm run make-admin -- youremail@example.com
```

This updates user role to `admin` in Firestore.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Deploy to Vercel

1. Push repository to GitHub.
2. Import project in Vercel.
3. Add all environment variables in Vercel Project Settings.
4. Deploy.

## Firestore Rules Notes

- Public read for active products/categories
- Only admins can write products/categories/orders status events/settings
- Users can read/write their profile and cart
- Users can only read their own orders

## Optional Analytics

Add event hooks for:
- View product
- Add to cart
- Purchase complete
