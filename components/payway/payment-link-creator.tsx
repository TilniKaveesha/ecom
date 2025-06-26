/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Copy, ExternalLink, Loader2 } from "lucide-react"

interface PaymentLinkResult {
  success: boolean
  payment_link: string
  payment_link_id: string
  data: any
}

export default function PaymentLinkCreator() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PaymentLinkResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    const formData = new FormData(e.currentTarget)

    // Set expiration date to 7 days from now
    const expiredDate = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60
    formData.set("expiredDate", expiredDate.toString())

    // Set return URL for webhook
    formData.set("returnUrl", `${window.location.origin}/api/payway/payment-link/webhook`)

    try {
      const response = await fetch("/api/payway/payment-link/create", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setResult(data)
      } else {
        setError(data.error || "Failed to create payment link")
      }
    } catch (err) {
      setError("Network error occurred")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create PayWay Payment Link</CardTitle>
          <CardDescription>Generate a shareable payment link for your customers</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input id="title" name="title" placeholder="Payment for Order #123" required maxLength={250} />
              </div>
              <div>
                <Label htmlFor="merchantRefNo">Reference Number</Label>
                <Input id="merchantRefNo" name="merchantRefNo" placeholder="REF001" maxLength={50} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Amount *</Label>
                <Input id="amount" name="amount" type="number" step="0.01" min="0.01" placeholder="10.00" required />
              </div>
              <div>
                <Label htmlFor="currency">Currency *</Label>
                <Select name="currency" defaultValue="USD" required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="KHR">KHR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" placeholder="Payment for products..." maxLength={250} />
            </div>

            <div>
              <Label htmlFor="paymentLimit">Payment Limit</Label>
              <Input
                id="paymentLimit"
                name="paymentLimit"
                type="number"
                min="1"
                placeholder="Leave empty for unlimited"
              />
            </div>

            <div>
              <Label htmlFor="image">Image (Optional)</Label>
              <Input id="image" name="image" type="file" accept="image/jpeg,image/jpg,image/png" />
              <p className="text-sm text-muted-foreground mt-1">Max 3MB, JPG/JPEG/PNG only</p>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Payment Link
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">✅ Payment Link Created!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Payment Link</Label>
              <div className="flex gap-2">
                <Input value={result.payment_link} readOnly />
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(result.payment_link)}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => window.open(result.payment_link, "_blank")}>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label>Payment Link ID</Label>
              <Input value={result.payment_link_id} readOnly />
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Next Steps:</h4>
              <ul className="text-sm space-y-1">
                <li>• Share the payment link with your customer</li>
                <li>• Customer clicks the link and completes payment</li>
                <li>• You'll receive a webhook notification when paid</li>
                <li>• Check payment status in your PayWay dashboard</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
