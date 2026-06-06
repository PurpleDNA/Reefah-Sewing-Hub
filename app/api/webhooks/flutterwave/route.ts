import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { verifySignature } from "@/lib/flutterwave/webhook";
import { getCharge } from "@/lib/flutterwave";
import { flutterwaveConfig } from "@/lib/flutterwave/config";

// POST /api/webhooks/flutterwave
// Receives Flutterwave v4 webhooks (notably `charge.completed` for bank transfers).
// Verifies the `flutterwave-signature` HMAC, re-queries the charge to confirm it,
// then idempotently marks the payment + order via the mark_payment_status RPC.
//
// Returns 200 for any *authentic* event (including duplicates / events we don't
// act on) so Flutterwave stops retrying. Returns 401 only when the signature
// fails — that request did not come from Flutterwave.
export async function POST(request: Request) {
  // Raw body is required for signature verification — read it before parsing.
  console.log("Yes, daddy I've been hit");
  const rawBody = await request.text();
  const signature = request.headers.get("flutterwave-signature");
  console.log("signatuie>>>>", signature);

  if (!verifySignature(rawBody, signature)) {
    console.warn("Flutterwave webhook: invalid signature, rejecting.");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const type = event?.type || event?.event;
    const data = event?.data ?? {};

    // Only bank-transfer charge completions matter for this flow.
    if (type !== "charge.completed") {
      console.log("Flutterwave webhook: ignoring event type", type);
      return NextResponse.json({ received: true });
    }

    const chargeId: string | undefined = data?.id;
    if (!chargeId) {
      console.warn(
        "Flutterwave webhook: charge.completed without data.id",
        data,
      );
      return NextResponse.json({ received: true });
    }

    // Re-query the charge as the source of truth (guards against spoofed payloads).
    let charge;
    try {
      charge = await getCharge(chargeId);
    } catch (err) {
      console.error("Flutterwave webhook: getCharge failed", err);
      // Fall back to the webhook payload so a transient API error doesn't drop a real payment.
      charge = data;
    }

    const succeeded =
      charge?.status === "succeeded" || charge?.status === "successful";
    // Gross amount the customer actually transferred. mark_payment_status
    // compares this to the order total (underpaid -> not fulfilled; overpaid ->
    // accepted and flagged for refund). Null if we can't read it — the RPC then
    // skips the check rather than dropping a real payment.
    const rawAmount = charge?.amount ?? data?.amount;
    const amountPaid =
      rawAmount != null && !Number.isNaN(Number(rawAmount)) ? Number(rawAmount) : null;
    // Correlate to our payment row: charge reference, else webhook reference, else the
    // virtual account id. mark_payment_status matches reference OR flw_virtual_account_id.
    const reference: string | undefined =
      charge?.reference ||
      data?.reference ||
      data?.meta?.reference ||
      data?.virtual_account_id;

    if (!reference) {
      console.warn("Flutterwave webhook: could not resolve a reference", {
        chargeId,
        data,
      });
      return NextResponse.json({ received: true });
    }

    if (!succeeded) {
      console.log("Flutterwave webhook: charge not succeeded", {
        reference,
        status: charge?.status,
      });
      const supabase = await createClient();
      await supabase.rpc("mark_payment_status", {
        p_reference: reference,
        p_flw_charge_id: String(chargeId),
        p_status: "failed",
      });
      return NextResponse.json({ received: true });
    }

    // Optional sanity check on currency (amount can include fees/over-payment).
    if (charge?.currency && charge.currency !== flutterwaveConfig.currency) {
      console.warn("Flutterwave webhook: currency mismatch", {
        expected: flutterwaveConfig.currency,
        got: charge.currency,
      });
    }

    const supabase = await createClient();
    const { data: changed, error } = await supabase.rpc("mark_payment_status", {
      p_reference: reference,
      p_flw_charge_id: String(chargeId),
      p_status: "succeeded",
      p_amount_paid: amountPaid,
    });

    if (error) {
      console.error("Flutterwave webhook: mark_payment_status error", error);
      // 500 lets Flutterwave retry, since this is our transient failure.
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    console.log("Flutterwave webhook processed", {
      reference,
      chargeId,
      changed,
    });
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Flutterwave webhook error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
