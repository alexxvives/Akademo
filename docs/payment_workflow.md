# AKADEMO — Payment Workflow Documentation

**Last Updated**: February 2026  
**Status**: Production

---

## Overview

AKADEMO supports 3 payment methods for class enrollment: **Cash**, **Bizum**, and **Stripe (card)**. Payments can be **one-time** (single lump sum) or **monthly** (recurring).

---

## 1. Payment Flow Diagram

```
Student enrolls in class
        │
        ▼
┌─────────────────────────┐
│  Choose payment method  │
│  & frequency            │
│  (cash/bizum/stripe)    │
│  (one-time/monthly)     │
└────────┬────────────────┘
         │
    ┌────┴────┐
    ▼         ▼
 Cash/Bizum  Stripe
    │         │
    ▼         ▼
 PENDING   Stripe Checkout
 status    redirect
    │         │
    ▼         ▼
 Academy   Stripe webhook
 approves  fires
    │         │
    ▼         ▼
  PAID     COMPLETED
 status    status
```

---

## 2. Payment Types & Frequencies

### Payment Types
| Type | Value | Description |
|------|-------|-------------|
| Student → Academy | `STUDENT_TO_ACADEMY` | Student pays for class enrollment |
| Academy → Platform | `ACADEMY_TO_PLATFORM` | Platform fee (not yet implemented) |

### Payment Frequencies (stored on `ClassEnrollment.paymentFrequency`)
| Frequency | Price Source | Description |
|-----------|-------------|-------------|
| `ONE_TIME` | `Class.oneTimePrice` | Single lump-sum covers full enrollment |
| `MONTHLY` | `Class.monthlyPrice` | Recurring monthly payment |

---

## 3. Payment Methods

### Cash & Bizum (Manual Approval)
Cash and bizum are handled **identically** — the only difference is the label. Both require manual academy approval.

**Student Flow**:
1. Student calls `POST /payments/initiate` with `paymentMethod: 'cash'` or `'bizum'`
2. System calculates amount (including catch-up for late joiners)
3. Creates Payment record with `status: 'PENDING'`
4. Updates `ClassEnrollment.paymentFrequency`
5. Student waits for academy confirmation

**Academy Approval Flow**:
1. Academy views `GET /payments/pending-cash` (auto-creates missing PENDING records)
2. Academy approves via `PATCH /payments/:id/approve-payment`
3. Payment status changes: `PENDING` → `PAID`
4. `completedAt` timestamp is set

### Stripe (Automatic)
**Student Flow**:
1. Student calls `POST /payments/stripe-session` with `classId` and `paymentFrequency`
2. System creates a Stripe Checkout Session:
   - **Monthly** → `mode: 'subscription'` with `recurring: { interval: 'month' }`
   - **One-time** → `mode: 'payment'`
3. Student is redirected to Stripe Checkout page
4. After successful payment, Stripe fires webhook

**Webhook Processing** (`POST /webhooks/stripe`):
1. Signature verification (HMAC-SHA256 + 5-minute replay protection)
2. On `checkout.session.completed`:
   - Creates Payment with `status: 'COMPLETED'`
   - Sets `ClassEnrollment.status = 'APPROVED'`
   - Saves `stripeSubscriptionId` (for subscriptions)
3. On `invoice.payment_succeeded` (recurring):
   - Creates new COMPLETED Payment record
4. On `invoice.payment_failed`:
   - Creates PENDING Payment with `reason: 'payment_failed'` in metadata

---

## 4. Payment Statuses

| Status | Source | Description |
|--------|--------|-------------|
| `PENDING` | Auto-created, cash/bizum, Stripe failed | Awaiting approval or retry |
| `PAID` | Academy manual approval | Cash/bizum confirmed |
| `COMPLETED` | Stripe webhook | Card payment succeeded |
| `REJECTED` | Academy denied | Payment request was denied |
| `FAILED` | Stripe invoice failed | Stripe payment attempt failed |
| `REFUNDED` | Future use | Not yet implemented |

**Important**: Both `PAID` and `COMPLETED` count as successful payments. All queries use `status IN ('PAID', 'COMPLETED')` when summing `totalPaid`.

---

## 5. Monthly Payment Calculation

### Core Algorithm: `countElapsedCycles(classStart, today)`

