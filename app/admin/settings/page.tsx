"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

export default function SettingsPage() {
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [storeSettings, setStoreSettings] = useState({
    storeName: "Betza Store",
    storeEmail: "contact@betzastore.com",
    storePhone: "+234 803 123 4567",
    storeAddress: "123 Adeola Odeku Street, Victoria Island, Lagos",
    enableCheckout: true,
    enableReviews: true,
    enableRegistration: true,
  })

  const handleStoreSettingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setStoreSettings({
      ...storeSettings,
      [name]: value,
    })
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setStoreSettings({
      ...storeSettings,
      [name]: checked,
    })
  }

  const handleSaveSettings = async () => {
    setIsSubmitting(true)

    // Simulate saving settings
    await new Promise((resolve) => setTimeout(resolve, 1000))

    toast({
      title: "Settings saved",
      description: "Your store settings have been updated successfully.",
    })

    setIsSubmitting(false)
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <Tabs defaultValue="general">
        <TabsList className="mb-8">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="checkout">Checkout</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Store Information</CardTitle>
              <CardDescription>Manage your store details and contact information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="storeName">Store Name</Label>
                  <Input
                    id="storeName"
                    name="storeName"
                    value={storeSettings.storeName}
                    onChange={handleStoreSettingChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storeEmail">Store Email</Label>
                  <Input
                    id="storeEmail"
                    name="storeEmail"
                    type="email"
                    value={storeSettings.storeEmail}
                    onChange={handleStoreSettingChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storePhone">Store Phone</Label>
                  <Input
                    id="storePhone"
                    name="storePhone"
                    value={storeSettings.storePhone}
                    onChange={handleStoreSettingChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storeAddress">Store Address</Label>
                  <Input
                    id="storeAddress"
                    name="storeAddress"
                    value={storeSettings.storeAddress}
                    onChange={handleStoreSettingChange}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableRegistration">Enable User Registration</Label>
                    <p className="text-sm text-muted-foreground">Allow new users to register on your store</p>
                  </div>
                  <Switch
                    id="enableRegistration"
                    checked={storeSettings.enableRegistration}
                    onCheckedChange={(checked) => handleSwitchChange("enableRegistration", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableReviews">Enable Product Reviews</Label>
                    <p className="text-sm text-muted-foreground">Allow customers to leave reviews on products</p>
                  </div>
                  <Switch
                    id="enableReviews"
                    checked={storeSettings.enableReviews}
                    onCheckedChange={(checked) => handleSwitchChange("enableReviews", checked)}
                  />
                </div>
              </div>

              <Button onClick={handleSaveSettings} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checkout">
          <Card>
            <CardHeader>
              <CardTitle>Checkout Settings</CardTitle>
              <CardDescription>Configure your store's checkout process and payment options.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableCheckout">Enable Checkout</Label>
                  <p className="text-sm text-muted-foreground">Allow customers to complete purchases</p>
                </div>
                <Switch
                  id="enableCheckout"
                  checked={storeSettings.enableCheckout}
                  onCheckedChange={(checked) => handleSwitchChange("enableCheckout", checked)}
                />
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Payment Methods</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="paymentCash" className="rounded border-gray-300" defaultChecked />
                    <Label htmlFor="paymentCash">Cash on Delivery</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="paymentBank" className="rounded border-gray-300" defaultChecked />
                    <Label htmlFor="paymentBank">Bank Transfer</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="paymentCard" className="rounded border-gray-300" defaultChecked />
                    <Label htmlFor="paymentCard">Credit/Debit Card</Label>
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveSettings} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure email notifications for orders and customer interactions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>New Order Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive email when a new order is placed</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Customer Registration</Label>
                    <p className="text-sm text-muted-foreground">Receive email when a new customer registers</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Product Reviews</Label>
                    <p className="text-sm text-muted-foreground">Receive email when a product receives a review</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Low Stock Alerts</Label>
                    <p className="text-sm text-muted-foreground">Receive email when product stock is low</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <Button onClick={handleSaveSettings} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
