import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"

export default async function CustomersPage() {
  const supabase = createClient()

  // Fetch users with profiles
  const { data: users, error } = await supabase
    .from("profiles")
    .select("*, users:user_id(email, created_at)")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching customers:", error)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Customers</h1>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users && users.length > 0 ? (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name || "No name provided"}</TableCell>
                    <TableCell>{user.users?.email || "No email"}</TableCell>
                    <TableCell>{user.phone || "No phone"}</TableCell>
                    <TableCell>
                      {user.is_admin ? (
                        <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">Admin</Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Customer</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.users?.created_at
                        ? formatDistanceToNow(new Date(user.users.created_at), { addSuffix: true })
                        : "Unknown"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No customers found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
