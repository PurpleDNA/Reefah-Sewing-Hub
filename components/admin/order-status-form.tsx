"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { useCustomToast } from "@/hooks/use-custom-toast"

interface OrderStatusFormProps {
  orderId: string
  currentStatus: string
}

export function OrderStatusForm({ orderId, currentStatus }: OrderStatusFormProps) {
  const router = useRouter()
  const [status, setStatus] = useState(currentStatus)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { showSuccess, showError } = useCustomToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const supabase = await createClient()

      // SECURITY DEFINER RPC: admins can change only the status column. orders
      // has no UPDATE RLS policy, so a direct .update() would be silently denied.
      const { data, error } = await supabase.rpc("admin_update_order_status", {
        p_order_id: orderId,
        p_status: status,
      })

      if (error) throw error
      if (data === false) throw new Error("Order not found or could not be updated.")

      showSuccess("The order status has been updated successfully.", "Order updated")

      router.refresh()
    } catch (error: any) {
      showError(error.message || "Something went wrong. Please try again.", "Error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger>
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pending">Awaiting Payment</SelectItem>
          <SelectItem value="processing">Processing</SelectItem>
          <SelectItem value="shipped">Shipped</SelectItem>
          <SelectItem value="delivered">Delivered</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>

      <Button type="submit" className="w-full" disabled={isSubmitting || status === currentStatus}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Updating...
          </>
        ) : (
          "Update Status"
        )}
      </Button>
    </form>
  )
}
