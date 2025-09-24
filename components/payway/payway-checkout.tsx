/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, ExternalLink, CreditCard, ChevronRight, ArrowLeft, Smartphone, Monitor } from "lucide-react"
import Image from "next/image"

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
  const [paymentWindow, setPaymentWindow] = useState<Window | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isWaitingForPayment, setIsWaitingForPayment] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("aba-khqr")
  const [showPaymentInterface, setShowPaymentInterface] = useState(false)
  const [transactionId, setTransactionId] = useState<string | null>(null)

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
      ]

      if (!allowedOrigins.includes(event.origin)) {
        return
      }

      const { type, data } = event.data

      switch (type) {
        case "PAYMENT_SUCCESS":
          setIsWaitingForPayment(false)
          verifyPaymentStatus(data.tran_id || transactionId)
          if (paymentWindow) {
            paymentWindow.close()
            setPaymentWindow(null)
          }
          break
        case "PAYMENT_ERROR":
          setIsWaitingForPayment(false)
          onError?.(data.error || "Payment failed")
          if (paymentWindow) {
            paymentWindow.close()
            setPaymentWindow(null)
          }
          break
        case "PAYMENT_CANCELLED":
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
  }, [paymentWindow, onSuccess, onError, onCancel, transactionId, verifyPaymentStatus])

  useEffect(() => {
    const handlePaywayCallback = async (event: MessageEvent) => {
      if (event.data?.type === "PAYWAY_CALLBACK") {
        const { tran_id, status } = event.data.data

        if (status === "0") {
          // Payment successful - verify with Check Transaction API
          await verifyPaymentStatus(tran_id)
        } else {
          onError?.("Payment was not successful")
        }
      }
    }

    window.addEventListener("message", handlePaywayCallback)
    return () => window.removeEventListener("message", handlePaywayCallback)
  }, [onError, verifyPaymentStatus])

  useEffect(() => {
    if (!paymentWindow || !isWaitingForPayment) return

    const checkClosed = setInterval(() => {
      if (paymentWindow.closed) {
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
      const paymentMethodMap: Record<string, string> = {
        "aba-khqr": "abapay_khqr_deeplink", // This returns JSON with QR
        "aba-deeplink": "abapay_khqr_deeplink", // Same as above
        card: "cards", // This returns HTML form
        alipay: "alipay", // This returns HTML form
        wechat: "wechat", // This returns HTML form
        google_pay: "google_pay", // This returns HTML form
      }

      const apiPaymentMethod = paymentMethodMap[selectedPaymentMethod] || selectedPaymentMethod

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
          paymentMethod: selectedPaymentMethod, // Send original method for API mapping
          return_url: `${window.location.origin}/api/payway/callback`,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setTransactionId(result.tran_id)

        if (result.paymentType === "qr" && (result.qr_string || result.checkout_qr_url)) {
          if (result.checkout_qr_url) {
            const newWindow = window.open(
              result.checkout_qr_url,
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
          }
        } else if (result.paymentType === "hosted" && result.checkoutUrl) {
          const newWindow = window.open(
            result.checkoutUrl,
            "payway-checkout",
            "width=800,height=600,scrollbars=yes,resizable=yes,status=yes,location=yes,menubar=no,toolbar=no",
          )

          if (newWindow) {
            setPaymentWindow(newWindow)
            setIsWaitingForPayment(true)
            newWindow.focus()

            console.log("[v0] PayWay checkout opened via direct URL")
          } else {
            throw new Error("Popup blocked. Please allow popups for this site.")
          }
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

  const handlePaymentMethodDoubleClick = (method: string) => {
    setSelectedPaymentMethod(method)
    setShowPaymentInterface(true)
  }

  const handleBackToSelection = () => {
    setShowPaymentInterface(false)
    setError(null)
  }

  const getPaymentMethodDisplayName = (methodId: string) => {
    const method = availablePaymentMethods.find((m) => m.id === methodId)
    return method?.name || methodId
  }

  if (isWaitingForPayment) {
    return (
      <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="p-6 space-y-4 text-center">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#005E7B]" />
            <span className="text-[#4A4A4A]">Waiting for payment completion...</span>
          </div>
          <div className="p-4 bg-[#F8FFFE] rounded-lg border border-[#E0F2F1]">
            <p className="text-sm text-[#4A4A4A]">
              Please complete your payment in the PayWay window that opened. Don&apos;t close this page until payment is
              complete.
            </p>
            {transactionId && <p className="text-xs text-[#6B7280] mt-2">Transaction ID: {transactionId}</p>}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => paymentWindow?.focus()}
              className="flex-1 border-[#005E7B] text-[#005E7B] hover:bg-[#005E7B] hover:text-white"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Focus Payment Window
            </Button>
            <Button variant="outline" onClick={handleCancel} className="flex-1 bg-transparent">
              Cancel Payment
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (showPaymentInterface) {
    const selectedMethod = availablePaymentMethods.find((m) => m.id === selectedPaymentMethod)

    return (
      <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={handleBackToSelection} className="p-2 hover:bg-gray-100">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center space-x-3">
              <Image
                src={`/icons/${selectedMethod?.icon || selectedPaymentMethod}.svg`}
                alt={selectedMethod?.name || selectedPaymentMethod}
                width={32}
                height={32}
                className="rounded"
              />
              <div>
                <div className="font-medium text-[#1F2937]">{getPaymentMethodDisplayName(selectedPaymentMethod)}</div>
                <div className="text-sm text-[#6B7280]">
                  {currency} {amount.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg">
              <div className="font-medium mb-2">Payment Error</div>
              <div className="mb-3">{error}</div>
              <Button variant="outline" onClick={handleRetry} size="sm" className="w-full bg-transparent">
                Try Again
              </Button>
            </div>
          )}

          {(selectedPaymentMethod === "aba-khqr" || selectedPaymentMethod === "aba-deeplink") && (
            <div className="space-y-4">
              <div className="text-center p-8 bg-[#F8FFFE] rounded-lg border border-[#E0F2F1]">
                <div className="w-48 h-48 mx-auto bg-white rounded-lg border-2 border-dashed border-[#005E7B] flex items-center justify-center mb-4">
                  <div className="text-[#005E7B] text-sm text-center">
                    PayWay will generate
                    <br />
                    {selectedPaymentMethod === "aba-deeplink" ? "deeplink" : "QR code"} here
                  </div>
                </div>
                <p className="text-sm text-[#4A4A4A] mb-2">
                  {selectedPaymentMethod === "aba-deeplink"
                    ? "This will open directly in your ABA Mobile app"
                    : "Scan this QR code with your banking app"}
                </p>
                <p className="text-xs text-[#6B7280]">
                  {selectedPaymentMethod === "aba-deeplink"
                    ? "Make sure you have ABA Mobile app installed"
                    : "ABA Mobile, ACLEDA Mobile, or any KHQR compatible app"}
                </p>
              </div>
            </div>
          )}

          {selectedPaymentMethod === "card" && (
            <div className="space-y-4">
              <div className="p-4 bg-[#F8FFFE] rounded-lg border border-[#E0F2F1]">
                <p className="text-sm text-[#4A4A4A] text-center">PayWay will handle secure card processing</p>
              </div>
              <div className="flex items-center space-x-2 justify-center">
                <Image src="/icons/visa.svg" alt="Visa" width={32} height={20} className="rounded-sm" />
                <Image src="/icons/mastercard.svg" alt="Mastercard" width={32} height={20} className="rounded-sm" />
                <Image src="/icons/unionpay.svg" alt="UnionPay" width={32} height={20} className="rounded-sm" />
                <Image src="/icons/jcb.svg" alt="JCB" width={24} height={20} className="rounded-sm" />
              </div>
            </div>
          )}

          {selectedPaymentMethod === "google_pay" && (
            <div className="space-y-4">
              <div className="p-4 bg-[#F8FFFE] rounded-lg border border-[#E0F2F1]">
                <p className="text-sm text-[#4A4A4A] text-center">
                  {isAndroid ? "Pay quickly with Google Pay" : "Google Pay will handle the payment"}
                </p>
              </div>
              <div className="flex items-center justify-center">
                <Image src="/icons/google-pay.svg" alt="Google Pay" width={64} height={32} className="rounded-sm" />
              </div>
            </div>
          )}

          {(selectedPaymentMethod === "alipay" || selectedPaymentMethod === "wechat") && (
            <div className="space-y-4">
              <div className="text-center p-8 bg-[#F8FFFE] rounded-lg border border-[#E0F2F1]">
                <div className="w-48 h-48 mx-auto bg-white rounded-lg border-2 border-dashed border-[#005E7B] flex items-center justify-center mb-4">
                  <div className="text-[#005E7B] text-sm text-center">
                    PayWay will generate
                    <br />
                    QR code here
                  </div>
                </div>
                <p className="text-sm text-[#4A4A4A] mb-2">
                  Scan this QR code with your {selectedPaymentMethod === "alipay" ? "Alipay" : "WeChat"} app
                </p>
                <p className="text-xs text-[#6B7280]">
                  Open {selectedPaymentMethod === "alipay" ? "Alipay" : "WeChat Pay"} and scan to complete payment
                </p>
              </div>
            </div>
          )}

          <Button
            onClick={handlePaywayCheckout}
            disabled={isLoading}
            className="w-full bg-[#005E7B] hover:bg-[#004A63] text-white font-medium py-3 rounded-lg transition-colors shadow-sm"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating PayWay Transaction...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Pay with PayWay
              </>
            )}
          </Button>
        </div>
      </div>
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
            <span>Powered by PayWay eCommerce Checkout</span>
            {isMobile ? (
              <div className="flex items-center space-x-1">
                <Smartphone className="w-4 h-4" />
                <span>Mobile</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1">
                <Monitor className="w-4 h-4" />
                <span>Desktop</span>
              </div>
            )}
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
              }`}
              onClick={() => setSelectedPaymentMethod(method.id)}
              onDoubleClick={() => handlePaymentMethodDoubleClick(method.id)}
            >
              <div className="flex items-center space-x-4">
                <Image src={`/icons/${method.icon}.svg`} alt={method.name} width={40} height={40} className="rounded" />
                <div className="flex-1">
                  <div className="font-medium text-[#1F2937] text-base">{method.name}</div>
                  <div className="text-sm text-[#6B7280]">{method.description}</div>
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
              <ChevronRight className="w-5 h-5 text-[#9CA3AF]" />
            </div>
          ))}
        </div>

        <p className="text-xs text-[#6B7280] text-center leading-relaxed">
          Double-click on a payment method to proceed with payment.
        </p>
      </div>
    </div>
  )
}
