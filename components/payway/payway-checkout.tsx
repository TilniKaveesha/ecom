/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, ChevronRight, CreditCard } from "lucide-react"
import PayWayHtmlDebug from "./payway-html-debug"
import PayWayPopup from "./payway-popup"
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
  checkoutUrl?: string
  checkoutHtml?: string
  transactionId?: string
  onPaymentComplete?: (result: { tran_id?: string; status?: string }) => void
  onPaymentError?: (error: { error?: string; message?: string }) => void
  onSuccess?: (transactionRef: string) => void
  onError?: (error: string) => void
  onCancel?: () => void
  onClose?: () => void
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
  const [showAbaForm, setShowAbaForm] = useState(false)
  const [abaFormHtml, setAbaFormHtml] = useState<string | null>(null)
  const [abaFormBlobUrl, setAbaFormBlobUrl] = useState<string | null>(null)

  const { isMobile, isIOS, isAndroid } = useDeviceDetection()
  const availablePaymentMethods = getAvailablePaymentMethods(isMobile, isIOS, isAndroid)

  useEffect(() => {
    if (availablePaymentMethods.length > 0) {
      setSelectedPaymentMethod(availablePaymentMethods[0].id)
    }
  }, [isMobile, isAndroid])

  useEffect(() => {
    const loadAbaPaywayScript = () => {
      // Check if script is already loaded
      const existingScript = document.querySelector('script[src*="checkout2-0.js"]')
      if (existingScript) {
        console.log("[v0] ABA PayWay script already loaded, skipping")
        return
      }

      // Load ABA PayWay checkout script
      const script = document.createElement("script")
      script.src = "https://checkout.payway.com.kh/plugins/checkout2-0.js"
      script.async = true
      script.onload = () => {
        console.log("[v0] ABA PayWay script loaded successfully")
      }
      script.onerror = () => {
        console.error("[v0] Failed to load ABA PayWay script")
      }
      document.head.appendChild(script)
    }

    const loadJQuery = () => {
      // Check if jQuery is already loaded
      if (window.jQuery) {
        console.log("[v0] jQuery already available")
        loadAbaPaywayScript()
        return
      }

      const existingJQuery = document.querySelector('script[src*="jquery"]')
      if (existingJQuery) {
        console.log("[v0] jQuery script already loading")
        return
      }

      const jqueryScript = document.createElement("script")
      jqueryScript.src = "https://code.jquery.com/jquery-3.6.0.min.js"
      jqueryScript.async = true
      jqueryScript.onload = () => {
        console.log("[v0] jQuery loaded successfully")
        loadAbaPaywayScript()
      }
      jqueryScript.onerror = () => {
        console.error("[v0] Failed to load jQuery")
      }
      document.head.appendChild(jqueryScript)
    }

    loadJQuery()

    return () => {
      // Don't remove scripts during development hot reload to prevent re-loading issues
      if (process.env.NODE_ENV !== "development") {
        const scripts = document.querySelectorAll('script[src*="checkout2-0.js"], script[src*="jquery"]')
        scripts.forEach((script) => {
          if (script.parentNode) {
            script.parentNode.removeChild(script)
          }
        })
      }
    }
  }, [])

  useEffect(() => {
    return () => {
      if (abaFormBlobUrl) {
        URL.revokeObjectURL(abaFormBlobUrl)
      }
    }
  }, [abaFormBlobUrl])

  const handleAbaCheckout = useCallback(() => {
    if (typeof window !== "undefined" && window.AbaPayway && window.$) {
      console.log("[v0] Triggering ABA PayWay checkout")
      try {
        window.AbaPayway.checkout()
      } catch (error) {
        console.error("[v0] ABA PayWay checkout error:", error)
        onError?.("Failed to initialize ABA PayWay checkout")
      }
    } else {
      console.error("[v0] ABA PayWay or jQuery not loaded")
      onError?.("ABA PayWay checkout not available")
    }
  }, [onError])

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
        case "CHECKOUT_QR_URL":
          // Handle checkout_qr_url response for popup display
          console.log("[v0] Checkout QR URL received for popup display:", data.checkout_qr_url)
          setCheckoutUrl(data.checkout_qr_url)
          setShowAbaForm(false) // Close ABA form
          setShowPopup(true) // Show QR popup
          break
        case "PAYMENT_SUCCESS":
          console.log("[v0] Payment success message received")
          setShowPopup(false)
          setShowAbaForm(false)
          verifyPaymentStatus(data.tran_id || transactionId)
          break
        case "PAYMENT_ERROR":
          console.log("[v0] Payment error message received")
          setShowPopup(false)
          setShowAbaForm(false)
          onError?.(data.error || "Payment failed")
          break
        case "PAYMENT_CANCELLED":
          console.log("[v0] Payment cancelled message received")
          setShowPopup(false)
          setShowAbaForm(false)
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

    if (abaFormBlobUrl) {
      URL.revokeObjectURL(abaFormBlobUrl)
      setAbaFormBlobUrl(null)
    }

    try {
      const paymentMethodMap: Record<string, string> = {
        abapay_khqr: "abapay_khqr_deeplink", // Use deeplink to get JSON with checkout_qr_url
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
          paymentMethod: apiPaymentMethod,
          return_url: `${window.location.origin}/api/payway/callback`,
        }),
      })

      const result = await response.json()
      console.log("[v0] PayWay transaction creation result:", result)

      if (result.success) {
        setTransactionId(result.transaction_ref)

        if (result.response_type === "json" && (result.checkout_url || result.checkout_qr_url)) {
          console.log("[v0] Received JSON response with checkout_qr_url")
          setCheckoutUrl(result.checkout_qr_url || result.checkout_url)
          setCheckoutHtml(null)
          setShowPopup(true)
        } else if (result.response_type === "html" && result.checkout_html) {
          console.log("[v0] Received HTML response")

          if (result.checkout_qr_url && method === "abapay_khqr") {
            console.log("[v0] QR URL extracted from HTML, showing popup")
            setCheckoutUrl(result.checkout_qr_url)
            setCheckoutHtml(null)
            setShowPopup(true)
          } else {
            console.log("[v0] Showing HTML form in iframe")
            let processedHtml = result.checkout_html

            processedHtml = processedHtml.replace(/<form([^>]*)>/gi, '<form$1 target="aba_webservice">')

            const abaScript = `
              <script>
                if (typeof _aba_checkout_baseUrl === 'undefined') {
                  var script1 = document.createElement('script');
                  script1.src = 'https://checkout.payway.com.kh/plugins/checkout2-0.js';
                  script1.async = true;
                  script1.onload = function() {
                    console.log('[PayWay] ABA PayWay script loaded');
                  };
                  document.head.appendChild(script1);
                }
                
                if (typeof jQuery === 'undefined') {
                  var script2 = document.createElement('script');
                  script2.src = 'https://code.jquery.com/jquery-3.6.0.min.js';
                  script2.async = true;
                  script2.onload = function() {
                    console.log('[PayWay] jQuery loaded');
                  };
                  document.head.appendChild(script2);
                }
              </script>
              <script>
                function initializeAbaPayway() {
                  if (typeof jQuery !== 'undefined' && typeof AbaPayway !== 'undefined') {
                    console.log('[PayWay] Communication script loaded for transaction: ${result.transaction_ref}');
                    
                    $(document).ready(function(){
                      $('#checkout_button').click(function(){
                        $('#aba_merchant_request').append($(".payment_option:checked"));
                        AbaPayway.checkout();
                      });
                    });
                    
                    window.addEventListener('message', function(event) {
                      console.log('[ABA PayWay] Received message:', event.data);
                      
                      if (event.data && event.data.checkout_qr_url) {
                        console.log('[ABA PayWay] Checkout QR URL received:', event.data.checkout_qr_url);
                        
                        if (window.parent && window.parent !== window) {
                          window.parent.postMessage({
                            type: 'CHECKOUT_QR_URL',
                            data: { 
                              checkout_qr_url: event.data.checkout_qr_url,
                              transaction_id: '${result.transaction_ref}'
                            }
                          }, '*');
                        }
                      }
                      
                      if (event.data && (event.data.type === 'PAYMENT_SUCCESS' || event.data.status === 'success')) {
                        if (window.parent && window.parent !== window) {
                          window.parent.postMessage({
                            type: 'PAYMENT_SUCCESS',
                            data: event.data
                          }, '*');
                        }
                      }
                      
                      if (event.data && (event.data.type === 'PAYMENT_ERROR' || event.data.status === 'error')) {
                        if (window.parent && window.parent !== window) {
                          window.parent.postMessage({
                            type: 'PAYMENT_ERROR',
                            data: event.data
                          }, '*');
                        }
                      }
                    });
                    
                    if (typeof AbaPayway !== 'undefined') {
                      console.log('[ABA PayWay] ABA PayWay object available');
                    }
                  } else {
                    setTimeout(initializeAbaPayway, 500);
                  }
                }
                
                initializeAbaPayway();
              </script>
            `

            if (processedHtml.includes("</body>")) {
              processedHtml = processedHtml.replace("</body>", abaScript + "</body>")
            } else {
              processedHtml += abaScript
            }

            const blob = new Blob([processedHtml], { type: "text/html" })
            const blobUrl = URL.createObjectURL(blob)

            setAbaFormHtml(processedHtml)
            setAbaFormBlobUrl(blobUrl)
            setShowAbaForm(true)
          }
        } else {
          throw new Error("Invalid PayWay response format")
        }

        console.log("[v0] PayWay checkout created successfully")
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
    setShowAbaForm(false)
    setCheckoutUrl(null)
    setCheckoutHtml(null)
    setAbaFormHtml(null)
    if (abaFormBlobUrl) {
      URL.revokeObjectURL(abaFormBlobUrl)
      setAbaFormBlobUrl(null)
    }
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
        return (
          <div className="relative">
            <Image src="/icons/aba-bank.svg" alt="ABA Bank" width={32} height={32} />
          </div>
        )
      case "cards":
        return (
          <div className="relative">
            <Image src="/icons/cards.svg" alt="Cards" width={32} height={32} />
          </div>
        )
      case "alipay":
        return (
          <div className="relative">
            <Image src="/icons/alipay.svg" alt="Alipay" width={32} height={32} />
          </div>
        )
      case "wechat":
        return (
          <div className="relative">
            <Image src="/icons/wechat.svg" alt="WeChat" width={32} height={32} />
          </div>
        )
      default:
        return <CreditCard className="" />
    }
  }

  const isDebugMode = process.env.NODE_ENV === "development"

  if (showDebug && transactionId) {
    return <PayWayHtmlDebug transactionId={transactionId} onClose={() => setShowDebug(false)} />
  }

  if (showAbaForm && abaFormBlobUrl) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" id="aba_main_modal">
        <div className="bg-white rounded-lg shadow-xl relative w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b bg-gray-50 rounded-t-lg">
            <h2 className="text-lg font-semibold text-gray-800">ABA PayWay Checkout</h2>
            <button
              onClick={handleCancel}
              className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-200 transition-colors"
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className="overflow-auto max-h-[calc(90vh-80px)]">
            <iframe
              src={abaFormBlobUrl}
              className="w-full h-[600px] border-none"
              title="ABA PayWay Checkout"
              sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            />
          </div>
        </div>
      </div>
    )
  }

  if (showPopup && transactionId) {
    return (
      <PayWayPopup
        checkoutUrl={checkoutUrl || undefined}
        checkoutHtml={checkoutHtml || undefined}
        transactionId={transactionId}
        onPaymentComplete={(result: { tran_id?: string; status?: string }) => {
          console.log("[v0] Payment completed in popup:", result)
          setShowPopup(false)
          verifyPaymentStatus(result.tran_id || transactionId)
        }}
        onPaymentError={(error: { error?: string; message?: string }) => {
          console.log("[v0] Payment error in popup:", error)
          setShowPopup(false)
          onError?.(error.error || error.message || "Payment failed")
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
              <div className="flex items-center space-x-3">
                <div>{getPaymentMethodIcon(method.id)}</div>
                <div className="flex-1">
                  <div className="font-medium space-y-1 text-[#1F2937] text-base">{method.name}</div>
                  {method.id === "cards" ? (
                    <div className="flex gap-2 mt-1">
                      <Image src="/icons/visa.svg" alt="Icon 1" height={32} width={24} />
                      <Image src="/icons/mastercard.svg" alt="Icon 2" height={32} width={24} />
                      <Image src="/icons/unionpay.svg" alt="Icon 3" height={32} width={24} />
                      <Image src="/icons/jcb.svg" alt="Icon 4" height={32} width={24} />
                    </div>
                  ) : method.id === "abapay_khqr" ? (
                    <div className="text-sm space-y-1 text-[#6B7280]">
                      {isMobile ? "Scan with banking app" : "Scan QR code to pay"}
                    </div>
                  ) : (
                    <div className="text-sm items-center space-x-1 mt-1 text-[#6B7280]">{method.description}</div>
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
