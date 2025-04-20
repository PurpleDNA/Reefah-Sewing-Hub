"use client"

import { useToast } from "@/components/ui/use-toast"

export function useCustomToast() {
  const { toast } = useToast()

  const showToast = (props: {
    title?: string
    description: string
    variant?: "default" | "destructive"
    duration?: number
  }) => {
    // Set default duration if not provided
    const duration = props.duration || 5000

    toast({
      ...props,
      duration,
    })
  }

  const showSuccess = (message: string, title = "Success") => {
    showToast({
      title,
      description: message,
      duration: 5000,
    })
  }

  const showError = (message: string, title = "Error") => {
    showToast({
      title,
      description: message,
      variant: "destructive",
      duration: 7000,
    })
  }

  return {
    showToast,
    showSuccess,
    showError,
  }
}
