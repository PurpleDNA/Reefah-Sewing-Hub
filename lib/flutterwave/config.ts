// Flutterwave v4 configuration, read from server-only env vars.
// NOTE: business is in Ghana, but we test against a Nigerian sandbox account, so
// FLUTTERWAVE_CURRENCY defaults to "NGN". Switch to "GHS" at go-live.

export const flutterwaveConfig = {
  clientId: process.env.FLUTTERWAVE_CLIENT_ID,
  clientSecret: process.env.FLUTTERWAVE_CLIENT_SECRET,
  // Secret hash configured in the Flutterwave dashboard; used to verify webhooks.
  secretHash: process.env.FLUTTERWAVE_SECRET_HASH,
  // v4 API base. Sandbox by default; set to the production base at go-live.
  apiBaseUrl: process.env.FLUTTERWAVE_API_BASE_URL || "https://developersandbox-api.flutterwave.com",
  // OAuth token endpoint (same for sandbox/prod).
  tokenUrl:
    process.env.FLUTTERWAVE_TOKEN_URL ||
    "https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token",
  currency: process.env.FLUTTERWAVE_CURRENCY || "NGN",
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
