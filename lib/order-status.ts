// Single source of truth for how an order's `status` is labelled + coloured.
// `pending` means the order is still awaiting payment; a successful payment
// advances it to `processing` (see sql/order-status-on-payment.sql).
export function getOrderStatusMeta(status?: string): { label: string; className: string } {
  switch (status) {
    case "pending":
      return { label: "Awaiting Payment", className: "bg-amber-50 text-amber-700" }
    case "processing":
      return { label: "Processing", className: "bg-blue-50 text-blue-700" }
    case "shipped":
      return { label: "Shipped", className: "bg-blue-50 text-blue-700" }
    case "delivered":
      return { label: "Delivered", className: "bg-green-50 text-green-700" }
    case "cancelled":
      return { label: "Cancelled", className: "bg-red-50 text-red-700" }
    default:
      return {
        label: status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown",
        className: "bg-muted text-muted-foreground",
      }
  }
}
