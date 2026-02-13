# Stripe Testing Guide - AKADEMO

**Last Updated**: February 12, 2026

This guide provides comprehensive testing instructions for AKADEMO's Stripe payment integration, which uses **Stripe Checkout** with `mode: 'subscription'` for monthly payments and `mode: 'payment'` for one-time charges.

---

## Prerequisites

### 1. Environment Setup

Ensure test mode secrets are configured:

```powershell
# Required Wrangler secrets (test mode)
# STRIPE_SECRET_KEY should be sk_test_...
# STRIPE_WEBHOOK_SECRET should be whsec_...
```

Verify in Cloudflare Workers dashboard or via:
```powershell
npx wrangler secret list --name akademo-api
```

### 2. Webhook Configuration

Configure webhook endpoint in [Stripe Dashboard](https://dashboard.stripe.com/test/webhooks):

- **Endpoint URL**: `https://akademo-api.alexxvives.workers.dev/webhooks/stripe`
- **Events to enable**:
  - `checkout.session.completed`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
  - `payment_intent.succeeded`

### 3. Database Verification

Ensure the academy has a `stripeAccountId` set:

```sql
SELECT id, name, stripeAccountId FROM Academy WHERE id = '<academy_id>';
```

If `stripeAccountId` is NULL, the student will see "Academy has not set up Stripe Connect. Please pay with cash."

---

## Test Cards

Use these cards in **test mode only**:

| Card Number | Behavior | Use Case |
|---|---|---|
| `4242 4242 4242 4242` | Success | Happy path testing |
| `4000 0027 6000 3184` | Requires 3D Secure | Test authentication flow |
| `4000 0000 0000 3220` | 3DS required, then succeeds | Alternative 3DS test |
| `4000 0000 0000 0002` | Declined | Test decline handling |
| `4000 0000 0000 9995` | Insufficient funds | Test specific decline reason |
| `4000 0000 0000 0341` | Attach and charge succeed | Generic test card |

**Details**: Any future expiry date (e.g., 12/34), any 3-digit CVC, any ZIP code.

---

## Test Scenarios

### Test 1: One-Time Payment (Happy Path)

**Objective**: Verify one-time payment flow from enrollment to approval.

**Steps**:
1. Log in as a student
2. Enroll in a class with `oneTimePrice` set (e.g., 50 EUR)
3. Initiate payment with `paymentFrequency: 'one-time'`
4. Complete Stripe Checkout with `4242 4242 4242 4242`

**Expected Results**:
- ✅ Redirect to `/dashboard/student/classes?payment=success`
- ✅ `checkout.session.completed` webhook fires
- ✅ `Payment` record created:
  - `status = 'COMPLETED'`
  - `paymentMethod = 'stripe'`
  - `amount = 50`
  - `metadata` contains `source: 'stripe_checkout'`
- ✅ `ClassEnrollment.status` updated to `'APPROVED'`
- ✅ `ClassEnrollment.paymentFrequency` set to `'ONE_TIME'`

**Verification Query**:
```sql
SELECT * FROM Payment WHERE classId = '<class_id>' AND payerId = '<student_id>';
SELECT status, paymentFrequency FROM ClassEnrollment WHERE userId = '<student_id>' AND classId = '<class_id>';
```

---

### Test 2: Monthly Subscription (Happy Path)

**Objective**: Verify subscription creation and first payment.

**Steps**:
1. Log in as a student
2. Enroll in a class with `monthlyPrice` set (e.g., 30 EUR)
3. Initiate payment with `paymentFrequency: 'monthly'`
4. Complete Stripe Checkout with `4242 4242 4242 4242`

**Expected Results**:
- ✅ Redirect to success page
- ✅ `checkout.session.completed` webhook fires with a `subscription` ID
- ✅ `Payment` record created:
  - `status = 'COMPLETED'`
  - `metadata.subscriptionId` = Stripe subscription ID (e.g., `sub_...`)
  - `metadata.source = 'stripe_checkout'`
  - `metadata.paymentFrequency = 'monthly'`
  - `nextPaymentDue`, `billingCycleStart`, `billingCycleEnd` populated
- ✅ `ClassEnrollment` updated:
  - `status = 'APPROVED'`
  - `paymentFrequency = 'MONTHLY'`
  - `stripeSubscriptionId = 'sub_...'` (saved for future recurring charges)

**Verification Query**:
```sql
SELECT stripeSubscriptionId, paymentFrequency, status FROM ClassEnrollment WHERE userId = '<student_id>' AND classId = '<class_id>';
SELECT * FROM Payment WHERE classId = '<class_id>' AND metadata LIKE '%subscriptionId%';
```

---

### Test 3: Monthly Renewal (Critical Test)

**Objective**: Verify Stripe automatically charges monthly subscribers.

**Why This Matters**: This confirms that Stripe's built-in subscription billing works as expected. Stripe will charge the student's card every month without manual intervention.

#### Method 1: Using Test Clocks (Recommended)

1. After completing Test 2, go to **[Stripe Dashboard > Test Clocks](https://dashboard.stripe.com/test/test-clocks)**
2. Click **Create test clock**
3. Find the test customer from Test 2 (use their email)
4. Click **Attach customer** to link them to the test clock
5. **Advance the clock by 1 month** (e.g., from Feb 12, 2026 → Mar 12, 2026)
6. Stripe will simulate the monthly billing cycle

**Expected Results**:
- ✅ `invoice.payment_succeeded` event fires
- ✅ **NEW** `Payment` record created:
  - `status = 'COMPLETED'`
  - `metadata.source = 'stripe_recurring'`
  - `metadata.subscriptionId` matches the original subscription
  - `amount = 30` (monthly price)
- ✅ Student maintains `APPROVED` status
- ✅ Payment appears in academy's payment history

#### Method 2: Stripe CLI (Local Testing)

```bash
stripe trigger invoice.payment_succeeded --override subscription=<sub_id>
```

Replace `<sub_id>` with the subscription ID from Test 2.

**Verification**:
```sql
-- Should show 2 payments: initial + renewal
SELECT * FROM Payment WHERE classId = '<class_id>' AND payerId = '<student_id>' ORDER BY createdAt;
```

---

### Test 4: Failed Recurring Payment

**Objective**: Verify handling of failed monthly charge.

**Steps**:
1. In [Stripe Dashboard](https://dashboard.stripe.com/test/subscriptions), find the subscription from Test 2
2. Update the customer's default payment method to failing card `4000 0000 0000 0002`
3. Advance test clock by 1 month (or wait for next billing cycle)

**Expected Results**:
- ✅ `invoice.payment_failed` event fires
- ✅ `Payment` record created:
  - `status = 'PENDING'`
  - `metadata.reason = 'payment_failed'`
  - `metadata.subscriptionId` = original subscription ID
- ⚠️ Student enrollment remains `APPROVED` (grace period - academy decides policy)

**Verification**:
```sql
SELECT * FROM Payment WHERE status = 'PENDING' AND classId = '<class_id>';
```

**Note**: Stripe will automatically retry failed payments according to [Smart Retries](https://stripe.com/docs/billing/subscriptions/overview#smart-retries) settings (configurable in Dashboard).

---

### Test 5: Declined Payment at Checkout

**Objective**: Verify user sees error message when card is declined.

**Steps**:
1. Start a new Stripe Checkout session as a student
2. Enter card `4000 0000 0000 0002` (generic decline)
3. Click "Pay"

**Expected Results**:
- ✅ Stripe shows error: "Your card was declined."
- ❌ No webhook fires
- ❌ No `Payment` record created
- ❌ Student enrollment remains `PENDING` (or not approved)
- ✅ User can retry with a different card

---

### Test 6: 3D Secure Authentication

**Objective**: Verify Strong Customer Authentication (SCA) flow.

**Steps**:
1. Start Stripe Checkout
2. Use card `4000 0027 6000 3184`
3. Complete the 3D Secure modal (click "Complete authentication" in test mode)

**Expected Results**:
- ✅ 3DS modal appears
- ✅ After authentication, payment succeeds
- ✅ Same result as Test 1 or 2 (depending on one-time vs monthly)

---

### Test 7: Academy Activation Payment

**Objective**: Verify academy owner can activate their account.

**Steps**:
1. Log in as an academy owner with `paymentStatus = 'NOT PAID'`
2. Trigger the academy activation Stripe session (usually via prompt/banner)
3. Complete payment with `4242 4242 4242 4242`

**Expected Results**:
- ✅ `checkout.session.completed` webhook fires
- ✅ `Academy.paymentStatus` updated from `'NOT PAID'` → `'PAID'`
- ✅ Academy owner gains full access to features

**Verification**:
```sql
SELECT id, name, paymentStatus FROM Academy WHERE ownerId = '<owner_user_id>';
```

---

### Test 8: Webhook Signature Verification

**Objective**: Ensure webhook endpoint rejects tampered requests.

**Steps**:
1. Send a fake POST to `https://akademo-api.alexxvives.workers.dev/webhooks/stripe`
2. Include an invalid `stripe-signature` header
3. Expected: Returns `400 Bad Request - Invalid signature`

**Using curl**:
```bash
curl -X POST https://akademo-api.alexxvives.workers.dev/webhooks/stripe \
  -H "Content-Type: application/json" \
  -H "stripe-signature: t=123456789,v1=fake_signature" \
  -d '{"type":"checkout.session.completed","data":{"object":{}}}'
```

**Expected Results**:
- ✅ Response: `{"success": false, "error": "Invalid signature"}`
- ✅ No database changes

**Replay Attack Test**:
Send a valid webhook with a timestamp older than 5 minutes:
- ✅ Response: `400 - Webhook timestamp too old`

---

### Test 9: Duplicate Payment Protection

**Objective**: Verify idempotency (prevent double-charging).

**Steps**:
1. Complete Test 1 or 2 (payment succeeds)
2. Manually replay the same `checkout.session.completed` webhook event
   - Copy the event from Stripe Dashboard logs
   - Use Stripe CLI: `stripe events resend <event_id>`

**Expected Results**:
- ✅ Webhook processes successfully (returns 200)
- ❌ Only **one** `Payment` record exists (duplicate check via `stripeCheckoutSessionId`)

**Verification**:
```sql
SELECT COUNT(*) FROM Payment WHERE stripeCheckoutSessionId = '<session_id>';
-- Should return 1, not 2
```

**Code Reference**: See `webhooks.ts` line 458:
```typescript
const existingPayment: any = await c.env.DB
  .prepare('SELECT id FROM Payment WHERE stripeCheckoutSessionId = ?')
  .bind(sessionId)
  .first();

if (!existingPayment) {
  // Create payment record
}
```

---

## How Monthly Recurring Payments Work

### Key Implementation Details

AKADEMO uses **Stripe Subscriptions** for monthly payments:

- **Checkout mode**: `mode: 'subscription'`
- **Price data**: `recurring: { interval: 'month' }`
- **Stripe handles**:
  - Automatic monthly billing
  - Card retry logic (Smart Retries)
  - Invoice generation
  - Email receipts (if enabled in Stripe Dashboard)

### No Manual Scheduling Required

You **do not** need to:
- ❌ Create cron jobs
- ❌ Manually charge cards every month
- ❌ Track billing dates in your database

Stripe automatically:
1. Charges the card on the billing cycle date
2. Sends `invoice.payment_succeeded` webhook on success
3. Sends `invoice.payment_failed` webhook on failure
4. Retries failed payments (configurable: 0-4 attempts over 3 weeks)

### Webhook Flow

```
Month 1: Student subscribes
  → checkout.session.completed fires
  → ClassEnrollment.stripeSubscriptionId = "sub_abc123"

Month 2: Stripe charges automatically
  → invoice.payment_succeeded fires
  → You create a new Payment record from webhook

Month 3: Card fails
  → invoice.payment_failed fires
  → You create a PENDING Payment record
  → Stripe retries 3 days later (configurable)
  → If succeeds: invoice.payment_succeeded fires
```

---

## Stripe CLI for Local Testing

The Stripe CLI is useful for triggering webhooks without using the dashboard.

### Installation

```powershell
# Windows (via Scoop)
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe

# Or download from: https://stripe.com/docs/stripe-cli
```

### Usage

```bash
# Login
stripe login

# Forward webhooks to your deployed endpoint
stripe listen --forward-to https://akademo-api.alexxvives.workers.dev/webhooks/stripe

# Trigger specific events
stripe trigger checkout.session.completed
stripe trigger invoice.payment_succeeded
stripe trigger invoice.payment_failed

# Trigger with custom data
stripe trigger checkout.session.completed --override metadata[enrollmentId]=<enrollment_id>
```

---

## Production Checklist

Before going live:

- [ ] **Switch to live API keys**
  - Replace `sk_test_...` with `sk_live_...`
  - Update `STRIPE_SECRET_KEY` secret in Wrangler
- [ ] **Configure live webhook endpoint**
  - URL: `https://akademo-api.alexxvives.workers.dev/webhooks/stripe`
  - Enable same 4 events as test mode
  - Save webhook signing secret as `STRIPE_WEBHOOK_SECRET`
- [ ] **Test real payment flow** with a real card (small amount)
- [ ] **Verify platform fee calculation** (if using Stripe Connect)
- [ ] **Configure payout schedule** (automatic daily payouts recommended)
- [ ] **Enable Stripe Radar** (fraud prevention) in Dashboard
- [ ] **Set up email receipts** in Stripe Dashboard > Settings > Emails
- [ ] **Review subscription settings**:
  - Payment retry logic (Smart Retries)
  - Dunning emails (notify customers of failed payments)
  - Cancellation policy (immediate vs end-of-period)
- [ ] **Monitor webhook logs** for first 2 weeks in production

---

## Common Issues & Troubleshooting

### "Stripe is not configured on this server"

**Cause**: `STRIPE_SECRET_KEY` environment variable not set.

**Fix**:
```powershell
# Set secret in Cloudflare Workers
npx wrangler secret put STRIPE_SECRET_KEY --name akademo-api
# Enter sk_test_... when prompted
```

### "Academy has not set up Stripe Connect"

**Cause**: Academy's `stripeAccountId` is NULL in database.

**Fix**: The academy owner must complete Stripe Connect onboarding:
1. Log in as academy owner
2. Click "Connect Stripe" (usually in settings/payments page)
3. Complete Stripe onboarding flow
4. `stripeAccountId` will be saved automatically

### Webhook Not Receiving Events

**Symptoms**: Payments succeed in Stripe Dashboard, but no `Payment` records created.

**Debug Steps**:
1. Check webhook configuration in Stripe Dashboard
   - URL correct?
   - Events enabled?
2. Check Cloudflare Workers logs:
   ```powershell
   npx wrangler tail akademo-api --format pretty
   ```
3. Verify webhook secret matches:
   ```powershell
   npx wrangler secret list --name akademo-api
   ```
4. Check webhook delivery logs in Stripe Dashboard:
   - Go to Developers > Webhooks > [Your endpoint]
   - View recent deliveries
   - Look for 4xx/5xx errors

### Recurring Charges Not Firing

**Cause**: Subscription created in test mode without test clock advancement.

**Fix**: Use Test Clocks (see Test 3) to simulate time passing.

**Alternative**: Wait until actual billing date (only in production with live keys).

### Duplicate Payment Records

**Cause**: Webhook idempotency key not working.

**Debug**:
```sql
SELECT stripeCheckoutSessionId, COUNT(*) as count
FROM Payment
GROUP BY stripeCheckoutSessionId
HAVING count > 1;
```

**Fix**: Ensure `stripeCheckoutSessionId` is saved correctly in webhook handler.

---

## Resources

- **[Stripe Testing Guide](https://stripe.com/docs/testing)** - Official test card numbers
- **[Stripe Connect Docs](https://stripe.com/docs/connect)** - Platform/marketplace setup
- **[Checkout Session API](https://stripe.com/docs/api/checkout/sessions)** - API reference
- **[Subscriptions Guide](https://stripe.com/docs/billing/subscriptions/overview)** - How recurring billing works
- **[Test Clocks](https://stripe.com/docs/billing/testing/test-clocks)** - Simulate time for testing
- **[Smart Retries](https://stripe.com/docs/billing/revenue-recovery/smart-retries)** - Automatic retry logic
- **[Webhook Events](https://stripe.com/docs/api/events/types)** - Complete event reference
- **[Stripe CLI](https://stripe.com/docs/stripe-cli)** - Local development tool

---

## Summary

AKADEMO's Stripe integration is designed for simplicity and reliability:

✅ **One-time payments**: Immediate, simple checkout  
✅ **Monthly subscriptions**: Stripe handles recurring billing automatically  
✅ **Webhook-driven**: All payment status updates come from Stripe  
✅ **Idempotent**: Duplicate webhooks are safely ignored  
✅ **Tested**: Follow this guide to verify every scenario  

**Key Takeaway**: For monthly payments, you don't need to write any scheduling code. Stripe's Subscriptions API handles everything — you just listen for `invoice.payment_succeeded` and record it.

---

**Document Version**: 1.0  
**Last Reviewed**: February 12, 2026  
**Maintained By**: AKADEMO Development Team
