// Thin fetch wrapper for the Flutterwave v4 REST API: prepends the base URL and
// injects the bearer token. Throws on non-2xx with the response body for logging.

import { flutterwaveConfig } from "./config"
import { getAccessToken } from "./token"

// Carries the HTTP status + parsed body so callers can branch on specific
// failures (e.g. a 409 "Customer already exists") instead of string-matching.
export class FlwError extends Error {
  status: number
  body: any
  constructor(message: string, status: number, body: any) {
    super(message)
    this.name = "FlwError"
    this.status = status
    this.body = body
  }
}

export async function flwFetch<T = any>(
  path: string,
  init: RequestInit & { idempotencyKey?: string } = {},
): Promise<T> {
  const token = await getAccessToken()
  const { idempotencyKey, headers, ...rest } = init

  const res = await fetch(`${flutterwaveConfig.apiBaseUrl}${path}`, {
    ...rest,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(idempotencyKey ? { "X-Idempotency-Key": idempotencyKey } : {}),
      ...headers,
    },
    cache: "no-store",
  })

  const text = await res.text()
  if (!res.ok) {
    let body: any = text
    try {
      body = text ? JSON.parse(text) : null
    } catch {
      /* keep raw text */
    }
    throw new FlwError(
      `Flutterwave ${rest.method || "GET"} ${path} failed (${res.status}): ${text}`,
      res.status,
      body,
    )
  }

  return text ? (JSON.parse(text) as T) : (undefined as T)
}