```javascript
if (today < classStart) return 0;

months = (today.year - classStart.year) × 12 + (today.month - classStart.month);
// Adjust: if we haven't reached the billing day yet this month
if (today.day < classStart.day) months = max(0, months - 1);
return months + 1;  // +1 because current partial cycle counts as owed
```

### Examples

| Class Start | Today | Months Diff | Day Adjust | Cycles | Notes |
|-------------|-------|-------------|------------|--------|-------|
| Jan 15 | Mar 10 | 2 | 10 < 15 → -1 = 1 | **2** | Haven't reached billing day yet in March |
| Jan 1 | Mar 15 | 2 | 15 >= 1 → no adj | **3** | Past billing day in March |
| Feb 1 | Feb 14 | 0 | 14 >= 1 → no adj | **1** | First cycle in progress |
| Dec 31 | Feb 14 | 2 | 14 < 31 → -1 = 1 | **2** | Haven't reached day 31 in Feb |

### Amount Owed Calculation (Auto-Create)

```
totalExpected = elapsedCycles × monthlyPrice
amountOwed = max(0, totalExpected − totalPaid)
```

Where `totalPaid = SUM(amount) FROM Payment WHERE status IN ('PAID', 'COMPLETED')`.

---

## 6. Auto-Create Pending Payments

When `GET /payments/pending-cash` is called, the system automatically ensures PENDING records exist for students who owe money:

1. **Query all APPROVED enrollments** with `totalPaid` (sum of PAID/COMPLETED payments)
2. **For each enrollment**:
   - If MONTHLY: calculate `amountOwed = elapsedCycles × monthlyPrice − totalPaid`
   - If ONE_TIME: `amountOwed = oneTimePrice − totalPaid`
3. **If money is owed**:
   - No existing PENDING payment → INSERT new one with `metadata.autoCreated: true`
   - Existing PENDING with different amount → UPDATE the amount
   - No money owed → do nothing

---

## 7. Edge Cases

### Late Joiner (Student enrolls after class started)
- Charged for **all elapsed cycles at once** on first payment
- Metadata stores `missedCycles` and `catchUpAmount`
- Message: "Incluye X ciclo(s) pendiente(s). Próximos pagos serán de Y€/mes."

### Early Joiner (Class hasn't started yet)
- `countElapsedCycles` returns 0 → student pays just 1 month in advance
- Billing starts at `classStart`, not enrollment date

### Partial Payments
- `amountOwed = max(0, totalExpected − totalPaid)` → never negative
- Any partial payment reduces what the student owes

### Payment Reversal
- `PUT /payments/history/:id/reverse` toggles between `COMPLETED` ↔ `PENDING`
- Used to "undo" a mistaken approval

### Duplicate Prevention
- Stripe: checks `stripeCheckoutSessionId` before inserting
- Cash/Bizum: `POST /initiate` re-uses existing PENDING payment
- Auto-create: checks for existing PENDING before inserting

---

## 8. API Endpoints Reference

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `POST` | `/payments/initiate` | Student | Start cash/bizum payment |
| `GET` | `/payments/pending-cash` | Academy/Teacher/Admin | List pending (auto-creates) |
| `GET` | `/payments/pending-count` | Academy/Teacher | Badge count |
| `PATCH` | `/payments/:enrollmentId/approve-cash` | Academy | Approve enrollment payment |
| `PATCH` | `/payments/:id/approve-payment` | Academy | Approve specific payment |
| `POST` | `/payments/stripe-session` | Student | Create Stripe Checkout |
| `GET` | `/payments/my-payments` | Student | Student's history |
| `GET` | `/payments/history` | Academy/Admin | Academy payment history |
| `PUT` | `/payments/history/:id/reverse` | Academy | Toggle COMPLETED ↔ PENDING |
| `POST` | `/payments/register-manual` | Academy/Admin | Register manual payment |
| `DELETE` | `/payments/:id` | Academy/Admin | Delete payment |
| `PATCH` | `/payments/:id` | Academy/Admin | Update payment |
| `POST` | `/payments/stripe-connect` | Academy | Stripe Connect onboarding |
| `GET` | `/payments/stripe-status` | Academy | Check Connect status |
| `POST` | `/webhooks/stripe` | Public (sig verified) | Stripe webhook |

---

