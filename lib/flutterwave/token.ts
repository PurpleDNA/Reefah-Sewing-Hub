// OAuth client-credentials token for the Flutterwave v4 API.
// Tokens live ~10 minutes (expires_in: 600). We cache the token in module scope
// and refresh ~60s before expiry. In a serverless deployment this cache is
// per-instance, which is fine — a cold instance just fetches a fresh token.

import { flutterwaveConfig, assertFlutterwaveConfig } from "./config"

let cached: { token: string; expiresAt: number } | null = null

export async function getAccessToken(): Promise<string> {
  assertFlutterwaveConfig()

  const now = Date.now()
  if (cached && cached.expiresAt - 60_000 > now) {
    return cached.token
  }

  const body = new URLSearchParams({
    client_id: flutterwaveConfig.clientId as string,
    client_secret: flutterwaveConfig.clientSecret as string,
    grant_type: "client_credentials",
  })

  const res = await fetch(flutterwaveConfig.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => "")
    throw new Error(`Flutterwave token request failed (${res.status}): ${detail}`)
  }

  const json = (await res.json()) as { access_token: string; expires_in: number }
  cached = {
    token: json.access_token,
    expiresAt: Date.now() + (json.expires_in ?? 600) * 1000,
  }
  return cached.token
}
