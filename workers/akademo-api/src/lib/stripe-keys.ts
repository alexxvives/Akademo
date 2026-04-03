import { Bindings } from '../types';

/** Returns the correct Stripe secret key and webhook secret based on the STRIPE_SANDBOX flag. */
export function getStripeKeys(env: Bindings): { secretKey: string; webhookSecret: string } {
  const sandbox = env.STRIPE_SANDBOX === 'true';
  return {
    secretKey: sandbox ? env.STRIPE_SECRET_KEY_SANDBOX : (env.STRIPE_SECRET_KEY ?? env.STRIPE_SECRET_KEY_SANDBOX),
    webhookSecret: sandbox ? env.STRIPE_WEBHOOK_SECRET_SANDBOX : (env.STRIPE_WEBHOOK_SECRET ?? env.STRIPE_WEBHOOK_SECRET_SANDBOX),
  };
}
