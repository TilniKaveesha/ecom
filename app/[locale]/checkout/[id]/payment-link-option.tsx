/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Copy,
  ExternalLink,
  Loader2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Mail,
  MessageSquare,
  Eye,
  Plus,
  Search,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

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

interface PaymentLinkStatus {
  success: boolean
  status?: string
  is_paid?: boolean
  payment_count?: number
  total_paid?: number
  error?: string
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
  const [paymentLinkId, setPaymentLinkId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [linkStatus, setLinkStatus] = useState<PaymentLinkStatus | null>(null)
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [showPopup, setShowPopup] = useState(false)
  const [fetchingLink, setFetchingLink] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const checkPaymentStatus = useCallback(async () => {
    if (!paymentLinkId) return

    setCheckingStatus(true)
    try {
      const response = await fetch(`/api/payway/payment-link/status?id=${paymentLinkId}`)
      const data = await response.json()
      setLinkStatus(data)

      if (data.is_paid) {
        toast({
          title: "🎉 Payment Received!",
          description: "The payment has been completed successfully",
        })
        onSuccess?.()
      }
    } catch (err) {
      console.error("Error checking payment status:", err)
    } finally {
      setCheckingStatus(false)
    }
  }, [paymentLinkId, toast, onSuccess])

  // Auto-refresh payment status
  useEffect(() => {
    if (paymentLinkId && !linkStatus?.is_paid) {
      const interval = setInterval(checkPaymentStatus, 30000)
      return () => clearInterval(interval)
    }
  }, [paymentLinkId, linkStatus?.is_paid, checkPaymentStatus])

  const normalizePaymentLink = (link: string): string => {
    if (!link) return ""
    if (!link.startsWith("http://") && !link.startsWith("https://")) {
      return `https://${link}`
    }
    if (link.startsWith("http://")) {
      return link.replace("http://", "https://")
    }
    return link
  }

  const redirectToPaymentLinks = () => {
    setRedirecting(true)
    toast({
      title: "🔄 Redirecting...",
      description: "Taking you to your payment links page",
    })

    // Small delay for better UX
    setTimeout(() => {
      router.push("/account/payment-links")
    }, 1500)
  }

  const createPaymentLink = async () => {
    setLoading(true)
    setError(null)
    setPaymentLink(null)
    setPaymentLinkId(null)

    try {
      const formData = new FormData()
      formData.append("title", `Payment for Order #${orderId}`)
      formData.append("amount", amount.toString())
      formData.append("currency", "USD")
      formData.append("description", `Payment for order ${orderId} - ${customerInfo.name}`)
      formData.append("merchantRefNo", orderId)
      formData.append("paymentLimit", "1")

      const expiredDate = Math.floor(Date.now() / 1000) + 24 * 60 * 60
      formData.append("expiredDate", expiredDate.toString())
      formData.append("returnUrl", `${window.location.origin}/api/payway/payment-link/webhook`)

      const response = await fetch("/api/payway/payment-link/create", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      if (data.success && data.payment_link) {
        const normalizedLink = normalizePaymentLink(data.payment_link)

        setPaymentLink(normalizedLink)
        setPaymentLinkId(data.payment_link_id)

        toast({
          title: "✅ Payment Link Created Successfully!",
          description: "Redirecting you to your payment links page...",
          duration: 3000,
        })

        onSuccess?.()

        // Auto-redirect after successful creation
        setTimeout(() => {
          redirectToPaymentLinks()
        }, 2000)
      } else {
        throw new Error(data.error || "Failed to create payment link")
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Network error occurred"
      setError(errorMsg)
      onError?.(errorMsg)

      toast({
        title: "❌ Error",
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchExistingLink = async () => {
    setFetchingLink(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/payment-links?orderId=${orderId}`)

      if (response.ok) {
        const data = await response.json()

        if (data.paymentLinks && data.paymentLinks.length > 0) {
          const existingLink = data.paymentLinks[0]
          const normalizedLink = normalizePaymentLink(existingLink.payment_link)

          setPaymentLink(normalizedLink)
          setPaymentLinkId(existingLink.payment_link_id)

          toast({
            title: "✅ Payment Link Found",
            description: "Existing payment link retrieved successfully!",
          })
        } else {
          toast({
            title: "ℹ️ No Existing Link",
            description: "No payment link found for this order. Create a new one.",
          })
        }
      } else {
        throw new Error("Failed to fetch existing payment link")
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to fetch existing link"
      setError(errorMsg)

      toast({
        title: "❌ Error",
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      setFetchingLink(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "📋 Copied!",
        description: "Payment link copied to clipboard",
      })
    } catch (err) {
      const textArea = document.createElement("textarea")
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand("copy")
        toast({
          title: "📋 Copied!",
          description: "Payment link copied to clipboard",
        })
      } catch (fallbackErr) {
        toast({
          title: "❌ Copy Failed",
          description: "Failed to copy to clipboard",
          variant: "destructive",
        })
      }
      document.body.removeChild(textArea)
    }
  }

  const openPaymentLink = () => {
    if (paymentLink) {
      window.open(paymentLink, "_blank", "noopener,noreferrer")
    }
  }

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Payment Required - Order #${orderId}`)
    const body = encodeURIComponent(`
Hi ${customerInfo.name},

Please complete your payment using the secure link below:
${paymentLink}

Order Details:
- Order ID: ${orderId}
- Amount: $${amount.toFixed(2)}
- Customer: ${customerInfo.name}

This link will expire in 24 hours.

Thank you for your business!

Best regards,
Your Store Team
    `)
    window.open(`mailto:${customerInfo.email}?subject=${subject}&body=${body}`)
  }

  const shareViaSMS = () => {
    const message = encodeURIComponent(
      `Hi ${customerInfo.name}, please complete your payment for Order #${orderId} ($${amount.toFixed(2)}) using this secure link: ${paymentLink}`,
    )
    window.open(`sms:${customerInfo.phone}?body=${message}`)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Payment Link Management</CardTitle>
          <CardDescription>Create or retrieve a secure payment link for this order</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Order Summary */}
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-3">Order Summary:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order ID:</span>
                <span className="font-mono">{orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-semibold">${amount.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer:</span>
                <span>{customerInfo.name}</span>
              </div>
            </div>
          </div>

          {/* Success Message with Redirect Info */}
          {paymentLink && !redirecting && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <strong className="text-green-800">🎉 Payment Link Created Successfully!</strong>
                <br />
                <span className="text-sm text-green-700">
                  You will be redirected to your payment links page shortly, or you can{" "}
                  <button onClick={redirectToPaymentLinks} className="underline font-medium hover:text-green-800">
                    click here to go now
                  </button>
                </span>
              </AlertDescription>
            </Alert>
          )}

          {/* Redirecting Message */}
          {redirecting && (
            <Alert className="border-blue-200 bg-blue-50">
              <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
              <AlertDescription>
                <strong className="text-blue-800">🔄 Redirecting...</strong>
                <br />
                <span className="text-sm text-blue-700">Taking you to your payment links page...</span>
              </AlertDescription>
            </Alert>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="relative">
            <Button onClick={createPaymentLink} disabled={loading || redirecting} className="w-full" size="lg">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Plus className="mr-2 h-4 w-4" />
              Create New Link
            </Button>
          </div>

          {/* Payment Link Display - Only show if not redirecting */}
          {paymentLink && !redirecting && (
            <div className="space-y-3">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <strong className="text-green-800">🎉 Payment Link Ready!</strong>
                  <br />
                  <a
                    href={paymentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline break-all hover:text-blue-800 font-mono text-sm"
                  >
                    {paymentLink}
                  </a>
                </AlertDescription>
              </Alert>

              {/* Link Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Button variant="outline" onClick={() => copyToClipboard(paymentLink)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
                <Button variant="outline" onClick={openPaymentLink}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Link
                </Button>
                <Button variant="outline" onClick={() => setShowPopup(true)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Page
                </Button>
              </div>

              {/* Payment Status */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Payment Status:</span>
                  {linkStatus?.is_paid ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Paid
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <XCircle className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={checkPaymentStatus} disabled={checkingStatus}>
                  {checkingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Refresh
                </Button>
              </div>

              {/* Share Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button onClick={shareViaEmail} variant="outline" className="flex items-center gap-2 bg-transparent">
                  <Mail className="h-4 w-4" />
                  Email Link
                </Button>
                <Button onClick={shareViaSMS} variant="outline" className="flex items-center gap-2 bg-transparent">
                  <MessageSquare className="h-4 w-4" />
                  SMS Link
                </Button>
              </div>

              {/* Quick Redirect Button */}
              <div className="pt-2">
                <Button onClick={redirectToPaymentLinks} variant="default" className="w-full" disabled={redirecting}>
                  {redirecting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ExternalLink className="mr-2 h-4 w-4" />
                  )}
                  Go to My Payment Links
                </Button>
              </div>

              {/* Instructions */}
              <Alert>
                <AlertDescription>
                  <strong>Next Steps:</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• Share the link with your customer</li>
                    <li>• Customer completes payment on the secure page</li>
                    <li>• Order status updates automatically when paid</li>
                    <li>• Link expires in 24 hours</li>
                    <li>• View all your payment links in your account</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Benefits - Only show when no payment link */}
          {!paymentLink && (
            <Alert>
              <AlertDescription>
                <strong>Payment Link Benefits:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Perfect for remote sales and phone orders</li>
                  <li>• Secure PayWay payment processing</li>
                  <li>• Automatic order status updates</li>
                  <li>• Easy sharing via email or SMS</li>
                  <li>• Track all payment links in your account</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Payment Link Popup Dialog */}
      <Dialog open={showPopup} onOpenChange={setShowPopup}>
        <DialogContent className="max-w-4xl max-h-[90vh] w-[95vw]">
          <DialogHeader>
            <DialogTitle>Payment Link Preview</DialogTitle>
            <DialogDescription>This is how the payment page will look to your customer.</DialogDescription>
          </DialogHeader>
          <div className="w-full h-[70vh] border rounded-lg overflow-hidden bg-white">
            {paymentLink ? (
              <iframe
                src={paymentLink}
                className="w-full h-full border-0"
                title="Payment Link Preview"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation"
                loading="lazy"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No payment link available</p>
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={() => copyToClipboard(paymentLink || "")} variant="outline" className="flex-1">
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
            <Button onClick={openPaymentLink} variant="outline" className="flex-1 bg-transparent">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in New Tab
            </Button>
            <Button onClick={redirectToPaymentLinks} variant="default" className="flex-1">
              <ExternalLink className="h-4 w-4 mr-2" />
              Go to My Payment Links
            </Button>
            <Button onClick={() => setShowPopup(false)} variant="outline" className="flex-1">
              Close Preview
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
