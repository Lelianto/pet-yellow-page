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
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Homepage — categories + search
│   ├── providers/
│   │   └── page.tsx        # Listing page with filters
│   └── providers/[id]/
│       └── page.tsx        # Provider detail / SEO page
├── components/
│   ├── ui/                 # Shadcn UI primitives
│   ├── provider-card.tsx   # Listing card component
│   ├── category-pills.tsx  # Category filter pills
│   ├── header.tsx          # App header with search
│   └── whatsapp-button.tsx # Direct WA CTA
├── lib/
│   ├── firebase.ts         # Firebase client SDK init
│   ├── firebase-admin.ts   # Firebase Admin SDK init
│   ├── types.ts            # Firestore document types
│   └── utils.ts            # Shadcn cn() utility
scripts/
└── seed-from-google.ts     # Google Places → Firestore seeder
```

## Firestore Collections
- `providers` — main collection for pet service providers

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
