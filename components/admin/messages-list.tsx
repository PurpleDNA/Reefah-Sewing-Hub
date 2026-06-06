"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Mail, MailOpen, Trash2, Reply, Loader2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import type { ContactMessage } from "@/types"

export function MessagesList({ initialMessages }: { initialMessages: ContactMessage[] }) {
  const [messages, setMessages] = useState<ContactMessage[]>(initialMessages)
  const [busyId, setBusyId] = useState<string | null>(null)

  const toggleRead = async (msg: ContactMessage) => {
    setBusyId(msg.id)
    try {
      const supabase = createClient()
      const nextRead = !msg.is_read
      const { error } = await supabase
        .from("contact_messages")
        .update({ is_read: nextRead })
        .eq("id", msg.id)

      if (error) throw error

      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, is_read: nextRead } : m)))
    } catch (err: any) {
      toast({
        title: "Could not update message",
        description: err.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setBusyId(null)
    }
  }

  const deleteMessage = async (msg: ContactMessage) => {
    setBusyId(msg.id)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("contact_messages").delete().eq("id", msg.id)

      if (error) throw error

      setMessages((prev) => prev.filter((m) => m.id !== msg.id))
      toast({ title: "Message deleted" })
    } catch (err: any) {
      toast({
        title: "Could not delete message",
        description: err.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setBusyId(null)
    }
  }

  if (messages.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-muted-foreground">No messages yet.</CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {messages.map((msg) => (
        <Card key={msg.id} className={msg.is_read ? "" : "border-green-500/60 bg-green-50/50 dark:bg-green-950/20"}>
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{msg.subject}</h3>
                {!msg.is_read && <Badge className="bg-green-600 hover:bg-green-600">New</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">
                {msg.name} &middot;{" "}
                <a href={`mailto:${msg.email}`} className="hover:underline">
                  {msg.email}
                </a>{" "}
                &middot; {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleRead(msg)}
                disabled={busyId === msg.id}
                title={msg.is_read ? "Mark as unread" : "Mark as read"}
              >
                {busyId === msg.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : msg.is_read ? (
                  <Mail className="h-4 w-4" />
                ) : (
                  <MailOpen className="h-4 w-4" />
                )}
              </Button>
              <Button variant="outline" size="sm" asChild title="Reply by email">
                <a href={`mailto:${msg.email}?subject=${encodeURIComponent(`Re: ${msg.subject}`)}`}>
                  <Reply className="h-4 w-4" />
                </a>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={busyId === msg.id} title="Delete">
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this message?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This permanently removes the message from {msg.name}. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 hover:bg-red-700"
                      onClick={() => deleteMessage(msg)}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{msg.message}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
