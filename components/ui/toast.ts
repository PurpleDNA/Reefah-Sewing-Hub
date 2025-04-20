"use client"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  type ToastProps,
  type ToastActionElement,
} from "@/components/ui/toast/toast-primitive"

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  type ToastProps,
  type ToastActionElement,
}

// Create a hook to use the toast
import { useToast as useToastOriginal } from "@/components/ui/use-toast"

export const useToast = () => {
  const { toast } = useToastOriginal()

  return {
    toast: (props: any) => {
      // Set default duration if not provided
      if (!props.duration) {
        props.duration = 5000
      }

      return toast(props)
    },
  }
}
