 
"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { X, Loader2 } from "lucide-react"

interface PayWayPopupProps {
  checkoutUrl?: string
  checkoutHtml?: string
  transactionId: string
  onPaymentComplete?: (result: { tran_id?: string; status?: string }) => void
  onPaymentError?: (error: { error?: string; message?: string }) => void
  onClose?: () => void
}

export default function PayWayPopup({
  checkoutUrl,
  checkoutHtml,
  transactionId,
  onPaymentComplete,
  onPaymentError,
  onClose,
}: PayWayPopupProps) {
  const popupRef = useRef<Window | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase()
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
      setIsMobile(isMobileDevice)

      // Disable scroll on mobile like the WooCommerce plugin
      if (isMobileDevice) {
        document.body.style.overflow = "hidden"
        document.body.style.height = "100vh"
      }
    }

    checkMobile()

    return () => {
      // Re-enable scroll when popup closes
      document.body.style.overflow = ""
      document.body.style.height = ""
    }
  }, [])

  useEffect(() => {
    if (checkoutHtml || checkoutUrl) {
      console.log("[PayWay] Opening popup window for checkout")

      // Calculate popup dimensions
      const width = isMobile ? window.screen.width - 20 : Math.min(1000, window.screen.width * 0.8)
      const height = isMobile ? window.screen.height - 40 : Math.min(700, window.screen.height * 0.8)
      const left = (window.screen.width - width) / 2
      const top = (window.screen.height - height) / 2

      // Open popup window
      const popup = window.open(
        "",
        "payway_checkout",
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes,status=no,toolbar=no,menubar=no,location=no`,
      )

      if (!popup) {
        setError("Popup blocked. Please allow popups for this site and try again.")
        setIsLoading(false)
        return
      }

      popupRef.current = popup

      // Write HTML content to popup or navigate to URL
      if (checkoutHtml) {
        popup.document.open()
        popup.document.write(checkoutHtml)
        popup.document.close()

        const script = popup.document.createElement("script")
        script.textContent = `
          function checkPaymentStatus() {
            try {
              // Check for ABA PayWay specific success indicators
              const abaSuccessElements = document.querySelectorAll('[class*="aba-success"], [id*="aba-success"], [class*="payway-success"], [id*="payway-success"]');
              const successElements = document.querySelectorAll('[class*="success"], [id*="success"], [class*="approved"], [id*="approved"]');
              const errorElements = document.querySelectorAll('[class*="error"], [id*="error"], [class*="failed"], [id*="failed"]');
              
              if (abaSuccessElements.length > 0 || successElements.length > 0) {
                console.log('[PayWay Popup] Payment success detected');
                if (window.opener && !window.opener.closed) {
                  window.opener.postMessage({
                    type: 'PAYMENT_SUCCESS',
                    data: { tran_id: '${transactionId}', status: 'success' }
                  }, '*');
                  window.close();
                }
                return;
              }
              
              if (errorElements.length > 0) {
                console.log('[PayWay Popup] Payment error detected');
                if (window.opener && !window.opener.closed) {
                  window.opener.postMessage({
                    type: 'PAYMENT_ERROR', 
                    data: { error: 'Payment failed' }
                  }, '*');
                }
                return;
              }
              
              // Check URL for callback parameters
              const urlParams = new URLSearchParams(window.location.search);
              const status = urlParams.get('status');
              const tranId = urlParams.get('tran_id');
              
              if (status === 'success' && tranId) {
                console.log('[PayWay Popup] URL success detected');
                if (window.opener && !window.opener.closed) {
                  window.opener.postMessage({
                    type: 'PAYMENT_SUCCESS',
                    data: { tran_id: tranId, status: 'success' }
                  }, '*');
                  window.close();
                }
              } else if (status === 'error' || status === 'failed') {
                console.log('[PayWay Popup] URL error detected');
                if (window.opener && !window.opener.closed) {
                  window.opener.postMessage({
                    type: 'PAYMENT_ERROR',
                    data: { error: urlParams.get('error') || 'Payment failed' }
                  }, '*');
                }
              }
            } catch (e) {
              console.log('[PayWay Popup] Payment status check error:', e);
            }
          }
          
          function monitorForQRUrl() {
            try {
              // Check for checkout_qr_url in various possible locations
              const qrUrlElements = document.querySelectorAll('[data-qr-url], [data-checkout-url], .qr-url, .checkout-url');
              qrUrlElements.forEach(element => {
                const qrUrl = element.getAttribute('data-qr-url') || element.getAttribute('data-checkout-url') || element.textContent;
                if (qrUrl && (qrUrl.includes('checkout') || qrUrl.includes('qr'))) {
                  console.log('[PayWay Popup] QR URL found:', qrUrl);
                  if (window.opener && !window.opener.closed) {
                    window.opener.postMessage({
                      type: 'CHECKOUT_QR_URL',
                      data: { checkout_qr_url: qrUrl }
                    }, '*');
                  }
                }
              });
              
              // Also check for QR URLs in script tags or data attributes
              const scripts = document.querySelectorAll('script');
              scripts.forEach(script => {
                const content = script.textContent || script.innerHTML;
                if (content && content.includes('checkout_qr_url')) {
                  const match = content.match(/checkout_qr_url['":]\\s*['"]([^'"]+)['"]/);
                  if (match && match[1]) {
                    console.log('[PayWay Popup] QR URL found in script:', match[1]);
                    if (window.opener && !window.opener.closed) {
                      window.opener.postMessage({
                        type: 'CHECKOUT_QR_URL',
                        data: { checkout_qr_url: match[1] }
                      }, '*');
                    }
                  }
                }
              });
            } catch (e) {
              console.log('[PayWay Popup] QR URL monitoring error:', e);
            }
          }
          
          // Monitor URL changes and form submissions with better error handling
          let lastUrl = window.location.href;
          const monitorInterval = setInterval(() => {
            try {
              if (window.location.href !== lastUrl) {
                lastUrl = window.location.href;
                checkPaymentStatus();
                monitorForQRUrl();
              }
              
              // Check if popup is still connected to parent
              if (!window.opener || window.opener.closed) {
                console.log('[PayWay Popup] Parent window closed, cleaning up');
                clearInterval(monitorInterval);
                window.close();
              }
            } catch (e) {
              console.log('[PayWay Popup] Monitor error:', e);
            }
          }, 1000);
          
          // Check on page load
          window.addEventListener('load', function() {
            checkPaymentStatus();
            monitorForQRUrl();
          });
          document.addEventListener('DOMContentLoaded', function() {
            checkPaymentStatus();
            monitorForQRUrl();
          });
          
          // Monitor form submissions
          document.addEventListener('submit', function(e) {
            console.log('[PayWay Popup] Form submitted');
            setTimeout(() => {
              checkPaymentStatus();
              monitorForQRUrl();
            }, 2000);
          });
          
          // Monitor for ABA PayWay specific events
          window.addEventListener('message', function(event) {
            console.log('[PayWay Popup] Received internal message:', event.data);
            if (event.data && event.data.checkout_qr_url) {
              if (window.opener && !window.opener.closed) {
                window.opener.postMessage({
                  type: 'CHECKOUT_QR_URL',
                  data: event.data
                }, '*');
              }
            }
          });
          
          // Handle popup close
          window.addEventListener('beforeunload', function() {
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage({
                type: 'PAYMENT_CANCELLED',
                data: { message: 'Popup closed by user' }
              }, '*');
            }
          });
        `
        popup.document.head.appendChild(script)
      } else if (checkoutUrl) {
        console.log("[PayWay Popup] Loading checkout URL:", checkoutUrl)
        popup.location.href = checkoutUrl
      }

      setIsLoading(false)

      // Monitor popup closure
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed)
          onClose?.()
        }
      }, 1000)

      return () => {
        clearInterval(checkClosed)
        if (popup && !popup.closed) {
          popup.close()
        }
      }
    }
  }, [checkoutHtml, checkoutUrl, transactionId, isMobile, onClose])

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      const allowedOrigins = [
        "https://checkout-sandbox.payway.com.kh",
        "https://checkout.payway.com.kh",
        "https://api-sandbox.payway.com.kh",
        "https://api.payway.com.kh",
        window.location.origin,
      ]

      if (!allowedOrigins.includes(event.origin)) {
        console.warn("[PayWay] Ignored message from unauthorized origin:", event.origin)
        return
      }

      console.log("[PayWay] Received message:", event.data)

      // Handle PayWay callback messages
      if (event.data?.type === "PAYMENT_SUCCESS" || event.data?.status === "success") {
        setIsLoading(false)
        onPaymentComplete?.(event.data.data || event.data)
      } else if (event.data?.type === "PAYMENT_ERROR" || event.data?.status === "error") {
        setIsLoading(false)
        setError(event.data.data?.error || event.data.error || "Payment failed")
        onPaymentError?.(event.data.data || event.data)
      } else if (event.data?.type === "PAYMENT_CANCELLED" || event.data?.status === "cancelled") {
        setIsLoading(false)
        onClose?.()
      } else if (event.data?.type === "CHECKOUT_QR_URL") {
        console.log("[PayWay] Received QR URL:", event.data.data.checkout_qr_url)
        // Handle QR URL here, e.g., display it in the parent window
      }
    },
    [onPaymentComplete, onPaymentError, onClose],
  )

  useEffect(() => {
    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [handleMessage])

  const handleClose = () => {
    // Close popup if it exists
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close()
    }

    // Re-enable scroll
    document.body.style.overflow = ""
    document.body.style.height = ""
    onClose?.()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" id="aba_main_modal">
      <div className="bg-white rounded-lg shadow-xl relative max-w-md w-full mx-4">
        <div className="flex justify-between items-center p-4 border-b bg-gray-50 rounded-t-lg">
          <h2 className="text-lg font-semibold text-gray-800">PayWay Checkout</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-200 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {isLoading && (
            <div className="text-center">
              <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Opening PayWay checkout...</p>
              <p className="text-sm text-gray-500">Complete your payment in the popup window</p>
              {process.env.NODE_ENV === "development" && (
                <p className="text-xs text-gray-400 mt-2">Transaction: {transactionId}</p>
              )}
            </div>
          )}

          {error && (
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Payment Error</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <div className="space-x-2">
                <button
                  onClick={() => {
                    setError(null)
                    setIsLoading(true)
                    // Retry by reopening popup
                    window.location.reload()
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  Retry
                </button>
                <button
                  onClick={handleClose}
                  className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {!isLoading && !error && (
            <div className="text-center">
              <div className="text-blue-500 text-6xl mb-4">💳</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Payment Window Opened</h3>
              <p className="text-gray-600 mb-4">
                Complete your payment in the PayWay popup window. This dialog will close automatically when payment is
                complete.
              </p>
              <button
                onClick={handleClose}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
              >
                Cancel Payment
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
