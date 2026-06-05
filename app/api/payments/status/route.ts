import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET /api/payments/status?reference=...
// Returns the current payment status for the pay page to poll. RLS scopes the
// payments row to the owning user.
export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const reference = new URL(request.url).searchParams.get("reference")
    if (!reference) {
      return NextResponse.json({ error: "Missing reference" }, { status: 400 })
    }

    const { data: payment, error } = await supabase
      .from("payments")
      .select("status, amount, currency, account_number, account_bank_name, account_expiration")
      .eq("reference", reference)
      .single()

    if (error || !payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    return NextResponse.json(payment)
  } catch (error: any) {
    console.error("Payment status error:", error)
    return NextResponse.json({ error: "Server error", details: error?.message || String(error) }, { status: 500 })
  }
}
