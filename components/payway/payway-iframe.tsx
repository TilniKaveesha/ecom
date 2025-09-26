/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useRef, useState } from "react"

interface PayWayIframeProps {
  checkoutUrl: string
  onPaymentComplete?: (result: any) => void
  onPaymentError?: (error: any) => void
  onClose?: () => void
}

export default function PayWayIframe({ checkoutUrl, onPaymentComplete, onPaymentError, onClose }: PayWayIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Accept messages from PayWay domains and our own domain
      const allowedOrigins = [
        "https://checkout-sandbox.payway.com.kh",
        "https://checkout.payway.com.kh",
        window.location.origin,
      ]

      if (!allowedOrigins.includes(event.origin)) {
        return
      }

      console.log("[PayWay] Received message:", event.data)

      if (event.data?.type === "PAYMENT_SUCCESS") {
        setIsLoading(false)
        onPaymentComplete?.(event.data.data)
      } else if (event.data?.type === "PAYMENT_ERROR") {
        setIsLoading(false)
        setError(event.data.data?.error || "Payment failed")
        onPaymentError?.(event.data.data)
      } else if (event.data?.type === "PAYMENT_CANCELLED") {
        setIsLoading(false)
        onClose?.()
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [onPaymentComplete, onPaymentError, onClose])

  const handleIframeLoad = () => {
    console.log("[v0] Iframe loaded successfully")
    setIsLoading(false)
    setError(null)
  }

  const handleIframeError = () => {
    console.log("[v0] Iframe failed to load")
    setIsLoading(false)
    setError("Failed to load payment page. Please try again.")
  }

  useEffect(() => {
    console.log("[v0] PayWay iframe mounting with URL:", checkoutUrl)

    // Add a timeout to detect if iframe never loads
    const loadTimeout = setTimeout(() => {
      if (isLoading) {
        console.log("[v0] Iframe load timeout - content may not be displaying")
        setError("Payment page is taking too long to load. Please try again.")
        setIsLoading(false)
      }
    }, 15000) // 15 second timeout

    return () => clearTimeout(loadTimeout)
  }, [checkoutUrl, isLoading])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] relative">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">PayWay Checkout</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl font-bold">
            ×
          </button>
        </div>

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading PayWay checkout...</p>
              {process.env.NODE_ENV === "development" && (
                <p className="text-xs text-gray-400 mt-2">URL: {checkoutUrl}</p>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-95">
            <div className="text-center p-6">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Payment Error</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setError(null)
                    setIsLoading(true)
                    // Force iframe reload
                    if (iframeRef.current) {
                      iframeRef.current.src = checkoutUrl
                    }
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mr-2"
                >
                  Retry
                </button>
                <button onClick={onClose} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
                  Close
                </button>
              </div>
              {process.env.NODE_ENV === "development" && (
                <p className="text-xs text-gray-400 mt-4">Debug: {checkoutUrl}</p>
              )}
            </div>
          </div>
        )}

        <iframe
          ref={iframeRef}
          src={checkoutUrl}
          className="w-full h-[calc(100%-60px)] border-0"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          sandbox="allow-scripts allow-forms allow-top-navigation allow-popups allow-same-origin allow-downloads allow-modals allow-popups-to-escape-sandbox"
          title="PayWay Checkout"
          allow="payment; encrypted-media; fullscreen; camera; microphone; geolocation"
          referrerPolicy="strict-origin-when-cross-origin"
          loading="eager"
          style={{
            colorScheme: "normal",
            backgroundColor: "white",
          }}
        />
      </div>
    </div>
  )
}
