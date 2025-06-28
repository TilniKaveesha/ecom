"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { CreditCard, ExternalLink, Copy, CheckCircle, AlertCircle, Loader2, ArrowRight, Clock } from "lucide-react"

interface PaymentLinkOptionProps {
  orderId: string
  orderAmount: number
  orderCurrency: string
  customerEmail?: string
  customerName?: string
}

interface PaymentLinkResponse {
  success: boolean
  payment_link_id?: string
  payment_link_url?: string
  title?: string
  amount?: number
  currency?: string
  status?: string
  error?: string
  message?: string
}

export default function PaymentLinkOption({
  orderId,
  orderAmount,
  orderCurrency,
  customerEmail,
  customerName,
}: PaymentLinkOptionProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [isGettingExisting, setIsGettingExisting] = useState(false)
  const [paymentLink, setPaymentLink] = useState<string | null>(null)
  const [paymentLinkId, setPaymentLinkId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Auto-redirect after successful payment link creation
  const handleSuccessRedirect = useCallback(() => {
    setIsRedirecting(true)

    toast({
      title: "Redirecting...",
      description: "Taking you to your payment links dashboard",
      duration: 2000,
    })

    setTimeout(() => {
      router.push("/account/payment-links")
    }, 2000)
  }, [router, toast])

  // Manual redirect function
  const redirectToPaymentLinks = useCallback(() => {
    setIsRedirecting(true)
    router.push("/account/payment-links")
  }, [router])

  const createPaymentLink = useCallback(async () => {
    setIsCreating(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("orderId", orderId)
      formData.append("title", `Payment for Order #${orderId}`)
      formData.append("amount", orderAmount.toString())
      formData.append("currency", orderCurrency)
      formData.append("description", `Payment link for order ${orderId}`)
      formData.append("paymentLimit", "1")

      // Set expiration to 24 hours from now
      const expirationDate = new Date()
      expirationDate.setHours(expirationDate.getHours() + 24)
      formData.append("expiredDate", expirationDate.toISOString())

      formData.append("returnUrl", `${window.location.origin}/api/payway/payment-link/webhook`)
      formData.append("merchantRefNo", `order_${orderId}_${Date.now()}`)

      if (customerEmail) {
        formData.append("customerEmail", customerEmail)
      }
      if (customerName) {
        formData.append("customerName", customerName)
      }

      console.log("🔥 Creating PayWay payment link for order:", orderId)

      const response = await fetch("/api/payway/payment-link/create", {
        method: "POST",
        body: formData,
      })

      const result: PaymentLinkResponse = await response.json()
      console.log("🔥 PayWay payment link response:", result)

      if (result.success && result.payment_link_url && result.payment_link_id) {
        const normalizedLink = result.payment_link_url.startsWith("http")
          ? result.payment_link_url
          : `https://${result.payment_link_url}`

        setPaymentLink(normalizedLink)
        setPaymentLinkId(result.payment_link_id)
        setShowDialog(true)

        toast({
          title: "Payment Link Created!",
          description: "Your PayWay payment link has been generated successfully.",
          duration: 5000,
        })

        // Auto-redirect after 2 seconds
        setTimeout(() => {
          handleSuccessRedirect()
        }, 2000)
      } else {
        const errorMessage = result.error || result.message || "Failed to create payment link"
        setError(errorMessage)
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
          duration: 5000,
        })
      }
    } catch (error) {
      console.error("🔥 Error creating payment link:", error)
      const errorMessage = error instanceof Error ? error.message : "Network error occurred"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsCreating(false)
    }
  }, [orderId, orderAmount, orderCurrency, customerEmail, customerName, toast, handleSuccessRedirect])

  const getExistingPaymentLink = useCallback(async () => {
    setIsGettingExisting(true)
    setError(null)

    try {
      const response = await fetch(`/api/payway/payment-link/status?orderId=${orderId}`)
      const result = await response.json()

      if (result.success && result.paymentLink) {
        const normalizedLink = result.paymentLink.startsWith("http")
          ? result.paymentLink
          : `https://${result.paymentLink}`

        setPaymentLink(normalizedLink)
        setPaymentLinkId(result.paymentLinkId)
        setShowDialog(true)

        toast({
          title: "Payment Link Found!",
          description: "Retrieved your existing PayWay payment link.",
          duration: 3000,
        })
      } else {
        toast({
          title: "No Payment Link Found",
          description: "No existing payment link found for this order. Please create a new one.",
          variant: "destructive",
          duration: 3000,
        })
      }
    } catch (error) {
      console.error("Error getting existing payment link:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to retrieve payment link"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setIsGettingExisting(false)
    }
  }, [orderId, toast])

  const copyToClipboard = useCallback(
    async (text: string, type: string) => {
      try {
        await navigator.clipboard.writeText(text)
        toast({
          title: "Copied!",
          description: `${type} copied to clipboard`,
          duration: 2000,
        })
      } catch (error) {
        console.error("Failed to copy to clipboard:", error)
        toast({
          title: "Copy Failed",
          description: "Failed to copy to clipboard",
          variant: "destructive",
          duration: 2000,
        })
      }
    },
    [toast],
  )

  const openPaymentLink = useCallback(() => {
    if (paymentLink) {
      window.open(paymentLink, "_blank", "noopener,noreferrer")
    }
  }, [paymentLink])

  return (
    <>
      <Card className="w-full">
        <CardHeader className="space-y-1">
          <div className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">PayWay Payment Link</CardTitle>
          </div>
          <CardDescription>Generate a secure payment link for this order using PayWay</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Order Information */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Order ID:</span>
              <Badge variant="outline">{orderId}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Amount:</span>
              <span className="font-semibold">
                {orderCurrency === "USD" ? "$" : orderCurrency === "KHR" ? "៛" : ""}
                {orderAmount.toFixed(2)} {orderCurrency}
              </span>
            </div>
            {customerEmail && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Customer:</span>
                <span className="text-sm">{customerName || customerEmail}</span>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={createPaymentLink} disabled={isCreating || isRedirecting} className="flex-1">
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Link...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Create New Link
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={getExistingPaymentLink}
              disabled={isGettingExisting || isRedirecting}
              className="flex-1 bg-transparent"
            >
              {isGettingExisting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Get Existing Link
                </>
              )}
            </Button>
          </div>

          {/* Redirect Notice */}
          {isRedirecting && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Redirecting to your payment links dashboard...
              </AlertDescription>
            </Alert>
          )}

          {/* Payment Link Display */}
          {paymentLink && !showDialog && (
            <div className="space-y-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800 dark:text-green-200">
                  Payment Link Created Successfully!
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Payment Link:</span>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(paymentLink, "Payment link")}>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                    <Button size="sm" onClick={openPaymentLink}>
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Open
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground break-all bg-white dark:bg-gray-900 p-2 rounded border">
                  {paymentLink}
                </div>
              </div>

              {paymentLinkId && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Payment Link ID:</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(paymentLinkId, "Payment link ID")}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy ID
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground break-all bg-white dark:bg-gray-900 p-2 rounded border">
                    {paymentLinkId}
                  </div>
                </div>
              )}

              <Separator />

              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={redirectToPaymentLinks} disabled={isRedirecting} className="flex-1">
                  {isRedirecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Redirecting...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Go to My Payment Links
                    </>
                  )}
                </Button>
              </div>

              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  You will be automatically redirected to your{" "}
                  <button
                    onClick={redirectToPaymentLinks}
                    className="underline hover:no-underline font-medium"
                    disabled={isRedirecting}
                  >
                    payment links dashboard
                  </button>{" "}
                  in a few seconds.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Link Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Payment Link Ready!</span>
            </DialogTitle>
            <DialogDescription>Your PayWay payment link has been generated successfully.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {paymentLink && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Link:</label>
                <div className="flex space-x-2">
                  <div className="flex-1 text-xs bg-muted p-2 rounded border break-all">{paymentLink}</div>
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(paymentLink, "Payment link")}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            {paymentLinkId && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Link ID:</label>
                <div className="flex space-x-2">
                  <div className="flex-1 text-xs bg-muted p-2 rounded border break-all">{paymentLinkId}</div>
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(paymentLinkId, "Payment link ID")}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            <div className="flex flex-col space-y-2">
              <Button onClick={openPaymentLink} className="w-full">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Payment Link
              </Button>

              <Button
                variant="outline"
                onClick={redirectToPaymentLinks}
                disabled={isRedirecting}
                className="w-full bg-transparent"
              >
                {isRedirecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redirecting...
                  </>
                ) : (
                  <>
                    <ArrowRight className="mr-2 h-4 w-4" />
                    View All My Payment Links
                  </>
                )}
              </Button>
            </div>

            {isRedirecting && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Redirecting to your payment links dashboard...
                </AlertDescription>
              </Alert>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
