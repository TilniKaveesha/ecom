"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Shield, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PayWayCheckoutProps {
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
}: PayWayCheckoutProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle")
  const { toast } = useToast()
  const [checkoutHtml, setCheckoutHtml] = useState<string>("")

  const handlePayWayCheckout = async () => {
    setIsProcessing(true)
    setPaymentStatus("processing")

    try {
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

      const data = await response.json()

      if (data.success) {
        onSuccess?.(data.transactionRef)
        setCheckoutHtml(data.checkoutHtml)
        setPaymentStatus("success")
      } else {
        throw new Error(data.error || "Failed to create checkout session")
      }
    } catch (error) {
      console.error("PayWay checkout error:", error)
      setPaymentStatus("error")
      const errorMessage = error instanceof Error ? error.message : "Payment processing failed"

      toast({
        title: "Payment Error",
        description: errorMessage,
        variant: "destructive",
      })

      onError?.(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case "processing":
        return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-600" />
      default:
        return <CreditCard className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusText = () => {
    switch (paymentStatus) {
      case "processing":
        return "Processing payment..."
      case "success":
        return "Payment successful!"
      case "error":
        return "Payment failed"
      default:
        return "Ready to pay"
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          PayWay Cambodia
        </CardTitle>
        <CardDescription>Secure payment processing for Cambodia</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Payment Summary */}
        <div className="p-4 bg-gray-50 rounded-lg space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Order ID:</span>
            <span className="text-sm font-mono">{orderId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Amount:</span>
            <span className="text-sm font-semibold">
              {currency} ${amount.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Customer:</span>
            <span className="text-sm">{customerInfo.name}</span>
          </div>
        </div>

        {/* Payment Status */}
        <div className="flex items-center justify-center p-3 rounded-lg bg-blue-50">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">{getStatusIcon()}</div>
            <p className="text-sm font-medium text-blue-900">{getStatusText()}</p>
          </div>
        </div>

        {/* Supported Payment Methods */}
        <div className="space-y-2">
          <p className="text-xs text-gray-600 text-center">Supported payment methods:</p>
          <div className="flex justify-center space-x-2">
            <Badge variant="outline" className="text-xs">
              Visa
            </Badge>
            <Badge variant="outline" className="text-xs">
              Mastercard
            </Badge>
            <Badge variant="outline" className="text-xs">
              ABA Bank
            </Badge>
            <Badge variant="outline" className="text-xs">
              ACLEDA
            </Badge>
          </div>
        </div>

        {/* Security Notice */}
        <div className="flex items-center justify-center p-2 bg-green-50 rounded-lg">
          <Shield className="h-4 w-4 text-green-600 mr-2" />
          <span className="text-xs text-green-800">256-bit SSL encryption</span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button
            onClick={handlePayWayCheckout}
            disabled={isProcessing || paymentStatus === "success"}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Pay ${amount.toFixed(2)} with PayWay
              </>
            )}
          </Button>

          {paymentStatus === "error" && (
            <Button onClick={onCancel} variant="outline" className="w-full">
              Cancel Payment
            </Button>
          )}
        </div>

        {/* Terms */}
        <p className="text-xs text-gray-500 text-center">
          By proceeding, you agree to PayWay Cambodia&apos;s terms of service and privacy policy.
        </p>
      </CardContent>
      {/* PayWay Checkout HTML */}
      {checkoutHtml && (
        <div className="mt-4">
          <iframe
            srcDoc={checkoutHtml}
            className="w-full h-96 border rounded-lg"
            title="PayWay Checkout"
            sandbox="allow-scripts allow-forms allow-same-origin allow-top-navigation"
          />
        </div>
      )}
    </Card>
  )
}
