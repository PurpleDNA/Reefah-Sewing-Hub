// Flutterwave v4 configuration, read from server-only env vars.
// NOTE: the live business is in Ghana, so defaults lean to production (GHS).
// For sandbox testing against the Nigerian developer account, override
// FLUTTERWAVE_CURRENCY=NGN and FLUTTERWAVE_API_BASE_URL=<sandbox> in .env.local.

export const flutterwaveConfig = {
  clientId: process.env.FLUTTERWAVE_CLIENT_ID,
  clientSecret: process.env.FLUTTERWAVE_CLIENT_SECRET,
  // Secret hash configured in the Flutterwave dashboard; used to verify webhooks.
  secretHash: process.env.FLUTTERWAVE_SECRET_HASH,
  // v4 API base. Defaults to the sandbox host because the production v4 base must
  // be confirmed from the live dashboard before go-live; set FLUTTERWAVE_API_BASE_URL
  // to the production base in the deployed environment.
  apiBaseUrl: process.env.FLUTTERWAVE_API_BASE_URL || "https://developersandbox-api.flutterwave.com",
  // OAuth token endpoint (same for sandbox/prod).
  tokenUrl:
    process.env.FLUTTERWAVE_TOKEN_URL ||
    "https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token",
  currency: process.env.FLUTTERWAVE_CURRENCY || "GHS",
  // How long a dynamic virtual account stays open, in minutes.
  // Flutterwave requires this to be >= 60, so clamp to that floor.
  vaExpiryMinutes: Math.max(60, Number(process.env.FLUTTERWAVE_VA_EXPIRY_MINUTES || "60")),
}

export function assertFlutterwaveConfig() {
  const missing: string[] = []
  if (!flutterwaveConfig.clientId) missing.push("FLUTTERWAVE_CLIENT_ID")
  if (!flutterwaveConfig.clientSecret) missing.push("FLUTTERWAVE_CLIENT_SECRET")
  if (missing.length > 0) {
    throw new Error(`Flutterwave config missing: ${missing.join(", ")}`)
  }
}