## 9. Payment Table Schema

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT (PK) | UUID or `payment-{timestamp}-{random}` |
| `type` | TEXT | `STUDENT_TO_ACADEMY` or `ACADEMY_TO_PLATFORM` |
| `payerId` | TEXT (FK → User) | Who is paying |
| `payerType` | TEXT | `STUDENT` or `ACADEMY` |
| `payerName` | TEXT | Denormalized name |
| `payerEmail` | TEXT | Denormalized email |
| `receiverId` | TEXT (FK → Academy) | Who receives |
| `receiverName` | TEXT | Denormalized academy name |
| `amount` | REAL | Amount in currency units (EUR) |
| `currency` | TEXT | Default `'EUR'` |
| `status` | TEXT | PENDING, PAID, COMPLETED, REJECTED, FAILED, REFUNDED |
| `stripePaymentId` | TEXT | Stripe payment/session ID |
| `stripeCheckoutSessionId` | TEXT | Stripe checkout session ID |
| `paymentMethod` | TEXT | `cash`, `bizum`, `stripe` |
| `classId` | TEXT (FK → Class) | Associated class |
| `description` | TEXT | Human-readable description |
| `metadata` | TEXT | JSON blob with context |
| `createdAt` | TEXT | ISO timestamp |
| `completedAt` | TEXT | When approved/completed |
| `nextPaymentDue` | TEXT | Next monthly payment date |
| `billingCycleStart` | TEXT | Current billing cycle start |
| `billingCycleEnd` | TEXT | Current billing cycle end |

---

## 10. Testing Scenarios

### Cash/Bizum Scenarios
| # | Scenario | Expected Outcome |
|---|----------|-----------------|
| 1 | Student initiates cash payment (one-time) | PENDING record created with `oneTimePrice` |
| 2 | Student initiates bizum payment (monthly) | PENDING record with `monthlyPrice` + catch-up |
| 3 | Academy approves cash payment | Status → PAID, `completedAt` set |
| 4 | Academy rejects payment | Status → REJECTED |
| 5 | Late joiner (class started 3 months ago, monthly) | Amount = 3 × monthlyPrice (catch-up) |
| 6 | Academy views pending-cash after 2 months | Auto-creates/updates PENDING with correct amount |
| 7 | Student re-initiates with different method | Existing PENDING updated, not duplicated |
| 8 | Academy manually registers payment | New PAID record created directly |
| 9 | Academy reverses a completed payment | Status toggles COMPLETED → PENDING |

### Stripe Scenarios
| # | Scenario | Expected Outcome |
|---|----------|-----------------|
| 10 | Student pays one-time via Stripe | Checkout → webhook → COMPLETED + enrollment APPROVED |
| 11 | Student subscribes monthly via Stripe | Subscription created, first payment COMPLETED |
| 12 | Monthly Stripe renewal | `invoice.payment_succeeded` → new COMPLETED record |
| 13 | Stripe payment fails | `invoice.payment_failed` → PENDING record with error metadata |
| 14 | Duplicate webhook (replay) | Prevented by `stripeCheckoutSessionId` check |
| 15 | Academy not connected to Stripe | Error: "Academy not configured for Stripe" |

### Monthly Calculation Scenarios
| # | Scenario | Expected Outcome |
|---|----------|-----------------|
| 16 | Class starts today, student pays 1 month | UP_TO_DATE (1 cycle = 1 payment) |
| 17 | Class started 2 months ago, student paid 2 months | UP_TO_DATE |
| 18 | Class started 2 months ago, student paid 1 month | BEHIND by 1 month |
| 19 | Class starts next month, student pays 1 month | UP_TO_DATE (early joiner) |
| 20 | Class started Dec 31, today = Feb 14, paid 2 months | UP_TO_DATE (day-of-month adjustment) |

### MCP Testing Tools
- **Stripe MCP**: Use `@stripe/mcp` to create test customers, payment intents, and verify Stripe state
- **Playwright MCP**: Use `@playwright/mcp` to automate browser flows (checkout, approval UI)

---

## 11. Known Considerations

1. **Stripe amounts are in cents** — webhook divides by 100 before storing
2. **Currency**: EUR is the default, stored as `'EUR'` but some legacy records may have `'USD'`
3. **Stripe Connect**: Academy must complete onboarding before students can pay via Stripe
4. **Academy activation**: One-time €299 fee via separate Stripe flow
5. **`PAID` vs `COMPLETED`**: Both are "success" — `PAID` = manual, `COMPLETED` = Stripe
