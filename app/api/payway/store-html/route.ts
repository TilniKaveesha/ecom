/* eslint-disable no-var */
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { tran_id, html_content } = await request.json()

    if (!tran_id || !html_content) {
      return NextResponse.json({ error: "Transaction ID and HTML content are required" }, { status: 400 })
    }

    // Initialize global storage if it doesn't exist
    if (!global.paywayHtmlStorage) {
      global.paywayHtmlStorage = {}
    }

    let processedHtml = html_content

    // Inject enhanced communication script for better payment completion detection
    const communicationScript = `
      <script>
        (function() {
          console.log('[PayWay] Enhanced communication script loaded');
          
          // Listen for form submissions and payment completion
          document.addEventListener('DOMContentLoaded', function() {
            // Monitor for payment success indicators
            const checkForSuccess = () => {
              const successIndicators = [
                'payment successful',
                'transaction completed',
                'payment approved',
                'success',
                'approved'
              ];
              
              const pageText = document.body.innerText.toLowerCase();
              const hasSuccess = successIndicators.some(indicator => 
                pageText.includes(indicator)
              );
              
              if (hasSuccess) {
                console.log('[PayWay] Payment success detected');
                if (window.opener) {
                  window.opener.postMessage({
                    type: 'PAYMENT_SUCCESS',
                    data: { tran_id: '${tran_id}' }
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
                'declined'
              ];
              
              const pageText = document.body.innerText.toLowerCase();
              const hasFailure = failureIndicators.some(indicator => 
                pageText.includes(indicator)
              );
              
              if (hasFailure) {
                console.log('[PayWay] Payment failure detected');
                if (window.opener) {
                  window.opener.postMessage({
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
          
          // Handle window close
          window.addEventListener('beforeunload', function() {
            if (window.opener) {
              window.opener.postMessage({
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

    // Store the processed HTML content temporarily (expires after 15 minutes)
    global.paywayHtmlStorage[tran_id] = processedHtml

    setTimeout(
      () => {
        if (global.paywayHtmlStorage && global.paywayHtmlStorage[tran_id]) {
          delete global.paywayHtmlStorage[tran_id]
        }
      },
      15 * 60 * 1000,
    ) // 15 minutes

    console.log(`[PayWay] Stored HTML content for transaction: ${tran_id}`)
    return NextResponse.json({ success: true, tran_id })
  } catch (error) {
    console.error("Error storing PayWay HTML:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// Initialize global storage for HTML content
declare global {
  var paywayHtmlStorage: Record<string, string> | undefined
}
