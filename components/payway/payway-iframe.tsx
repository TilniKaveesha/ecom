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
        onPaymentComplete?.(event.data.data)
      } else if (event.data?.type === "PAYMENT_ERROR") {
        onPaymentError?.(event.data.data)
      } else if (event.data?.type === "PAYMENT_CANCELLED") {
        onClose?.()
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [onPaymentComplete, onPaymentError, onClose])

  const handleIframeLoad = () => {
    setIsLoading(false)
  }

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
            </div>
          </div>
        )}

        <iframe
          ref={iframeRef}
          src={checkoutUrl}
          className="w-full h-[calc(100%-60px)] border-0"
          onLoad={handleIframeLoad}
          sandbox="allow-scripts allow-forms allow-same-origin allow-top-navigation allow-popups"
          title="PayWay Checkout"
        />
      </div>
    </div>
  )
}
