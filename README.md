# Nouriva

Nouriva is a dependency-light Next.js 14 App Router MVP for gentle nutrition coaching. It keeps the existing Clerk authentication and Firebase seed system, with reusable types and business logic that can later be shared by an Expo client.

## Run locally

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Set the Clerk publishable/secret keys and Firebase client values in `.env.local`. Firebase Admin values are only needed when a signed-in user saves profile, food-log, weight, or coach data. Public routes and `next build` intentionally do not initialize Admin, so missing server credentials are reported as a runtime API error rather than a build failure.

Routes include a public landing page and pricing, Clerk `/sign-in` and `/sign-up`, plus the protected dashboard, onboarding, food library, logging, meal planner, AI coach structure, progress, grocery list, and reports.

## Data and security

`seed/data.ts` remains the source of the curated food/recipe library. Run `npm run seed` after configuring Admin credentials. `firestore.rules` documents client-side isolation; server API routes additionally scope every user-owned read/write below `users/{clerkUserId}`. Never commit a service-account key.

The coach endpoint includes a deterministic local response structure so the flow works without an AI vendor. Replace the response function with a server-side provider call and add its secret as an unprefixed environment variable when ready. Subscription buttons are an integration seam for Stripe; no payment secret or client-side checkout is included in this MVP.

## Validation

```bash
npm run lint
npx tsc --noEmit
npm run build
```
