# Stripe Connect Setup Guide

## Current Configuration

**Academy 2** is connected to Stripe Connect:
- Stripe Account ID: `acct_1SsCf9GnG21Wi0QR`
- Product ID: `prod_TpsRpJM1OFXZNz`
- Database: Already configured via `UPDATE Academy SET stripeAccountId = 'acct_1SsCf9GnG21Wi0QR' WHERE id = 'academy2'`

## Required Secrets

Set these in Cloudflare Workers:

```powershell
# Stripe Secret Key (from Stripe Dashboard)
echo "sk_test_..." | npx wrangler secret put STRIPE_SECRET_KEY
```

To get your Stripe Secret Key:
1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy the "Secret key" (starts with `sk_test_` for test mode or `sk_live_` for production)
3. Run the command above

## How Stripe Connect Works

### Payment Flow

1. **Student initiates payment** → `/payments/stripe-session`
2. **API creates Checkout Session** with:
   - Connected account: `stripeAccountId` from Academy
   - Platform fee: 5% of total
   - Transfer: Remaining 95% to academy's Stripe account
3. **Student redirected to Stripe** → Completes payment
4. **Stripe webhook** → `/webhooks/stripe` receives `checkout.session.completed`
5. **API updates database** → `ClassEnrollment.paymentStatus = 'PAID'`

### Platform Fee Split

- **Total**: €100
- **Platform fee (5%)**: €5 → Goes to your platform account
- **Academy receives (95%)**: €95 → Goes to connected account

## Setting Up New Academies

### Option 1: Academy onboarding (Recommended)

Create an onboarding link for academy owners:

```typescript
const accountLink = await stripe.accountLinks.create({
  account: 'acct_xxx',
  refresh_url: 'https://akademo-edu.com/dashboard/academy/settings',
  return_url: 'https://akademo-edu.com/dashboard/academy/settings?stripe=complete',
  type: 'account_onboarding',
});

// Send accountLink.url to academy owner
```

### Option 2: Manual setup (What you did)

1. Create connected account in Stripe Dashboard
2. Get the account ID (e.g., `acct_1SsCf9GnG21Wi0QR`)
3. Update database:
   ```sql
   UPDATE Academy 
   SET stripeAccountId = 'acct_1SsCf9GnG21Wi0QR' 
   WHERE id = 'academy2'
   ```

## Payment Methods Supported

- **Card payments**: Visa, Mastercard, Amex
- **Bank transfers**: SEPA Direct Debit (EU)
- **Bizum**: Via Stripe Link (Spain only)

Note: Bizum support requires:
- Stripe account in Spain
- Enabling "Payment Links" in Stripe Dashboard
- Using `payment_method_types: ['card', 'link']`

## Webhook Configuration

Configure webhook endpoint in Stripe Dashboard:

**Endpoint URL**: `https://akademo-api.alexxvives.workers.dev/webhooks/stripe`

**Events to listen for**:
- `checkout.session.completed` - Payment successful
- `checkout.session.expired` - Payment failed/expired
- `payment_intent.succeeded` - Payment confirmed
- `payment_intent.payment_failed` - Payment failed

**Webhook Secret**:
```powershell
echo "whsec_..." | npx wrangler secret put STRIPE_WEBHOOK_SECRET
```

## Testing

### Test Cards

Use these in test mode:
- **Success**: `4242 4242 4242 4242`
- **Requires 3D Secure**: `4000 0027 6000 3184`
- **Decline**: `4000 0000 0000 0002`

Expiry: Any future date  
CVC: Any 3 digits  
ZIP: Any 5 digits

### Test Payment Flow

1. Student visits payment page
2. Selects "Bank Transfer" or "Bizum"
3. Redirected to Stripe Checkout
4. Completes payment with test card
5. Redirected back to classes page
6. Access granted immediately

## Production Checklist

- [ ] Switch to live Stripe API keys
- [ ] Configure live webhook endpoint
- [ ] Test real payment flow
- [ ] Verify platform fee calculation
- [ ] Test payout schedule (automatic daily payouts)
- [ ] Enable Stripe Radar for fraud prevention
- [ ] Set up email receipts in Stripe Dashboard

## Troubleshooting

### "Stripe is not configured"
→ Set `STRIPE_SECRET_KEY` secret in Wrangler

### "Academy has not set up Stripe Connect"
→ Academy missing `stripeAccountId` in database

### Webhook not receiving events
→ Check webhook URL and secret in Stripe Dashboard

### Platform fee not working
→ Verify connected account has charges_enabled = true

## Resources

- [Stripe Connect Docs](https://stripe.com/docs/connect)
- [Checkout Session API](https://stripe.com/docs/api/checkout/sessions)
- [Testing Guide](https://stripe.com/docs/testing)
