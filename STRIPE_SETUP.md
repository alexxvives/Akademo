# Stripe Setup Guide for AKADEMO

## 1. Install Stripe Dependencies

```bash
npm install stripe @stripe/stripe-js
```

## 2. Environment Variables

Add to your `.env` file (or Cloudflare Workers secrets):

```env
# Stripe Secret Key (starts with sk_test_ or sk_live_)
STRIPE_SECRET_KEY=sk_test_your_secret_key_here

# Stripe Publishable Key (starts with pk_test_ or pk_live_)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

**For Cloudflare Workers**, add the secret via:
```bash
npx wrangler secret put STRIPE_SECRET_KEY
```

## 3. Get Your API Keys

1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy your **Publishable key** (pk_test_...)
3. Click "Reveal test key token" to copy your **Secret key** (sk_test_...)

## 4. Create a Product & Price in Stripe

1. Go to https://dashboard.stripe.com/test/products
2. Click "Add product"
3. Fill in:
   - **Name**: "AKADEMO Premium Subscription"
   - **Description**: "Monthly subscription for unlimited classes and students"
   - **Pricing**: Recurring
   - **Price**: $29.99 USD
   - **Billing period**: Monthly
4. Click "Save product"
5. Copy the **Price ID** (starts with `price_...`)

## 5. Update the Frontend

In `src/app/dashboard/academy/facturas/page.tsx`, replace:
```typescript
priceId: 'price_1234567890', // ← Replace with your actual Price ID
```

With your actual Stripe Price ID from step 4.

## 6. Test Mode vs Live Mode

### Test Mode (Development)
- Use test keys: `sk_test_...` and `pk_test_...`
- Use test card numbers:
  - Success: `4242 4242 4242 4242`
  - Decline: `4000 0000 0000 0002`
  - 3D Secure: `4000 0025 0000 3155`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

### Live Mode (Production)
- Use live keys: `sk_live_...` and `pk_live_...`
- Real payments will be processed
- Stripe charges 2.9% + $0.30 per transaction

## 7. Webhooks (Optional, for subscription management)

To handle subscription events (renewals, cancellations):

1. Create webhook endpoint: `src/app/api/stripe/webhook/route.ts`
2. Register webhook in Stripe Dashboard: https://dashboard.stripe.com/test/webhooks
3. Add webhook URL: `https://akademo.alexxvives.workers.dev/api/stripe/webhook`
4. Listen for events:
   - `checkout.session.completed` - Payment successful
   - `customer.subscription.deleted` - Subscription cancelled
   - `invoice.payment_succeeded` - Recurring payment successful

## 8. Current Implementation

**What we built:**
- ✅ `/dashboard/academy/facturas` - Billing page with checkout button
- ✅ `/api/stripe/create-checkout-session` - API endpoint to create Stripe sessions
- ✅ Stripe Checkout redirect flow
- ✅ Success/cancel URL handling

**Good Practice?**
Yes! Creating a temporary test page is **standard practice** for:
- Testing payment flows before full integration
- Verifying API keys work correctly
- Understanding Stripe's checkout process
- Showing stakeholders/clients the payment UX

## 9. Next Steps (Production-Ready)

Before going live:
1. ✅ Test with Stripe test cards
2. ✅ Verify success/cancel URLs work
3. ⬜ Add webhook handler for subscription updates
4. ⬜ Store subscription status in database (Academy table)
5. ⬜ Add subscription check middleware
6. ⬜ Show premium features based on subscription
7. ⬜ Handle failed payments
8. ⬜ Add subscription cancellation flow
9. ⬜ Switch to live API keys
10. ⬜ Enable Stripe tax calculation (if needed)

## 10. Security Notes

- ❌ **NEVER** expose your secret key (`sk_...`) in frontend code
- ✅ Secret keys only in API routes or server-side code
- ✅ Publishable keys can be in frontend
- ✅ All payment processing happens on Stripe's servers (PCI compliant)
- ✅ You never handle credit card numbers directly

## Troubleshooting

**"Invalid API Key"**
- Check you're using the correct key (test vs live)
- Verify the key starts with `sk_test_` or `sk_live_`
- Ensure no extra spaces in .env file

**"No such price"**
- Verify the Price ID is correct
- Check you're using test mode price with test keys
- Price ID should start with `price_`

**Checkout not loading**
- Check browser console for errors
- Verify API endpoint is being called
- Check Stripe Dashboard logs: https://dashboard.stripe.com/test/logs
