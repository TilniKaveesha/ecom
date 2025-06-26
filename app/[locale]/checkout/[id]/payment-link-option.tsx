/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Copy, ExternalLink, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface PaymentLinkOptionProps {
  orderId: string
  amount: number
  customerInfo: {
    name: string
    email: string
    phone: string
  }
  onSuccess?: () => void
  onError?: (error: string) => void
}

export default function PaymentLinkOption({
  orderId,
  amount,
  customerInfo,
  onSuccess,
  onError,
}: PaymentLinkOptionProps) {
  const [loading, setLoading] = useState(false)
  const [paymentLink, setPaymentLink] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const createPaymentLink = async () => {
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("title", `Payment for Order #${orderId}`)
      formData.append("amount", amount.toString())
      formData.append("currency", "USD")
      formData.append("description", `Payment for order ${orderId}`)
      formData.append("merchantRefNo", orderId)
      formData.append("paymentLimit", "1") // Only allow one payment

      // Set expiration to 24 hours from now
      const expiredDate = Math.floor(Date.now() / 1000) + 24 * 60 * 60
      formData.append("expiredDate", expiredDate.toString())

      // Webhook URL
      formData.append("returnUrl", `${window.location.origin}/api/payway/payment-link/webhook`)

      const response = await fetch("/api/payway/payment-link/create", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setPaymentLink(data.payment_link)
        toast({
          title: "Payment Link Created",
          description: "Share this link with your customer to complete payment",
        })
        onSuccess?.()
      } else {
        const errorMsg = data.error || "Failed to create payment link"
        setError(errorMsg)
        onError?.(errorMsg)
      }
    } catch (err) {
      const errorMsg = "Network error occurred"
      setError(errorMsg)
      onError?.(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: "Payment link copied to clipboard",
    })
  }

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Payment Required - Order #${orderId}`)
    const body = encodeURIComponent(`
Hi ${customerInfo.name},

Please complete your payment using the link below:
${paymentLink}

Order Details:
- Order ID: ${orderId}
- Amount: $${amount}

Thank you!
    `)
    window.open(`mailto:${customerInfo.email}?subject=${subject}&body=${body}`)
  }

  if (paymentLink) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-green-600">✅ Payment Link Created!</h3>
          <p className="text-sm text-muted-foreground">Share this link to complete payment</p>
        </div>

        <div>
          <Label>Payment Link</Label>
          <div className="flex gap-2">
            <Input value={paymentLink} readOnly className="text-sm" />
            <Button variant="outline" size="icon" onClick={() => copyToClipboard(paymentLink)}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => window.open(paymentLink, "_blank")}>
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={shareViaEmail} variant="outline" className="flex-1">
            📧 Email Link
          </Button>
          <Button onClick={() => copyToClipboard(paymentLink)} className="flex-1">
            📋 Copy Link
          </Button>
        </div>

        <Alert>
          <AlertDescription>
            <strong>Next Steps:</strong>
            <ul className="mt-2 space-y-1 text-sm">
              <li>• Customer clicks the link and completes payment</li>
              <li>• Order status updates automatically when paid</li>
              <li>• Link expires in 24 hours</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Create Payment Link</h3>
        <p className="text-sm text-muted-foreground">Generate a shareable payment link for this order</p>
      </div>

      <div className="bg-muted p-4 rounded-lg">
        <h4 className="font-medium mb-2">Order Details:</h4>
        <div className="text-sm space-y-1">
          <p>
            <strong>Order ID:</strong> {orderId}
          </p>
          <p>
            <strong>Amount:</strong> ${amount}
          </p>
          <p>
            <strong>Customer:</strong> {customerInfo.name}
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button onClick={createPaymentLink} disabled={loading} className="w-full">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Create Payment Link
      </Button>

      <Alert>
        <AlertDescription>
          <strong>Perfect for:</strong> Remote sales, delayed payments, or when direct payment fails.
        </AlertDescription>
      </Alert>
    </div>
  )
}
