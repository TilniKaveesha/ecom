/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from "next/server"
import { payway } from "@/lib/payway"
import { Convert } from "@/lib/payway-header-types"
import { PayWayPaymentOption } from "@/lib/payway-purchase-types"

if (!global.paywayHtmlStorage) {
  global.paywayHtmlStorage = {} as Record<string, string>
}

export async function POST(request: NextRequest) {
  console.log("=== PayWay Create Transaction API ===")

  try {
    try {
      const requestHeaders: Record<string, string> = {}
      request.headers.forEach((value, key) => {
        requestHeaders[key] = value
      })

      if (requestHeaders["content-type"]) {
        const headerValidation = Convert.toPayWayHeaders(
          JSON.stringify({
            "Content-Type": requestHeaders["content-type"],
          }),
        )
        console.log("✅ Request headers validated:", headerValidation)
      }
    } catch (headerError) {
      console.warn("⚠️ Request header validation failed:", headerError)
      // Continue processing - header validation is not critical
    }

    const body = await request.json()
    const { orderId, amount, currency = "USD", customerInfo, paymentMethod, return_url } = body

    console.log("Request parameters:", {
      orderId,
      amount,
      currency,
      customerInfo,
      paymentMethod,
      return_url,
    })

    // Validate required fields
    if (!orderId || !amount || !customerInfo) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: orderId, amount, or customerInfo",
        },
        { status: 400 },
      )
    }

    // Validate customer info
    if (!customerInfo.name || !customerInfo.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Customer name and email are required",
        },
        { status: 400 },
      )
    }

    const paymentOptionMap: Record<string, PayWayPaymentOption> = {
      abapay_khqr: PayWayPaymentOption.ABA_KHQR, // Returns HTML checkout with QR
      abapay_khqr_deeplink: PayWayPaymentOption.ABA_KHQR_DEEPLINK, // Returns JSON with QR data
      cards: PayWayPaymentOption.CARDS, // Returns HTML checkout form
      credit_debit: PayWayPaymentOption.CARDS, // Alias for cards
      alipay: PayWayPaymentOption.ALIPAY, // Returns HTML checkout form
      wechat: PayWayPaymentOption.WECHAT, // Returns HTML checkout form
      google_pay: PayWayPaymentOption.GOOGLE_PAY, // Returns HTML checkout form
    }

    const payment_option = paymentOptionMap[paymentMethod] || ""

    if (paymentMethod && !payway.validatePaymentOption(payment_option)) {
      console.warn(`⚠️ Invalid payment method: ${paymentMethod}, using default`)
    }

    console.log("Creating PayWay order with payment option:", payment_option)
    console.log("Original payment method:", paymentMethod)

    // Create PayWay order using existing library
    const result = await payway.createOrder(
      Number(amount),
      orderId,
      {
        name: customerInfo.name,
        email: customerInfo.email,
        phone: customerInfo.phone || "",
      },
      payment_option,
    )

    console.log("PayWay order result:", result)

    if (result.success) {
      // Format response based on result type
      if (result.response_type === "json") {
        // QR payment methods (ABA KHQR) - return JSON data
        const response = {
          success: true,
          response_type: "json",
          transaction_ref: result.transaction_ref,
          checkout_url: result.checkout_url,
          qr_string: result.qr_string,
          abapay_deeplink: result.abapay_deeplink,
          status: result.status,
        }
        return NextResponse.json(response)
      } else if (result.response_type === "html" && result.checkout_html) {
        let processedHtml = result.checkout_html

        // Inject enhanced communication script for better payment completion detection
        const communicationScript = `
          <script>
            (function() {
              console.log('[PayWay] Enhanced communication script loaded for transaction: ${result.transaction_ref}');
              
              // Listen for form submissions and payment completion
              document.addEventListener('DOMContentLoaded', function() {
                // Monitor for payment success indicators
                const checkForSuccess = () => {
                  const successIndicators = [
                    'payment successful',
                    'transaction completed',
                    'payment approved',
                    'success',
                    'approved',
                    'thank you'
                  ];
                  
                  const pageText = document.body.innerText.toLowerCase();
                  const hasSuccess = successIndicators.some(indicator => 
                    pageText.includes(indicator)
                  );
                  
                  if (hasSuccess) {
                    console.log('[PayWay] Payment success detected');
                    if (window.parent && window.parent !== window) {
                      window.parent.postMessage({
                        type: 'PAYMENT_SUCCESS',
                        data: { tran_id: '${result.transaction_ref}' }
                      }, '*');
                    }
                    return true;
                  }
                  return false;
                };
                
                // Monitor for payment failure indicators
                const checkForFailure = () => {
                  const failureIndicators = [
                    'payment failed',
                    'transaction failed',
                    'payment declined',
                    'error',
                    'failed',
                    'declined',
                    'invalid'
                  ];
                  
                  const pageText = document.body.innerText.toLowerCase();
                  const hasFailure = failureIndicators.some(indicator => 
                    pageText.includes(indicator)
                  );
                  
                  if (hasFailure) {
                    console.log('[PayWay] Payment failure detected');
                    if (window.parent && window.parent !== window) {
                      window.parent.postMessage({
                        type: 'PAYMENT_ERROR',
                        data: { error: 'Payment failed or declined' }
                      }, '*');
                    }
                    return true;
                  }
                  return false;
                };
                
                // Initial check
                if (!checkForSuccess() && !checkForFailure()) {
                  // Set up periodic monitoring
                  const monitor = setInterval(() => {
                    if (checkForSuccess() || checkForFailure()) {
                      clearInterval(monitor);
                    }
                  }, 1000);
                  
                  // Stop monitoring after 5 minutes
                  setTimeout(() => clearInterval(monitor), 5 * 60 * 1000);
                }
                
                // Monitor for URL changes (for SPA-like behavior)
                let currentUrl = window.location.href;
                setInterval(() => {
                  if (window.location.href !== currentUrl) {
                    currentUrl = window.location.href;
                    setTimeout(() => {
                      checkForSuccess() || checkForFailure();
                    }, 1000);
                  }
                }, 1000);
              });
              
              // Handle form submissions
              document.addEventListener('submit', function(e) {
                console.log('[PayWay] Form submitted, monitoring for results...');
                setTimeout(() => {
                  checkForSuccess() || checkForFailure();
                }, 2000);
              });
              
              // Handle window close
              window.addEventListener('beforeunload', function() {
                if (window.parent && window.parent !== window) {
                  window.parent.postMessage({
                    type: 'PAYMENT_CANCELLED',
                    data: { message: 'Payment window closed' }
                  }, '*');
                }
              });
            })();
          </script>
        `

        // Insert the script before closing body tag
        if (processedHtml.includes("</body>")) {
          processedHtml = processedHtml.replace("</body>", communicationScript + "</body>")
        } else {
          processedHtml += communicationScript
        }
        global.paywayHtmlStorage![result.transaction_ref] = result.checkout_html
        const response = {
          success: true,
          response_type: "html",
          transaction_ref: result.transaction_ref,
          checkout_html: processedHtml,
          status: result.status,
        }
        return NextResponse.json(response)
      } else {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid PayWay response format",
          },
          { status: 500 },
        )
      }
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.status?.message || "Failed to create PayWay transaction",
          code: result.status?.code,
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("PayWay create transaction error:", error)

    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    const isRetryable = error instanceof Error && (error as any).retryable

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        retryable: isRetryable,
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "PayWay Create Transaction API",
    version: "1.0.0",
    description: "Creates PayWay payment transactions with full type validation",
    supported_methods: ["POST"],
    required_fields: ["orderId", "amount", "customerInfo"],
    optional_fields: ["currency", "paymentMethod", "return_url"],
    supported_payment_methods: [
      "abapay_khqr",
      "abapay_khqr_deeplink",
      "cards",
      "credit_debit",
      "alipay",
      "wechat",
      "google_pay",
    ],
    supported_currencies: payway.getSupportedCurrencies(),
    supported_transaction_types: payway.getSupportedTransactionTypes(),
    validation: {
      purchase_request: "Full PayWay purchase request validation enabled",
      headers: "HTTP header validation enabled",
      payment_options: "Payment method validation enabled",
    },
  })
}
