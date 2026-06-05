"use client"

import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { useCart } from "@/hooks/use-cart"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { CheckCircle2, Clock, Copy, Loader2, ShoppingBag } from "lucide-react"

interface PaymentInfo {
  reference: string
  status: "pending" | "succeeded" | "failed" | "expired"
  amount: number
  currency: string
  account_number: string | null
  account_bank_name: string | null
  account_expiration: string | null
}

export default function PayPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const { user } = useAuth()
  const { clearCart } = useCart()

  const [payment, setPayment] = useState<PaymentInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [remaining, setRemaining] = useState<number | null>(null)
  const [pollingStarted, setPollingStarted] = useState(false)
  const cartCleared = useRef(false)

  // Initial load: read the payment row for this order (most recent attempt).
  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    const load = async () => {
      try {
        const supabase = await createClient()
        const { data, error } = await supabase
          .from("payments")
          .select("reference, status, amount, currency, account_number, account_bank_name, account_expiration")
          .eq("order_id", orderId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        if (error || !data) throw error || new Error("Payment not found")
        setPayment(data as PaymentInfo)
      } catch (err: any) {
        console.error("Error loading payment:", err)
        setError("We couldn't find the payment details for this order.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, orderId])

  // Poll the status endpoint while the payment is pending — but only after the
  // customer confirms they've sent the transfer (avoids needless polling while
  // they're still copying the account details).
  useEffect(() => {
    if (!pollingStarted || !payment || payment.status !== "pending") return
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/status?reference=${encodeURIComponent(payment.reference)}`)
        if (!res.ok) return
        const data = (await res.json()) as PaymentInfo
        setPayment((prev) => (prev ? { ...prev, ...data } : prev))
      } catch (err) {
        console.error("Status poll failed:", err)
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [pollingStarted, payment])

  // Clear the cart once payment is confirmed (only once).
  useEffect(() => {
    if (payment?.status === "succeeded" && !cartCleared.current) {
      cartCleared.current = true
      clearCart()
    }
  }, [payment?.status, clearCart])

  // Countdown to virtual-account expiry.
  useEffect(() => {
    if (!payment?.account_expiration || payment.status !== "pending") {
      setRemaining(null)
      return
    }
    const expiry = new Date(payment.account_expiration).getTime()
    const tick = () => setRemaining(Math.max(0, Math.floor((expiry - Date.now()) / 1000)))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [payment?.account_expiration, payment?.status])

  const copyAccount = async () => {
    if (!payment?.account_number) return
    await navigator.clipboard.writeText(payment.account_number)
    toast({ title: "Copied", description: "Account number copied to clipboard." })
  }

  const formatAmount = (p: PaymentInfo) => `${p.currency} ${Number(p.amount).toLocaleString()}`
  const formatCountdown = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Please log in to complete your payment</h2>
        <Button asChild>
          <Link href={`/auth/login?redirect=/checkout/${orderId}/pay`}>Login</Link>
        </Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Loader2 className="mx-auto h-16 w-16 text-muted-foreground mb-4 animate-spin" />
        <h2 className="text-2xl font-bold mb-2">Loading payment details...</h2>
      </div>
    )
  }

  if (error || !payment) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-2">Payment unavailable</h2>
        <p className="text-muted-foreground mb-8">{error || "Something went wrong."}</p>
        <Button asChild>
          <Link href="/checkout">Back to checkout</Link>
        </Button>
      </div>
    )
  }

  if (payment.status === "succeeded") {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Payment received!</h2>
        <p className="text-muted-foreground mb-8">
          Thank you. Your order is confirmed and we'll get it ready for you.
        </p>
        <Button asChild>
          <Link href="/orders">View my orders</Link>
        </Button>
      </div>
    )
  }

  if (payment.status === "expired" || payment.status === "failed") {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-2">
          {payment.status === "expired" ? "This payment expired" : "Payment failed"}
        </h2>
        <p className="text-muted-foreground mb-8">
          The transfer wasn't completed in time. You can start the checkout again.
        </p>
        <Button asChild>
          <Link href="/checkout">Try again</Link>
        </Button>
      </div>
    )
  }

  // status === "pending"
  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <h1 className="text-3xl font-bold mb-2">Complete your bank transfer</h1>
      <p className="text-muted-foreground mb-8">
        Transfer the exact amount to the account below from your banking app, then tap
        “I've transferred the money” so we can confirm your payment.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Transfer details</span>
            {remaining !== null && (
              <span className="flex items-center gap-1 text-sm font-normal text-muted-foreground">
                <Clock className="h-4 w-4" /> {formatCountdown(remaining)}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between border-b pb-3">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-bold">{formatAmount(payment)}</span>
          </div>
          <div className="flex justify-between border-b pb-3">
            <span className="text-muted-foreground">Bank</span>
            <span className="font-medium">{payment.account_bank_name || "—"}</span>
          </div>
          <div className="flex justify-between items-center border-b pb-3">
            <span className="text-muted-foreground">Account number</span>
            <span className="flex items-center gap-2 font-mono font-medium">
              {payment.account_number || "—"}
              {payment.account_number && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyAccount}>
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </span>
          </div>

          {pollingStarted ? (
            <div className="flex items-center justify-center gap-2 pt-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Confirming your transfer...
            </div>
          ) : (
            <Button className="w-full" onClick={() => setPollingStarted(true)}>
              I've transferred the money
            </Button>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground mt-4 text-center">
        {pollingStarted ? (
          <>
            Keep this page open — it'll confirm automatically. You can also check{" "}
            <Link href="/orders" className="underline">
              your orders
            </Link>
            .
          </>
        ) : (
          "Tap the button above only after you've completed the transfer in your bank app."
        )}
      </p>
    </div>
  )
}
