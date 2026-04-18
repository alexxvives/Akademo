# Skill: Stripe Payments

Use this when working on payment flows, subscriptions, Stripe Connect, or billing.

## Key Files
```
workers/akademo-api/src/routes/payments.ts         # Payment routes
workers/akademo-api/src/routes/student-payments.ts  # Student-side payment queries
workers/akademo-api/src/lib/payment-utils.ts        # Shared payment logic
workers/akademo-api/src/lib/stripe-keys.ts          # Stripe key resolution
docs/stripe-setup.md                                # Setup guide
docs/stripe-testing-guide.md                        # Testing with test cards
src/components/payment-modal/                       # Frontend payment UI
src/components/PaymentModal.tsx                     # Barrel re-export
```

## Architecture
- Stripe Connect: each academy has a `stripeAccountId` in the `Academy` table
- Checkout Sessions: created server-side, student redirected to Stripe
- Webhooks: `checkout.session.completed` updates `Payment` table
- Monthly cuotas: tracked in `ClassCuota` table per student per class

## Payment Flow
1. Student clicks "Pay" → frontend sends POST to `/payments/create-checkout`
2. API creates Stripe Checkout Session with academy's connected account
3. Student completes payment on Stripe-hosted page
4. Stripe webhook fires → API updates `Payment` record
5. Student returns to `/dashboard/student/subjects?payment=success&session_id=...`
6. Frontend verifies via `/payments/stripe-verify`

## Before Making Changes
1. Read `docs/stripe-setup.md` for Stripe Connect onboarding flow
2. Read `docs/stripe-testing-guide.md` for test card numbers
3. Check `Payment` schema: `npx wrangler d1 execute akademo-db --remote --command "SELECT sql FROM sqlite_master WHERE type='table' AND name='Payment'"`
4. Check `ClassCuota` schema similarly
