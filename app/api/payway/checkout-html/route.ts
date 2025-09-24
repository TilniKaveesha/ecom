/* eslint-disable no-var */
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const transactionId = searchParams.get("transactionId") || searchParams.get("tran_id")

  if (!transactionId) {
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head><title>PayWay Error</title></head>
        <body>
          <h1>Error</h1>
          <p>Transaction ID is required</p>
          <script>
            if (window.parent !== window) {
              window.parent.postMessage({
                type: 'PAYMENT_ERROR',
                data: { error: 'Transaction ID is required' }
              }, '*');
            }
          </script>
        </body>
      </html>`,
      {
        status: 400,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      },
    )
  }

  try {
    // Retrieve the stored HTML content from global storage
    let htmlContent = global.paywayHtmlStorage?.[transactionId]

    if (!htmlContent) {
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
          <head><title>PayWay Session Expired</title></head>
          <body>
            <h1>Session Expired</h1>
            <p>This payment session has expired or was not found. Please start a new payment.</p>
            <script>
              if (window.parent !== window) {
                window.parent.postMessage({
                  type: 'PAYMENT_ERROR',
                  data: { error: 'Payment session expired or not found' }
                }, '*');
              }
            </script>
          </body>
        </html>`,
        {
          status: 404,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        },
      )
    }

    try {
      // Convert relative /_nuxt/ URLs to absolute PayWay URLs
      htmlContent = htmlContent.replace(
        /href="(?!https?:\/\/)(?!\/\/)\/_nuxt\//g,
        'href="https://checkout-sandbox.payway.com.kh/_nuxt/',
      )
      htmlContent = htmlContent.replace(
        /src="(?!https?:\/\/)(?!\/\/)\/_nuxt\//g,
        'src="https://checkout-sandbox.payway.com.kh/_nuxt/',
      )

      // Fix other relative asset URLs
      htmlContent = htmlContent.replace(
        /href="(?!https?:\/\/)(?!\/\/)\/images\//g,
        'href="https://checkout-sandbox.payway.com.kh/images/',
      )
      htmlContent = htmlContent.replace(
        /src="(?!https?:\/\/)(?!\/\/)\/images\//g,
        'src="https://checkout-sandbox.payway.com.kh/images/',
      )

      // Fix CSS and JS assets
      htmlContent = htmlContent.replace(
        /href="(?!https?:\/\/)(?!\/\/)\/css\//g,
        'href="https://checkout-sandbox.payway.com.kh/css/',
      )
      htmlContent = htmlContent.replace(
        /src="(?!https?:\/\/)(?!\/\/)\/js\//g,
        'src="https://checkout-sandbox.payway.com.kh/js/',
      )

      // Fix any remaining relative URLs that start with /
      htmlContent = htmlContent.replace(/(?:href|src)="(?!https?:\/\/)(?!\/\/)\/(?!\/)/g, (match) => {
        return match.replace('="/', '="https://checkout-sandbox.payway.com.kh/')
      })

      htmlContent = htmlContent.replace(/\s+integrity="[^"]*"/g, "")
      htmlContent = htmlContent.replace(
        /<link([^>]*href="https:\/\/checkout-sandbox\.payway\.com\.kh[^"]*"[^>]*)>/g,
        '<link$1 crossorigin="anonymous">',
      )
      htmlContent = htmlContent.replace(
        /<script([^>]*src="https:\/\/checkout-sandbox\.payway\.com\.kh[^"]*"[^>]*)>/g,
        '<script$1 crossorigin="anonymous">',
      )

      const enhancedScript = `
        <script>
          console.log('[PayWay] Enhanced iframe communication script loaded');
          
          // Function to send messages to parent iframe
          function sendToParent(type, data) {
            if (window.parent !== window) {
              console.log('[PayWay] Sending to parent:', { type, data });
              window.parent.postMessage({ type, data }, '*');
            }
          }
          
          // Monitor for payment success indicators
          function monitorPaymentStatus() {
            // Check for success indicators in the page
            const successIndicators = [
              'payment successful',
              'transaction completed',
              'payment complete',
              'success',
              'approved'
            ];
            
            const errorIndicators = [
              'payment failed',
              'transaction failed',
              'error',
              'declined',
              'cancelled'
            ];
            
            const pageText = document.body.innerText.toLowerCase();
            
            for (const indicator of successIndicators) {
              if (pageText.includes(indicator)) {
                sendToParent('PAYMENT_SUCCESS', { 
                  tran_id: '${transactionId}',
                  status: 'completed'
                });
                return;
              }
            }
            
            for (const indicator of errorIndicators) {
              if (pageText.includes(indicator)) {
                sendToParent('PAYMENT_ERROR', { 
                  error: 'Payment failed or was declined'
                });
                return;
              }
            }
          }
          
          // Monitor DOM changes and form submissions
          document.addEventListener('DOMContentLoaded', function() {
            console.log('[PayWay] DOM loaded, monitoring for payment status');
            
            // Initial check
            setTimeout(monitorPaymentStatus, 1000);
            
            // Monitor for form submissions
            document.addEventListener('submit', function(e) {
              console.log('[PayWay] Form submitted');
              setTimeout(monitorPaymentStatus, 2000);
            });
            
            // Monitor for button clicks
            document.addEventListener('click', function(e) {
              if (e.target.type === 'submit' || e.target.tagName === 'BUTTON') {
                console.log('[PayWay] Button clicked');
                setTimeout(monitorPaymentStatus, 2000);
              }
            });
            
            // Monitor for URL changes (SPA navigation)
            let currentUrl = window.location.href;
            setInterval(function() {
              if (window.location.href !== currentUrl) {
                currentUrl = window.location.href;
                console.log('[PayWay] URL changed:', currentUrl);
                setTimeout(monitorPaymentStatus, 1000);
              }
            }, 1000);
          });
          
          // Handle any existing PayWay callbacks
          window.addEventListener('message', function(event) {
            console.log('[PayWay] Received message in iframe:', event.data);
            // Forward PayWay messages to parent
            if (event.data && event.data.type && event.data.type.startsWith('PAYMENT_')) {
              sendToParent(event.data.type, event.data.data);
            }
          });
        </script>
      `

      htmlContent = htmlContent.replace("</body>", enhancedScript + "</body>")
    } catch (urlFixError) {
      console.warn("Error fixing URLs in PayWay HTML:", urlFixError)
      // Continue with original content if URL fixing fails
    }

    console.log(`[PayWay] Serving HTML content for transaction: ${transactionId}`)

    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "X-Content-Type-Options": "nosniff",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    })
  } catch (error) {
    console.error("Error serving PayWay HTML:", error)
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head><title>PayWay Error</title></head>
        <body>
          <h1>Internal Server Error</h1>
          <p>An error occurred while loading the payment page. Please try again.</p>
          <script>
            if (window.parent !== window) {
              window.parent.postMessage({
                type: 'PAYMENT_ERROR',
                data: { error: 'Internal server error while loading payment page' }
              }, '*');
            }
          </script>
        </body>
      </html>`,
      {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      },
    )
  }
}

// Initialize global storage for HTML content
declare global {
  var paywayHtmlStorage: Record<string, string> | undefined
}

if (!global.paywayHtmlStorage) {
  global.paywayHtmlStorage = {}
}
