@AGENTS.md

# AnabulCare - Hyper-Local Pet Service Directory

## Project Overview
AnabulCare is a mobile-first pet service directory for specific areas in Indonesia. It connects pet owners with local services like grooming, vets, pet hotels, and pet shops — with a focus on WhatsApp-driven communication.

## Tech Stack
- **Framework**: Next.js 16 (App Router, TypeScript, `src/` directory)
- **Database**: Firebase Firestore (NoSQL)
- **Auth**: Firebase Authentication (Google Login + Phone/OTP)
- **Styling**: Tailwind CSS v4 + Shadcn UI
- **Icons**: Lucide React (use `Cat`, `PawPrint`, `Heart` for pet themes)
- **APIs**: Google Places API (for seeding provider data)

## Project Structure
```
src/
├── app/
│   ├── layout.tsx              # Root layout with AuthProvider
│   ├── page.tsx                # Homepage — categories + search
│   ├── gabung-mitra/
│   │   └── page.tsx            # Self-registration for new providers
│   ├── admin/
│   │   └── pending-claims/
│   │       └── page.tsx        # Admin dashboard for approvals
│   ├── providers/
│   │   └── page.tsx            # Listing page with filters + recommend CTA
│   └── providers/[id]/
│       └── page.tsx            # Provider detail + claim profile button
├── components/
│   ├── ui/                     # Shadcn UI primitives
│   ├── provider-card.tsx       # Listing card component
│   ├── provider-tags.tsx       # Tags with verified/recommendation badges
│   ├── category-pills.tsx      # Category filter pills
│   ├── header.tsx              # App header with auth + nav
│   ├── header-auth.tsx         # Client: login/logout in header
│   ├── whatsapp-button.tsx     # Direct WA CTA
│   ├── claim-profile-button.tsx    # Client: claim profile sheet
│   ├── recommend-service-button.tsx # Client: recommend service sheet
│   ├── admin-approve-button.tsx    # Client: approve/reject buttons
│   └── admin-auth-gate.tsx         # Client: admin access check
├── lib/
│   ├── firebase.ts             # Firebase client SDK init (Firestore, Auth, Storage)
│   ├── firebase-admin.ts       # Firebase Admin SDK init
│   ├── auth-context.tsx        # Client: React auth context provider
│   ├── types.ts                # Firestore document types
│   ├── providers.ts            # docToProvider converter
│   └── utils.ts                # Shadcn cn() utility
scripts/
└── seed-from-google.ts         # Google Places → Firestore seeder
firestore.rules                 # Firestore security rules
```

## Firestore Collections
- `providers` — main collection for pet service providers
- `recommendations` — user-submitted service recommendations

## Phase 2: Trust & Growth System
- **Claim Profile**: Existing Google Maps providers can be claimed. Shows "Klaim Profil Ini" button on detail page. Requires Google Login + proof of ownership (text/file upload to Firebase Storage).
- **Self-Registration** (`/gabung-mitra`): New providers/freelancers can register with name, categories, WhatsApp, area, and home service flag. Saved with `source: 'organic'`.
- **Recommend a Service**: Users can recommend services via a bottom sheet modal. Saved to `recommendations` collection.
- **Admin Dashboard** (`/admin/pending-claims`): Lists pending claims and unverified organic registrations. Admin can approve/reject. Protected by `NEXT_PUBLIC_ADMIN_UIDS` env var.
- **Badges**: Provider cards/tags show "Terverifikasi" (verified) and "Rekomendasi Warga" (user recommendation) badges.

## Commands
- `npm run dev` — Start dev server (Turbopack)
- `npm run build` — Production build
- `npx tsx scripts/seed-from-google.ts` — Seed Firestore from Google Places API

## Environment Variables
Required in `.env.local`:
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_ADMIN_UIDS=           # Comma-separated Firebase UIDs for admin access
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
GOOGLE_MAPS_API_KEY=
```

## Conventions
- Use server components by default; add `"use client"` only when needed
- Fetch Firestore data in server components via Firebase Admin SDK
- All provider data flows through the `Provider` type in `lib/types.ts`
- Mobile-first design: base styles for mobile, `md:` breakpoint for desktop
- Indonesian locale: UI text in Bahasa Indonesia
