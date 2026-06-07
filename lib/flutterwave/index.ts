// Typed helpers over the Flutterwave v4 API for the Pay-With-Bank-Transfer flow.
// v4 responses are wrapped as { status, message, data }, so we unwrap `.data`.
// Shapes are kept permissive where the docs are ambiguous; the routes log the
// raw objects during sandbox testing so the fields can be tightened later.

import { flutterwaveConfig } from "./config";
import { flwFetch, FlwError } from "./client";

interface FlwEnvelope<T> {
  status?: string;
  message?: string;
  data: T;
}

export interface FlwCustomer {
  id: string;
  email?: string;
}

export interface FlwVirtualAccount {
  id: string;
  account_number: string;
  account_bank_name: string;
  account_expiration_datetime: string;
  reference?: string;
}

export interface FlwCharge {
  id: string;
  status: string; // "succeeded" on success
  amount: number;
  currency: string;
  reference?: string;
  customer_id?: string;
}

// Look up an existing customer by email via the v4 search endpoint
// (POST /customers/search, body { email }). The response shape isn't pinned
// down in the docs, so handle both an array and a single object in `data`.
export async function findCustomerByEmail(
  email: string,
): Promise<FlwCustomer | null> {
  const res = await flwFetch<FlwEnvelope<FlwCustomer[] | FlwCustomer>>(
    "/customers/search",
    {
      method: "POST",
      body: JSON.stringify({ email }),
    },
  );
  const data = res?.data;
  const list = Array.isArray(data) ? data : data ? [data] : [];
  const match = list.find(
    (c) => (c.email || "").toLowerCase() === email.toLowerCase(),
  );
  // Fall back to the first row if the API already filtered server-side.
  return match || list[0] || null;
}

// Reuse an existing customer or create one. We look the customer up by email
// first (Flutterwave keys customers by email, so creating a duplicate 409s
// without echoing the id). The 409 branch on create is a safety net for the
// race where two requests create the same email between the search and create.
export async function getOrCreateCustomer(input: {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}): Promise<FlwCustomer> {
  const existing = await findCustomerByEmail(input.email);
  if (existing) return existing;

  try {
    const res = await flwFetch<FlwEnvelope<FlwCustomer>>("/customers", {
      method: "POST",
      body: JSON.stringify({
        email: input.email,
        name: { first: input.firstName || "", last: input.lastName || "" },
        ...(input.phone
          ? { phone: { number: input.phone, country_code: "233" } }
          : {}),
      }),
    });
    return res.data;
  } catch (err) {
    if (err instanceof FlwError && err.status === 409) {
      const found = await findCustomerByEmail(input.email);
      if (found) return found;
    }
    throw err;
  }
}

export async function createVirtualAccount(input: {
  reference: string;
  customerId: string;
  amount: number;
  currency?: string;
  narration?: string;
}): Promise<FlwVirtualAccount> {
  const res = await flwFetch<FlwEnvelope<FlwVirtualAccount>>(
    "/virtual-accounts",
    {
      method: "POST",
      idempotencyKey: input.reference,
      body: JSON.stringify({
        reference: input.reference,
        customer_id: input.customerId,
        amount: input.amount,
        currency: input.currency || flutterwaveConfig.currency,
        account_type: "dynamic",
        expiry: flutterwaveConfig.vaExpiryMinutes,
        narration: input.narration || "Reefa Sewing Hub order",
      }),
    },
  );
  return res.data;
}

export async function getCharge(chargeId: string): Promise<FlwCharge> {
  const res = await flwFetch<FlwEnvelope<FlwCharge>>(`/charges/${chargeId}`, {
    method: "GET",
  });
  return res.data;
}
