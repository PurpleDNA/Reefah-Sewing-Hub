"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { AboutValue, StoreSettings } from "@/types"

const FALLBACK_SETTINGS: StoreSettings = {
  store_name: "",
  store_email: "",
  store_phone: "",
  store_address: "",
  store_description: "",
  enable_reviews: true,
  enable_guest_checkout: true,
  facebook_url: "",
  instagram_url: "",
  about_story: "",
  about_mission: "",
  about_values: [
    { title: "", description: "" },
    { title: "", description: "" },
    { title: "", description: "" },
  ],
}

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [settings, setSettings] = useState<StoreSettings>(FALLBACK_SETTINGS)

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.from("store_settings").select("*").eq("id", true).single()
        if (error) throw error
        if (data) {
          setSettings({
            ...FALLBACK_SETTINGS,
            ...data,
            about_values:
              Array.isArray(data.about_values) && data.about_values.length === 3
                ? (data.about_values as AboutValue[])
                : FALLBACK_SETTINGS.about_values,
          })
        }
      } catch (err: any) {
        toast({
          title: "Could not load settings",
          description: err.message || "Please refresh and try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const handleFieldChange = (name: keyof StoreSettings, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [name]: value }))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    handleFieldChange(e.target.name as keyof StoreSettings, e.target.value)
  }

  const handleValueChange = (index: number, key: keyof AboutValue, value: string) => {
    setSettings((prev) => ({
      ...prev,
      about_values: prev.about_values.map((v, i) => (i === index ? { ...v, [key]: value } : v)),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.rpc("update_store_settings", {
        p_store_name: settings.store_name,
        p_store_email: settings.store_email,
        p_store_phone: settings.store_phone,
        p_store_address: settings.store_address,
        p_store_description: settings.store_description,
        p_enable_reviews: settings.enable_reviews,
        p_enable_guest_checkout: settings.enable_guest_checkout,
        p_facebook_url: settings.facebook_url,
        p_instagram_url: settings.instagram_url,
        p_about_story: settings.about_story,
        p_about_mission: settings.about_mission,
        p_about_values: settings.about_values,
      })

      if (error) throw error

      toast({
        title: "Settings saved",
        description: "Your store settings have been updated successfully.",
      })
    } catch (err: any) {
      toast({
        title: "Failed to save settings",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading settings...
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Store Information</CardTitle>
              <CardDescription>Manage your store details and contact information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="store_name">Store Name</Label>
                  <Input id="store_name" name="store_name" value={settings.store_name} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="store_email">Email Address</Label>
                  <Input
                    id="store_email"
                    name="store_email"
                    type="email"
                    value={settings.store_email}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="store_phone">Phone Number</Label>
                  <Input
                    id="store_phone"
                    name="store_phone"
                    value={settings.store_phone}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="store_address">Address</Label>
                  <Input
                    id="store_address"
                    name="store_address"
                    value={settings.store_address}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="store_description">Store Description</Label>
                <Textarea
                  id="store_description"
                  name="store_description"
                  value={settings.store_description}
                  onChange={handleInputChange}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Social Media</CardTitle>
              <CardDescription>Links shown in the site footer. Leave blank to hide a link.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="facebook_url">Facebook URL</Label>
                  <Input
                    id="facebook_url"
                    name="facebook_url"
                    placeholder="https://facebook.com/..."
                    value={settings.facebook_url}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram_url">Instagram URL</Label>
                  <Input
                    id="instagram_url"
                    name="instagram_url"
                    placeholder="https://instagram.com/..."
                    value={settings.instagram_url}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>About Page</CardTitle>
              <CardDescription>The story, mission, and values shown on your public About page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="about_story">Our Story</Label>
                <Textarea
                  id="about_story"
                  name="about_story"
                  value={settings.about_story}
                  onChange={handleInputChange}
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  Separate paragraphs with a blank line.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="about_mission">Our Mission</Label>
                <Textarea
                  id="about_mission"
                  name="about_mission"
                  value={settings.about_mission}
                  onChange={handleInputChange}
                  rows={4}
                />
              </div>

              <div className="space-y-3">
                <Label>Our Values (exactly 3)</Label>
                {settings.about_values.map((value, i) => (
                  <div key={i} className="space-y-2 rounded-lg border p-4">
                    <div className="space-y-2">
                      <Label htmlFor={`value_title_${i}`} className="text-sm text-muted-foreground">
                        Value {i + 1} title
                      </Label>
                      <Input
                        id={`value_title_${i}`}
                        value={value.title}
                        onChange={(e) => handleValueChange(i, "title", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`value_desc_${i}`} className="text-sm text-muted-foreground">
                        Value {i + 1} description
                      </Label>
                      <Textarea
                        id={`value_desc_${i}`}
                        value={value.description}
                        onChange={(e) => handleValueChange(i, "description", e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
              <CardDescription>Enable or disable store features.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableReviews">Product Reviews</Label>
                  <p className="text-sm text-muted-foreground">Allow customers to leave reviews on products</p>
                </div>
                <Switch
                  id="enableReviews"
                  checked={settings.enable_reviews}
                  onCheckedChange={(checked) => handleFieldChange("enable_reviews", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableGuestCheckout">Guest Checkout</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow customers to checkout without creating an account
                  </p>
                </div>
                <Switch
                  id="enableGuestCheckout"
                  checked={settings.enable_guest_checkout}
                  onCheckedChange={(checked) => handleFieldChange("enable_guest_checkout", checked)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Configure your payment gateways and methods.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Payment settings will be available soon.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure your email and SMS notification preferences.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Notification settings will be available soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
