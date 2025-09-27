/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, ChevronRight, CreditCard, Smartphone, QrCode } from "lucide-react"
import PayWayHtmlDebug from "./payway-html-debug"
import PayWayPopup from "./payway-popup"

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

const useDeviceDetection = () => {
  const [isMobile, setIsMobile] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase()
    const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
    const isIOSDevice = /iphone|ipad|ipod/i.test(userAgent)
    const isAndroidDevice = /android/i.test(userAgent)

    setIsMobile(isMobileDevice)
    setIsIOS(isIOSDevice)
    setIsAndroid(isAndroidDevice)
  }, [])

  return { isMobile, isIOS, isAndroid }
}

const getAvailablePaymentMethods = (isMobile: boolean, isIOS: boolean, isAndroid: boolean) => {
  const methods = [
    {
      id: "abapay_khqr",
      name: "ABA KHQR",
      description: isMobile ? "Scan with your banking app" : "Scan QR code to pay",
      icon: "aba-bank",
      deviceType: "all",
      priority: 1,
      category: "qr",
    },
    {
      id: "cards",
      name: "Credit/Debit Card",
      description: "Visa, Mastercard, UnionPay, JCB",
      icon: "cards",
      deviceType: "all",
      priority: 2,
      category: "card",
    },
    {
      id: "alipay",
      name: "Alipay",
      description: "Pay with Alipay",
      icon: "alipay",
      deviceType: "all",
      priority: 3,
      category: "ewallet",
    },
    {
      id: "wechat",
      name: "WeChat Pay",
      description: "Pay with WeChat",
      icon: "wechat",
      deviceType: "all",
      priority: 4,
      category: "ewallet",
    },
  ]

  // Filter methods based on device type
  const availableMethods = methods.filter((method) => {
    if (method.deviceType === "all") return true
    if (method.deviceType === "mobile" && isMobile) return true
    if (method.deviceType === "preferred") return true
    return false
  })

  // Sort by priority
  availableMethods.sort((a, b) => a.priority - b.priority)

  return availableMethods
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
  const [error, setError] = useState<string | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("abapay_khqr")
  const [showPaymentInterface, setShowPaymentInterface] = useState(false)
  const [transactionId, setTransactionId] = useState<string | null>(null)
  const [showPopup, setShowPopup] = useState(false)
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
  const [checkoutHtml, setCheckoutHtml] = useState<string | null>(null)
  const [paymentCompleted, setPaymentCompleted] = useState(false)
  const [showDebug, setShowDebug] = useState(false)

  const { isMobile, isIOS, isAndroid } = useDeviceDetection()
  const availablePaymentMethods = getAvailablePaymentMethods(isMobile, isIOS, isAndroid)

  useEffect(() => {
    if (availablePaymentMethods.length > 0) {
      setSelectedPaymentMethod(availablePaymentMethods[0].id)
    }
  }, [isMobile, isAndroid])

  const verifyPaymentStatus = useCallback(
    async (tranId: string) => {
      console.log("[v0] Verifying payment status for transaction:", tranId)
      try {
        const response = await fetch("/api/payway/verify-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            transactionId: tranId,
          }),
        })

        const result = await response.json()
        console.log("[v0] Payment verification result:", result)

        if (result.success && result.status === "PAID") {
          setPaymentCompleted(true)
          onSuccess?.(tranId)
        } else if (result.success && result.status === "PENDING") {
          console.log("[v0] Payment is still pending, this is normal")
          // Don't call onError for pending status
        } else {
          onError?.(result.error || "Payment verification failed")
        }
      } catch (error) {
        console.error("[v0] Payment verification error:", error)
        onError?.("Failed to verify payment status")
      }
    },
    [onSuccess, onError],
  )

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const allowedOrigins = [
        "https://checkout.payway.com.kh",
        "https://checkout-sandbox.payway.com.kh",
        "https://api-sandbox.payway.com.kh",
        "https://sandbox.payway.com.kh",
        window.location.origin, // Allow messages from our own domain
      ]

      if (!allowedOrigins.includes(event.origin)) {
        return
      }

      const { type, data } = event.data
      console.log("[v0] Received message from PayWay:", { type, data })

      switch (type) {
        case "PAYMENT_SUCCESS":
          console.log("[v0] Payment success message received")
          setShowPopup(false)
          verifyPaymentStatus(data.tran_id || transactionId)
          break
        case "PAYMENT_ERROR":
          console.log("[v0] Payment error message received")
          setShowPopup(false)
          onError?.(data.error || "Payment failed")
          break
        case "PAYMENT_CANCELLED":
          console.log("[v0] Payment cancelled message received")
          setShowPopup(false)
          onCancel?.()
          break
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [onSuccess, onError, onCancel, transactionId, verifyPaymentStatus])

  const handlePaymentMethodClick = async (method: string) => {
    setSelectedPaymentMethod(method)
    setIsLoading(true)
    setError(null)
    setPaymentCompleted(false)

    try {
      const paymentMethodMap: Record<string, string> = {
        abapay_khqr: "abapay_khqr", // ABA KHQR - returns JSON with QR
        cards: "cards", // Credit/Debit cards - returns HTML form
        alipay: "alipay", // Alipay - returns HTML form
        wechat: "wechat", // WeChat - returns HTML form
      }

      const apiPaymentMethod = paymentMethodMap[method] || method

      console.log("[v0] Creating PayWay transaction for method:", method, "->", apiPaymentMethod)
      const response = await fetch("/api/payway/create-transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          amount,
          currency,
          customerInfo,
          paymentMethod: apiPaymentMethod, // Use mapped method
          return_url: `${window.location.origin}/api/payway/callback`,
        }),
      })

      const result = await response.json()
      console.log("[v0] PayWay transaction creation result:", result)

      if (result.success) {
        setTransactionId(result.transaction_ref)

        if (result.response_type === "json" && result.checkout_url) {
          // QR-based payments (ABA KHQR)
          setCheckoutUrl(result.checkout_url)
          setCheckoutHtml(null)
          setShowPopup(true)
        } else if (result.response_type === "html" && result.checkout_html) {
          // HTML form-based payments (cards, alipay, wechat)
          setCheckoutHtml(result.checkout_html)
          setCheckoutUrl(null)
          setShowPopup(true)
        } else {
          throw new Error("Invalid PayWay response format")
        }

        console.log("[v0] PayWay checkout created successfully, opening popup")
      } else {
        const errorMessage = result.error || "Failed to create PayWay transaction"
        const errorCode = result.code ? ` (Code: ${result.code})` : ""
        throw new Error(errorMessage + errorCode)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred"
      console.error("[v0] PayWay transaction creation error:", errorMessage)
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setShowPopup(false)
    setCheckoutUrl(null)
    setCheckoutHtml(null)
    setError(null)
    setPaymentCompleted(false)
    onCancel?.()
  }

  const handleRetry = () => {
    setError(null)
    setPaymentCompleted(false)
    handlePaymentMethodClick(selectedPaymentMethod)
  }

  const getPaymentMethodDisplayName = (methodId: string) => {
    const method = availablePaymentMethods.find((m) => m.id === methodId)
    return method?.name || methodId
  }

  const getPaymentMethodIcon = (methodId: string) => {
    switch (methodId) {
      case "abapay_khqr":
        return <QrCode className="w-6 h-6 text-blue-600" />
      case "cards":
        return <CreditCard className="w-6 h-6 text-gray-600" />
      case "alipay":
        return <Smartphone className="w-6 h-6 text-blue-500" />
      case "wechat":
        return <Smartphone className="w-6 h-6 text-green-500" />
      default:
        return <CreditCard className="w-6 h-6 text-gray-600" />
    }
  }

  const isDebugMode = process.env.NODE_ENV === "development"

  if (showDebug && transactionId) {
    return <PayWayHtmlDebug transactionId={transactionId} onClose={() => setShowDebug(false)} />
  }

  if (showPopup && transactionId) {
    return (
      <PayWayPopup
        checkoutUrl={checkoutUrl || undefined}
        checkoutHtml={checkoutHtml || undefined}
        transactionId={transactionId}
        onPaymentComplete={(result) => {
          console.log("[v0] Payment completed in popup:", result)
          setShowPopup(false)
          verifyPaymentStatus(result.tran_id || transactionId)
        }}
        onPaymentError={(error) => {
          console.log("[v0] Payment error in popup:", error)
          setShowPopup(false)
          onError?.(error.error || "Payment failed")
        }}
        onClose={() => {
          console.log("[v0] PayWay popup closed")
          setShowPopup(false)
          onCancel?.()
        }}
      />
    )
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="p-6 space-y-4">
        {isDebugMode && transactionId && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm font-medium text-yellow-800">Debug Mode</div>
                <div className="text-xs text-yellow-600">Transaction ID: {transactionId}</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDebug(true)}
                className="text-yellow-700 border-yellow-300"
              >
                Debug HTML
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg">
            <div className="font-medium mb-2">Payment Error</div>
            <div className="mb-3">{error}</div>
            <Button variant="outline" onClick={handleRetry} size="sm" className="w-full bg-transparent">
              Try Again
            </Button>
          </div>
        )}

        {paymentCompleted && (
          <div className="p-4 text-sm text-green-800 bg-green-50 border border-green-200 rounded-lg">
            <div className="font-medium mb-2">Payment Successful!</div>
            <div>Your payment has been processed successfully.</div>
          </div>
        )}

        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-[#1F2937] mb-2">Choose Payment Method</h3>
          <div className="flex items-center justify-center space-x-2 text-sm text-[#6B7280]">
            <span>Secure payment powered by PayWay Cambodia</span>
          </div>
        </div>

        <div className="space-y-2">
          {availablePaymentMethods.map((method) => (
            <div
              key={method.id}
              className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedPaymentMethod === method.id
                  ? "border-[#005E7B] bg-[#F8FFFE]"
                  : "border-[#E5E7EB] hover:border-[#D1D5DB] bg-white"
              } ${isLoading || paymentCompleted ? "opacity-50 pointer-events-none" : ""}`}
              onClick={() => handlePaymentMethodClick(method.id)}
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-50">
                  {getPaymentMethodIcon(method.id)}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-[#1F2937] text-base">{method.name}</div>
                  {method.id === "cards" ? (
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-sm text-[#6B7280]">Visa, Mastercard, UnionPay, JCB</span>
                    </div>
                  ) : method.id === "abapay_khqr" ? (
                    <div className="text-sm text-[#6B7280]">
                      {isMobile ? "Scan with banking app" : "Scan QR code to pay"}
                    </div>
                  ) : (
                    <div className="text-sm text-[#6B7280]">{method.description}</div>
                  )}

                  {method.category === "qr" && (
                    <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 mt-1">
                      QR Payment
                    </div>
                  )}
                  {method.category === "card" && (
                    <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 mt-1">
                      Card Payment
                    </div>
                  )}
                  {method.category === "ewallet" && (
                    <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800 mt-1">
                      E-Wallet
                    </div>
                  )}
                </div>
              </div>
              {isLoading && selectedPaymentMethod === method.id ? (
                <Loader2 className="w-5 h-5 text-[#005E7B] animate-spin" />
              ) : (
                <ChevronRight className="w-5 h-5 text-[#9CA3AF]" />
              )}
            </div>
          ))}
        </div>

        <p className="text-xs text-[#6B7280] text-center leading-relaxed">
          Click on a payment method to open PayWay checkout. Complete your payment in the secure window that opens.
        </p>
      </div>
    </div>
  )
}
