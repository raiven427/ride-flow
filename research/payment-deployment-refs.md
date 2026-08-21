# Payment deployment references

## Stripe

- Stripe Connect is intended for platforms and marketplaces that manage payments between customers and service providers: https://docs.stripe.com/connect
- Stripe Connect integrations should establish webhook endpoints and verify webhook signatures; Connect events can come from the platform or connected accounts: https://docs.stripe.com/connect/webhooks
- Stripe webhook handlers should use HTTPS in production, verify the raw request body and Stripe-Signature header, and return a 2xx response quickly before complex processing: https://docs.stripe.com/webhooks

## M-Pesa Daraja

- Safaricom’s official Daraja portal describes Daraja 3.0 as the platform for integrating Safaricom and M-PESA APIs, including sandbox testing and production onboarding: https://developer.safaricom.co.ke/

## Implementation implications

- Keep Stripe secret keys and webhook secrets server-side; only the publishable key may be exposed to a browser.
- Use Stripe Connect for marketplace payments and connected-driver onboarding; do not treat a simple client-side checkout as the 5% marketplace settlement.
- Verify Stripe webhook signatures with the raw request body and make handlers idempotent.
- Keep Daraja consumer credentials, passkey, shortcode, initiator, security credential, and callback configuration server-side.
- Use Daraja sandbox first, then request production access and configure HTTPS callback URLs.
- Reconcile provider events with RideFlow’s fare and ledger tables before releasing driver funds.
