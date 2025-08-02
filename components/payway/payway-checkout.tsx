"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ExternalLink, CreditCard } from "lucide-react"

interface PaywayCheckoutProps {
  orderId: string
  amount: number
  currency?: string
  customerInfo: {
    name: string
    email: string
    phone: string
  }
  onSuccess?: (transactionRef: string) => void
  onError?: (error: string) => void
  onCancel?: () => void
}

export default function PayWayCheckout({
  orderId,
  amount,
  currency = "USD",
  customerInfo,
  onSuccess,
  onError,
  onCancel,
}: PaywayCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [paymentWindow, setPaymentWindow] = useState<Window | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isWaitingForPayment, setIsWaitingForPayment] = useState(false)

  // Listen for payment completion messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify origin for security - accept both sandbox and production
      const allowedOrigins = [
        "https://checkout.payway.com.kh",
        "https://checkout-sandbox.payway.com.kh",
        "https://api-sandbox.payway.com.kh",
        "https://sandbox.payway.com.kh",
      ]

      if (!allowedOrigins.includes(event.origin)) {
        console.log("Ignoring message from unknown origin:", event.origin)
        return
      }

      const { type, data } = event.data

      switch (type) {
        case "PAYMENT_SUCCESS":
          console.log("Payment successful:", data)
          setIsWaitingForPayment(false)
          onSuccess?.(data.transactionRef || data.tran_id)
          if (paymentWindow) {
            paymentWindow.close()
            setPaymentWindow(null)
          }
          break
        case "PAYMENT_ERROR":
          console.log("Payment error:", data)
          setIsWaitingForPayment(false)
          onError?.(data.error || "Payment failed")
          if (paymentWindow) {
            paymentWindow.close()
            setPaymentWindow(null)
          }
          break
        case "PAYMENT_CANCELLED":
          console.log("Payment cancelled:", data)
          setIsWaitingForPayment(false)
          onCancel?.()
          if (paymentWindow) {
            paymentWindow.close()
            setPaymentWindow(null)
          }
          break
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [paymentWindow, onSuccess, onError, onCancel])

  // Check if payment window is closed manually
  useEffect(() => {
    if (!paymentWindow || !isWaitingForPayment) return

    const checkClosed = setInterval(() => {
      if (paymentWindow.closed) {
        console.log("Payment window was closed manually")
        setIsWaitingForPayment(false)
        setPaymentWindow(null)
        onCancel?.()
        clearInterval(checkClosed)
      }
    }, 1000)

    return () => clearInterval(checkClosed)
  }, [paymentWindow, isWaitingForPayment, onCancel])

  const handlePaywayCheckout = async () => {
    setIsLoading(true)
    setError(null)

    try {
      console.log("Initiating PayWay checkout...")

      const response = await fetch("/api/payway/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          amount,
          currency,
          customerInfo,
        }),
      })

      const result = await response.json()
      console.log("PayWay checkout response:", result)

      if (result.success) {
        if (result.checkoutUrl) {
          // Direct URL redirect
          console.log("Redirecting to PayWay checkout URL")
          const newWindow = window.open(
            result.checkoutUrl,
            "payway-checkout",
            "width=800,height=600,scrollbars=yes,resizable=yes,status=yes,location=yes,menubar=no,toolbar=no",
          )

          if (newWindow) {
            setPaymentWindow(newWindow)
            setIsWaitingForPayment(true)
            newWindow.focus()
          } else {
            throw new Error("Popup blocked. Please allow popups for this site.")
          }
        } else if (result.checkoutHtml) {
          // HTML checkout form
          console.log("Opening PayWay checkout HTML form")
          const blob = new Blob([result.checkoutHtml], { type: "text/html" })
          const blobUrl = URL.createObjectURL(blob)

          const newWindow = window.open(
            blobUrl,
            "payway-checkout",
            "width=800,height=600,scrollbars=yes,resizable=yes,status=yes,location=yes,menubar=no,toolbar=no",
          )

          if (newWindow) {
            setPaymentWindow(newWindow)
            setIsWaitingForPayment(true)
            newWindow.focus()

            // Clean up blob URL after a delay
            setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
          } else {
            throw new Error("Popup blocked. Please allow popups for this site.")
          }
        } else {
          throw new Error("No checkout HTML or URL received from PayWay")
        }
      } else {
        throw new Error(result.error || "Failed to create PayWay checkout")
      }
    } catch (err) {
      console.error("PayWay checkout error:", err)
      const errorMessage = err instanceof Error ? err.message : "An error occurred"
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    if (paymentWindow) {
      paymentWindow.close()
      setPaymentWindow(null)
    }
    setIsWaitingForPayment(false)
    setError(null)
    onCancel?.()
  }

  const handleRetry = () => {
    setError(null)
    handlePaywayCheckout()
  }

  if (isWaitingForPayment) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            PayWay Payment
          </CardTitle>
          <CardDescription>Complete your payment in the PayWay window</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Waiting for payment completion...</span>
          </div>
          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Please complete your payment in the PayWay window that opened. Don&apos;t close this page until payment is
              complete.
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => paymentWindow?.focus()} className="flex-1">
              <ExternalLink className="w-4 h-4 mr-2" />
              Focus Payment Window
            </Button>
            <Button variant="outline" onClick={handleCancel} className="flex-1">
              Cancel Payment
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          PayWay Payment
        </CardTitle>
        <CardDescription>
          Pay securely with PayWay - Amount: {currency} {amount.toFixed(2)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-4 text-sm text-red-800 bg-red-100 border border-red-200 rounded-md dark:bg-red-950 dark:text-red-200 dark:border-red-800">
            <div className="font-medium mb-2">Payment Error</div>
            <div className="mb-3">{error}</div>
            <Button variant="outline" onClick={handleRetry} size="sm" className="w-full">
              Try Again
            </Button>
          </div>
        )}

        <div className="space-y-3">
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Payment Details:</div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Order ID:</span>
                <span className="font-mono">{orderId}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount:</span>
                <span className="font-semibold">
                  {currency} {amount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Customer:</span>
                <span>{customerInfo.name}</span>
              </div>
            </div>
          </div>

          <Button onClick={handlePaywayCheckout} disabled={isLoading} className="w-full" size="lg">
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating PayWay Checkout...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Pay with PayWay
              </>
            )}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            Payment will open in a new window. Please ensure popups are enabled for the best experience.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
