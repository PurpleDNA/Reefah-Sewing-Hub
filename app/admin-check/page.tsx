"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"

export default function AdminCheckPage() {
  const { user } = useAuth()
  const [profileData, setProfileData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function checkAdminStatus() {
      try {
        setLoading(true)

        // Fetch from our API endpoint
        const apiResponse = await fetch("/api/admin-check")
        const apiData = await apiResponse.json()

        // Also try direct Supabase query
        let supabaseData = null
        if (user) {
          const supabase = createClient()
          const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

          if (!error) {
            supabaseData = data
          }
        }

        setProfileData({
          api: apiData,
          direct: supabaseData,
        })
      } catch (err) {
        console.error("Error checking admin status:", err)
        setError("Failed to check admin status")
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      checkAdminStatus()
    } else {
      setLoading(false)
    }
  }, [user])

  const makeAdmin = async () => {
    if (!user) return

    try {
      const supabase = createClient()
      await supabase.from("profiles").update({ is_admin: true }).eq("id", user.id)

      // Refresh the data
      window.location.reload()
    } catch (err) {
      console.error("Error making admin:", err)
      setError("Failed to update admin status")
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Admin Status Check</CardTitle>
          <CardDescription>Check if your account has admin privileges</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : !user ? (
            <div>
              <p>You are not logged in.</p>
              <Button className="mt-4" asChild>
                <a href="/auth/login?redirect=/admin-check">Login</a>
              </Button>
            </div>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">User Info:</h3>
                <p>ID: {user.id}</p>
                <p>Email: {user.email}</p>
              </div>

              <div>
                <h3 className="font-medium">Profile Data (API):</h3>
                <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-40">
                  {JSON.stringify(profileData?.api, null, 2)}
                </pre>
              </div>

              <div>
                <h3 className="font-medium">Profile Data (Direct):</h3>
                <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-40">
                  {JSON.stringify(profileData?.direct, null, 2)}
                </pre>
              </div>

              <div className="pt-4">
                <Button onClick={makeAdmin} disabled={profileData?.api?.isAdmin}>
                  {profileData?.api?.isAdmin ? "You are already an admin" : "Make me an admin"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
