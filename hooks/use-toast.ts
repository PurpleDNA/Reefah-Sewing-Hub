"use client"

// Re-export the canonical toast store so every import path
// (`@/hooks/use-toast` and `@/components/ui/use-toast`) resolves to a SINGLE
// module instance. They used to be duplicate files with separate private state,
// which meant the <Toaster> subscribed to one store while toast() dispatched
// into the other — so toasts never rendered.
export * from "@/components/ui/use-toast"
