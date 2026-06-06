import { createClient } from "@/lib/supabase/server"
import { MessagesList } from "@/components/admin/messages-list"
import type { ContactMessage } from "@/types"

export const dynamic = "force-dynamic"

export default async function MessagesPage() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching contact messages:", error)
  }

  const messages = (data as ContactMessage[]) || []
  const unreadCount = messages.filter((m) => !m.is_read).length

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Messages</h1>
        {unreadCount > 0 && (
          <span className="rounded-full bg-green-600 px-3 py-1 text-sm font-medium text-white">
            {unreadCount} unread
          </span>
        )}
      </div>

      <MessagesList initialMessages={messages} />
    </div>
  )
}
