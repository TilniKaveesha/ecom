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
      // Remove all external CSS and JS links that cause CORS errors
      htmlContent = htmlContent.replace(/<link[^>]*href="https:\/\/checkout-sandbox\.payway\.com\.kh[^"]*"[^>]*>/g, "")
      htmlContent = htmlContent.replace(
        /<script[^>]*src="https:\/\/checkout-sandbox\.payway\.com\.kh[^"]*"[^>]*><\/script>/g,
        "",
      )

      htmlContent = htmlContent.replace(/<link[^>]*href="[^"]*\/_nuxt\/[^"]*"[^>]*>/g, "")
      htmlContent = htmlContent.replace(/<script[^>]*src="[^"]*\/_nuxt\/[^"]*"[^>]*><\/script>/g, "")

      // Remove prefetch links that cause CORS errors
      htmlContent = htmlContent.replace(/<link[^>]*rel="prefetch"[^>]*>/g, "")
      htmlContent = htmlContent.replace(/<link[^>]*rel="preload"[^>]*>/g, "")

      // Remove integrity attributes that can cause issues
      htmlContent = htmlContent.replace(/\s+integrity="[^"]*"/g, "")

      // Remove nonce attributes that can cause CSP issues
      htmlContent = htmlContent.replace(/\s+nonce="[^"]*"/g, "")

      const basicStyling = `
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .payment-form {
            margin-top: 20px;
          }
          .form-group {
            margin-bottom: 20px;
          }
          label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
          }
          input, select {
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 16px;
            box-sizing: border-box;
          }
          input:focus, select:focus {
            outline: none;
            border-color: #007bff;
            box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
          }
          .btn {
            background-color: #007bff;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 4px;
            font-size: 16px;
            cursor: pointer;
            width: 100%;
            margin-top: 10px;
          }
          .btn:hover {
            background-color: #0056b3;
          }
          .btn:disabled {
            background-color: #6c757d;
            cursor: not-allowed;
          }
          .payment-methods {
            display: flex;
            gap: 10px;
            margin: 20px 0;
            flex-wrap: wrap;
          }
          .payment-method {
            flex: 1;
            min-width: 120px;
            padding: 15px;
            border: 2px solid #ddd;
            border-radius: 8px;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s;
          }
          .payment-method:hover {
            border-color: #007bff;
          }
          .payment-method.selected {
            border-color: #007bff;
            background-color: #f8f9fa;
          }
          .error {
            color: #dc3545;
            margin-top: 10px;
            padding: 10px;
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            border-radius: 4px;
          }
          .success {
            color: #155724;
            margin-top: 10px;
            padding: 10px;
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
            border-radius: 4px;
          }
          .loading {
            text-align: center;
            padding: 40px;
          }
          .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #007bff;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .card-logos {
            display: flex;
            gap: 10px;
            justify-content: center;
            margin: 20px 0;
          }
          .card-logo {
            width: 40px;
            height: 25px;
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
          }
          @media (max-width: 600px) {
            body { padding: 10px; }
            .container { padding: 20px; }
            .payment-methods { flex-direction: column; }
            .payment-method { min-width: auto; }
          }
        </style>
      `

      // Insert basic styling after the head tag
      htmlContent = htmlContent.replace(/<\/head>/, basicStyling + "</head>")

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
              'approved',
              'thank you',
              'confirmation'
            ];
            
            const errorIndicators = [
              'payment failed',
              'transaction failed',
              'error',
              'declined',
              'cancelled',
              'invalid',
              'expired'
            ];
            
            const pageText = document.body.innerText.toLowerCase();
            const pageHtml = document.body.innerHTML.toLowerCase();
            
            // Check for success indicators
            for (const indicator of successIndicators) {
              if (pageText.includes(indicator) || pageHtml.includes(indicator)) {
                sendToParent('PAYMENT_SUCCESS', { 
                  tran_id: '${transactionId}',
                  status: 'completed',
                  message: 'Payment completed successfully'
                });
                return true;
              }
            }
            
            // Check for error indicators
            for (const indicator of errorIndicators) {
              if (pageText.includes(indicator) || pageHtml.includes(indicator)) {
                sendToParent('PAYMENT_ERROR', { 
                  error: 'Payment failed or was declined',
                  tran_id: '${transactionId}'
                });
                return true;
              }
            }
            
            return false;
          }
          
          // Enhanced form monitoring
          function setupFormMonitoring() {
            const forms = document.querySelectorAll('form');
            forms.forEach(form => {
              form.addEventListener('submit', function(e) {
                console.log('[PayWay] Form submitted');
                
                // Show loading state
                const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
                if (submitBtn) {
                  submitBtn.disabled = true;
                  const originalText = submitBtn.textContent || submitBtn.value;
                  submitBtn.textContent = 'Processing...';
                  
                  // Restore button after timeout
                  setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                  }, 10000);
                }
                
                // Monitor for status changes
                setTimeout(() => {
                  monitorPaymentStatus();
                }, 2000);
                
                setTimeout(() => {
                  monitorPaymentStatus();
                }, 5000);
              });
            });
          }
          
          // Monitor DOM changes and form submissions
          document.addEventListener('DOMContentLoaded', function() {
            console.log('[PayWay] DOM loaded, monitoring for payment status');
            
            // Initial setup
            setupFormMonitoring();
            
            // Initial status check
            setTimeout(monitorPaymentStatus, 1000);
            
            // Monitor for button clicks
            document.addEventListener('click', function(e) {
              const target = e.target;
              if (target.type === 'submit' || target.tagName === 'BUTTON' || target.classList.contains('btn')) {
                console.log('[PayWay] Button clicked:', target);
                setTimeout(monitorPaymentStatus, 2000);
                setTimeout(monitorPaymentStatus, 5000);
              }
            });
            
            // Monitor for URL changes (SPA navigation)
            let currentUrl = window.location.href;
            setInterval(function() {
              if (window.location.href !== currentUrl) {
                currentUrl = window.location.href;
                console.log('[PayWay] URL changed:', currentUrl);
                setTimeout(monitorPaymentStatus, 1000);
                setupFormMonitoring(); // Re-setup form monitoring
              }
            }, 1000);
            
            // Periodic status monitoring
            setInterval(monitorPaymentStatus, 3000);
          });
          
          // Handle any existing PayWay callbacks
          window.addEventListener('message', function(event) {
            console.log('[PayWay] Received message in iframe:', event.data);
            // Forward PayWay messages to parent
            if (event.data && event.data.type && event.data.type.startsWith('PAYMENT_')) {
              sendToParent(event.data.type, event.data.data);
            }
          });
          
          // Handle page unload (user navigating away)
          window.addEventListener('beforeunload', function() {
            sendToParent('PAYMENT_CANCELLED', { 
              reason: 'User navigated away from payment page' 
            });
          });
        </script>
      `

      htmlContent = htmlContent.replace("</body>", enhancedScript + "</body>")
    } catch (urlFixError) {
      console.warn("Error processing PayWay HTML:", urlFixError)
      // Continue with original content if processing fails
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
        "Cross-Origin-Embedder-Policy": "unsafe-none",
        "Cross-Origin-Opener-Policy": "unsafe-none",
        "Cross-Origin-Resource-Policy": "cross-origin",
        "Referrer-Policy": "strict-origin-when-cross-origin",
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

