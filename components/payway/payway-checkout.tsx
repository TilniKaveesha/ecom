/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, ChevronRight, Smartphone, Monitor } from "lucide-react"
import Image from "next/image"
import PayWayIframe from "./payway-iframe"

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
      id: "aba-khqr",
      name: "ABA KHQR",
      description: isMobile ? "Scan with your banking app" : "Scan QR code to pay",
      icon: "aba-bank",
      deviceType: "all",
      priority: 1,
    },
    {
      id: "aba-deeplink",
      name: "ABA Pay",
      description: "Open directly in ABA Mobile app",
      icon: "aba-bank",
      deviceType: "mobile",
      priority: 2,
    },
    {
      id: "card",
      name: "Credit/Debit Card",
      description: "Visa, Mastercard, UnionPay, JCB",
      icon: "cards",
      deviceType: "all",
      priority: 3,
    },
    {
      id: "google_pay",
      name: "Google Pay",
      description: "Pay with Google Pay",
      icon: "google-pay",
      deviceType: isAndroid ? "preferred" : "mobile",
      priority: isAndroid ? 1 : 4,
    },
    {
      id: "alipay",
      name: "Alipay",
      description: "Scan to pay with Alipay",
      icon: "alipay",
      deviceType: "all",
      priority: 5,
    },
    {
      id: "wechat",
      name: "WeChat Pay",
      description: "Scan to pay with WeChat",
      icon: "wechat",
      deviceType: "all",
      priority: 6,
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
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("aba-khqr")
  const [showPaymentInterface, setShowPaymentInterface] = useState(false)
  const [transactionId, setTransactionId] = useState<string | null>(null)
  const [showIframe, setShowIframe] = useState(false)
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)

  const { isMobile, isIOS, isAndroid } = useDeviceDetection()
  const availablePaymentMethods = getAvailablePaymentMethods(isMobile, isIOS, isAndroid)

  useEffect(() => {
    if (availablePaymentMethods.length > 0) {
      setSelectedPaymentMethod(availablePaymentMethods[0].id)
    }
  }, [isMobile, isAndroid])

  const verifyPaymentStatus = useCallback(
    async (tranId: string) => {
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

        if (result.success && result.status === "PAID") {
          onSuccess?.(tranId)
        } else {
          onError?.("Payment verification failed")
        }
      } catch {
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

      switch (type) {
        case "PAYMENT_SUCCESS":
          setShowIframe(false)
          verifyPaymentStatus(data.tran_id || transactionId)
          break
        case "PAYMENT_ERROR":
          setShowIframe(false)
          onError?.(data.error || "Payment failed")
          break
        case "PAYMENT_CANCELLED":
          setShowIframe(false)
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

    try {
      const paymentMethodMap: Record<string, string> = {
        "aba-khqr": "abapay_khqr_deeplink", // This returns JSON with QR
        "aba-deeplink": "abapay_khqr_deeplink", // Same as above
        card: "cards", // This returns HTML form
        alipay: "alipay", // This returns HTML form
        wechat: "wechat", // This returns HTML form
        google_pay: "google_pay", // This returns HTML form
      }

      const apiPaymentMethod = paymentMethodMap[method] || method

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
          paymentMethod: method, // Send original method for API mapping
          return_url: `${window.location.origin}/api/payway/callback`,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setTransactionId(result.tran_id)

        if (result.paymentType === "qr" && result.checkout_qr_url) {
          setCheckoutUrl(result.checkout_qr_url)
          setShowIframe(true)
        } else if (result.paymentType === "hosted" && result.checkoutUrl) {
          setCheckoutUrl(result.checkoutUrl)
          setShowIframe(true)
        } else {
          throw new Error("Invalid PayWay response format")
        }
      } else {
        const errorMessage = result.error || "Failed to create PayWay transaction"
        const errorCode = result.code ? ` (Code: ${result.code})` : ""
        throw new Error(errorMessage + errorCode)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred"
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setShowIframe(false)
    setCheckoutUrl(null)
    setError(null)
    onCancel?.()
  }

  const handleRetry = () => {
    setError(null)
    handlePaymentMethodClick(selectedPaymentMethod)
  }

  const getPaymentMethodDisplayName = (methodId: string) => {
    const method = availablePaymentMethods.find((m) => m.id === methodId)
    return method?.name || methodId
  }

  if (showIframe && checkoutUrl) {
    return (
      <PayWayIframe
        checkoutUrl={checkoutUrl}
        onPaymentComplete={(result) => {
          setShowIframe(false)
          verifyPaymentStatus(result.tran_id || transactionId)
        }}
        onPaymentError={(error) => {
          setShowIframe(false)
          onError?.(error.error || "Payment failed")
        }}
        onClose={() => {
          setShowIframe(false)
          onCancel?.()
        }}
      />
    )
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="p-6 space-y-4">
        {error && (
          <div className="p-4 text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg">
            <div className="font-medium mb-2">Payment Error</div>
            <div className="mb-3">{error}</div>
            <Button variant="outline" onClick={handleRetry} size="sm" className="w-full bg-transparent">
              Try Again
            </Button>
          </div>
        )}

        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-[#1F2937] mb-2">Choose Payment Method</h3>
          <div className="flex items-center justify-center space-x-2 text-sm text-[#6B7280]">
            
            {/*isMobile ? (
              <div className="flex items-center space-x-1">
                <Smartphone className="w-4 h-4" />
                <span>Mobile</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1">
                <Monitor className="w-4 h-4" />
                <span>Desktop</span>
              </div>
            )*/}
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
              } ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
              onClick={() => handlePaymentMethodClick(method.id)}
            >
              <div className="flex items-center space-x-4">
                <Image src={`/icons/${method.icon}.svg`} alt={method.name} width={40} height={40} className="rounded" />
                <div className="flex-1">
                  <div className="font-medium text-[#1F2937] text-base">{method.name}</div>
                  {/* Show description normally, but replace with card icons if method is "card" */}
    {method.id === "card" ? (
      <div className="flex items-center space-x-2 mt-1">
        <Image src="/icons/visa.svg" alt="Visa" width={32} height={20} className="rounded-sm" />
        <Image src="/icons/mastercard.svg" alt="Mastercard" width={32} height={20} className="rounded-sm" />
        <Image src="/icons/unionpay.svg" alt="UnionPay" width={32} height={20} className="rounded-sm" />
        <Image src="/icons/jcb.svg" alt="JCB" width={24} height={20} className="rounded-sm" />
      </div>
    ) : (
      <div className="text-sm text-[#6B7280]">{method.description}</div>
    )}

                  {method.deviceType === "preferred" && isAndroid && (
                    <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 mt-1">
                      Recommended for Android
                    </div>
                  )}
                  {method.id === "aba-deeplink" && (
                    <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 mt-1">
                      Mobile Only
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
          Click on a payment method to open PayWay checkout directly.
        </p>
      </div>
    </div>
  )
}
