import axios from "axios";
import Stripe from "stripe";
import { ENV } from "./_core/env";

export type PaymentProviderStatus = {
  provider: "stripe" | "daraja";
  enabled: boolean;
  configured: boolean;
  environment: "test" | "sandbox" | "production";
  missing: string[];
};

export function getPaymentProviderStatus(): PaymentProviderStatus[] {
  const stripeMissing = [
    ["STRIPE_SECRET_KEY", ENV.stripe.secretKey],
    ["STRIPE_WEBHOOK_SECRET", ENV.stripe.webhookSecret],
  ].filter(([, value]) => !value).map(([key]) => key);

  const darajaMissing = [
    ["DARAJA_CONSUMER_KEY", ENV.daraja.consumerKey],
    ["DARAJA_CONSUMER_SECRET", ENV.daraja.consumerSecret],
    ["DARAJA_SHORTCODE", ENV.daraja.shortcode],
    ["DARAJA_PASSKEY", ENV.daraja.passkey],
    ["DARAJA_CALLBACK_BASE_URL", ENV.daraja.callbackBaseUrl],
  ].filter(([, value]) => !value).map(([key]) => key);

  return [
    {
      provider: "stripe",
      enabled: ENV.stripe.enabled,
      configured: stripeMissing.length === 0,
      environment: ENV.isProduction ? "production" : "test",
      missing: stripeMissing,
    },
    {
      provider: "daraja",
      enabled: ENV.daraja.enabled,
      configured: darajaMissing.length === 0,
      environment: ENV.daraja.environment,
      missing: darajaMissing,
    },
  ];
}

export function assertStripeReady() {
  const status = getPaymentProviderStatus().find(item => item.provider === "stripe");
  if (!status?.enabled || !status.configured) {
    throw new Error(`Stripe is not ready. Missing: ${status?.missing.join(", ") || "enable PAYMENTS_STRIPE_ENABLED"}`);
  }
}

export function assertDarajaReady() {
  const status = getPaymentProviderStatus().find(item => item.provider === "daraja");
  if (!status?.enabled || !status.configured) {
    throw new Error(`M-Pesa Daraja is not ready. Missing: ${status?.missing.join(", ") || "enable PAYMENTS_DARAJA_ENABLED"}`);
  }
}

export function getDarajaBaseUrl() {
  return ENV.daraja.environment === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";
}

export async function getDarajaAccessToken() {
  assertDarajaReady();
  const credentials = Buffer.from(`${ENV.daraja.consumerKey}:${ENV.daraja.consumerSecret}`).toString("base64");
  const response = await axios.get(`${getDarajaBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}` },
    timeout: 15_000,
  });
  return response.data.access_token as string;
}

export async function createStripeRidePayment(input: {
  amountKsh: number;
  platformFeeKsh: number;
  customerId?: string;
  connectedAccountId?: string;
  rideId: string;
}) {
  assertStripeReady();
  const stripe = new Stripe(ENV.stripe.secretKey);
  const intent = await stripe.paymentIntents.create({
    amount: Math.max(1, Math.round(input.amountKsh)),
    currency: "kes",
    customer: input.customerId,
    automatic_payment_methods: { enabled: true },
    metadata: { rideId: input.rideId, platformFeeKsh: String(Math.round(input.platformFeeKsh)) },
    ...(input.connectedAccountId
      ? { transfer_data: { destination: input.connectedAccountId }, application_fee_amount: Math.round(input.platformFeeKsh) }
      : {}),
  });
  return { id: intent.id, clientSecret: intent.client_secret, status: intent.status };
}

export async function requestDarajaStkPush(input: {
  phoneNumber: string;
  amountKsh: number;
  accountReference: string;
  transactionDescription: string;
}) {
  assertDarajaReady();
  if (!/^254\\d{9}$/.test(input.phoneNumber)) {
    throw new Error("M-Pesa phone number must use the 254XXXXXXXXX format");
  }
  const accessToken = await getDarajaAccessToken();
  const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  const password = Buffer.from(`${ENV.daraja.shortcode}${ENV.daraja.passkey}${timestamp}`).toString("base64");
  const response = await axios.post(`${getDarajaBaseUrl()}/mpesa/stkpush/v1/processrequest`, {
    BusinessShortCode: ENV.daraja.shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: Math.max(1, Math.round(input.amountKsh)),
    PartyA: input.phoneNumber,
    PartyB: ENV.daraja.shortcode,
    PhoneNumber: input.phoneNumber,
    CallBackURL: `${ENV.daraja.callbackBaseUrl}/stk`,
    AccountReference: input.accountReference.slice(0, 12),
    TransactionDesc: input.transactionDescription.slice(0, 13),
  }, { headers: { Authorization: `Bearer ${accessToken}` }, timeout: 20_000 });
  return response.data;
}
