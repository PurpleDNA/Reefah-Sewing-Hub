import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { flutterwaveConfig } from "@/lib/flutterwave/config"
import { getOrCreateCustomer, createVirtualAccount } from "@/lib/flutterwave"

// POST /api/payments/initiate  { orderId }
// Creates a Flutterwave dynamic virtual account for an order awaiting payment
// and persists the transfer details so the pay page can render + poll them.
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { orderId } = await request.json()
    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 })
    }

    // Load the order; RLS ensures the caller can only read their own.
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, user_id, total, email, first_name, last_name, phone, payment_status")
      .eq("id", orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }
    if (order.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    if (order.payment_status === "paid") {
      return NextResponse.json({ error: "Order already paid" }, { status: 409 })
    }

    // Reuse an existing live payment instead of minting a second virtual account
    // for the same order. Two live VAs = two ways for money to land = double-pay.
    // Only mint a new one if there's no reusable row (none, or the prior expired).
    const { data: existing } = await supabase
      .from("payments")
      .select(
        "reference, status, amount, currency, account_number, account_bank_name, account_expiration",
      )
      .eq("order_id", order.id)
      .in("status", ["pending", "succeeded"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existing && existing.status === "pending") {
      const notExpired =
        !existing.account_expiration || new Date(existing.account_expiration) > new Date()
      if (notExpired) {
        return NextResponse.json({
          reference: existing.reference,
          amount: existing.amount,
          currency: existing.currency,
          account_number: existing.account_number,
          account_bank_name: existing.account_bank_name,
          account_expiration: existing.account_expiration,
        })
      }
    }

    // Flutterwave requires an alphanumeric reference, 6–42 chars (no hyphens/underscores).
    // Strip the order UUID's hyphens and append a base36 timestamp for uniqueness.
    const orderHex = String(order.id).replace(/[^a-z0-9]/gi, "")
    const reference = `reefa${orderHex.slice(0, 20)}${Date.now().toString(36)}`
    const amount = Number(order.total)
    const currency = flutterwaveConfig.currency

    // 1. Customer (reused if the email already exists)  2. Dynamic virtual account
    const customer = await getOrCreateCustomer({
      email: order.email || user.email || "",
      firstName: order.first_name || undefined,
      lastName: order.last_name || undefined,
      phone: order.phone || undefined,
    })

    const account = await createVirtualAccount({
      reference,
      customerId: customer.id,
      amount,
      currency,
      narration: `Reefa order ${String(order.id).slice(0, 8)}`,
    })

    const accountExpiration = account.account_expiration_datetime
      ? new Date(account.account_expiration_datetime).toISOString()
      : null

    // Persist via SECURITY DEFINER RPC (webhook updates the same row later).
    const { error: rpcError } = await supabase.rpc("create_payment", {
      p_order_id: order.id,
      p_reference: reference,
      p_amount: amount,
      p_currency: currency,
      p_flw_virtual_account_id: account.id,
      p_account_number: account.account_number,
      p_account_bank_name: account.account_bank_name,
      p_account_expiration: accountExpiration,
    })

    if (rpcError) {
      console.error("create_payment RPC error:", rpcError)
      return NextResponse.json({ error: "Failed to record payment", details: rpcError }, { status: 500 })
    }

    return NextResponse.json({
      reference,
      amount,
      currency,
      account_number: account.account_number,
      account_bank_name: account.account_bank_name,
      account_expiration: accountExpiration,
    })
  } catch (error: any) {
    console.error("Payment initiation error:", error)
    return NextResponse.json({ error: "Server error", details: error?.message || String(error) }, { status: 500 })
  }
}
