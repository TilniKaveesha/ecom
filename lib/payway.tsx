/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from "crypto"
import { Convert } from "./payway-header-types"
import {
  type PayWayPurchaseRequest,
  PayWayPaymentOption,
  PayWayTransactionType,
  PayWayCurrency,
  Convert as PurchaseConvert,
} from "./payway-purchase-types"

// PayWay Status Codes - Master list with string keys
const PAYWAY_STATUS_CODES: Record<string, string> = {
  "00": "Success",
  "01": "Wrong hash",
  "02": "Invalid transaction ID",
  "03": "Invalid transaction amount",
  "04": "Duplicated transaction ID",
  "05": "Transaction not found",
  "06": "Requested domain is not in whitelist",
  "07": "Wrong return param",
  "08": "Something went wrong while saving data. Please try again later or contact merchant for help.",
  "10": "Wrong shipping price",
  "11": "Something went wrong. Try again or contact the merchant for help.",
  "12": "Payment currency is not allowed",
  "13": "Invalid items",
  "14": "Invalid credit multi acc",
  "15": "Invalid or missing channel values from smart merchant",
  "16": "Invalid first name. It must not contain numbers or special characters or not more than 100 characters.",
  "17": "Invalid last name. It must not contain numbers or special characters or not more than 100 characters.",
  "18": "Invalid phone number",
  "19": "Invalid email",
  "20": "Something went wrong. Please contact merchant.",
  "21": "End of API lifetime",
  "22": "Pre-auth transaction is not enabled",
  "23": "Selected payment option is not enabled for this merchant profile",
  "24": "Cannot decrypt data",
  "25": "Allow maximum 10 payout per requests",
  "26": "Invalid merchant profile",
  "27": "Invalid ctid",
  "28": "Invalid pwt",
  "29": "Invalid pwt or ctid",
  "30": "Merchant is not enabled COF",
  "31": "Unsecure 3Ds page",
  "33": "Cannot identify cardOrigin",
  "34": "Exchange rate data is invalid",
  "35": "Payout info is invalid",
  "36": "Payout account or amount is invalid",
  "37": "Payout accounts are not in whitelist",
  "38": "Payout contain invalid transaction ID",
  "39": "Payout contain duplicated account",
  "40": "Payout contain duplicated transaction ID",
  "41": "Payout info contain mid not link with any merchant profile",
  "42": "Payout info contain account invalid status",
  "43": "Merchant profile's MID is missing. Please try again or contact merchant for help.",
  "44": "Purchase amount has reached transaction limit",
  "45": "Purchase with zero amount is not allowed",
  "46": "Purchase amount for KHR currency could not contain decimal place",
  "47": "KHR amount must be greater than 100 KHR",
  "48": "Something went wrong with requested parameters. Please try again or contact merchant for help.",
  "49": "Invalid start date",
  "50": "Invalid end date",
  "51": "Invalid date range",
  "52": "Maximum date range is allowed only 3 days",
  "53": "Invalid amount range",
  "54": "Transaction is expired. Please try again or contact the merchant for help.",
  "55": "We are unable to request QR from Wechat system. Please try again or contact merchant for help.",
  "56": "We are unable to validate your transaction with Wechat system. Please try again or contact merchant for help.",
  "57": "We are unable to validate your card source. Please try again or contact merchant for help.",
  "58": "Provide invalid card number",
  "59": "Payout info can not be fixed with MID and ABA account",
  "60": "Something went wrong with QR String. Please try again or contact merchant for help.",
  "61": "Something went wrong. Please try again or contact merchant for help.",
  "62": "QR is already in used",
  "63": "Transaction is already exist in core banking. Please perform new transaction or contact merchant for help.",
  "64": "Payer's account is same as merchant profile's account. Please choose different account.",
  "65": "Merchant profile's MID is not found in core banking. Please try again or contact merchant for help.",
  "66": "Something went wrong. Please try again or contact merchant for help.",
  "67": "QR on invoice is currently not available for this merchant profile.",
  "68": "Transaction is expired. Please re-initiate the transaction.",
  "69": "Transaction lifetime can not be less than 3 minutes.",
  "70": "Total purchase amount has reached daily limit. Please use difference account.",
  "71": "Payout for card payment is not allowed to ABA account.",
  "72": "The merchant profile cannot accept payment because its settlement account is closed.",
  "73": "Invalid transaction status",
  "74": "Invalid tran_id or merchant_id",
  "75": "tran_id not found",
  "76": "Invalid additional parameters",
  "77": "Merchant transactions do not support transaction fees",
  "78": "Card payout transactions are not compatible with the discount program.",
  "79": "Payment token missing in Google Pay",
  "80": "Failed to decrypt the payment token provided by Google Pay",
  "81": "The return URL is not in the whitelist",
  "82": "The payout has exceeded the maximum allowable amount per transaction",
  "83": "Payment credential is disabled",
  "84": "Payment credential is expired",
  "85": "Purchase reach limit amount per transaction",
  "86": "Unsupported merchant purchase mode",
  "87": "Payment credential is removed",
  "200": "Payment was canceled",
  "201": "Payment was declined",
  "401": "Unauthorized access",
  "403": "Something went wrong. Try again or contact the merchant for help.",
  "429": "Too many request, please try again in 1min.",
  "503": "System under maintenance",
}

// Helper function to normalize status code (handle both string and number)
function normalizeStatusCode(code: string | number): string {
  if (typeof code === "string") {
    return code
  }
  // Convert number to zero-padded string (e.g., 0 -> "00", 1 -> "01")
  return code.toString().padStart(2, "0")
}

// Helper function to get status message
function getPayWayStatusMessage(code: string | number): string {
  const normalizedCode = normalizeStatusCode(code)
  return PAYWAY_STATUS_CODES[normalizedCode] || `Unknown status code: ${code}`
}

// Helper function to determine if status is successful
function isPayWaySuccess(code: string | number): boolean {
  const normalizedCode = normalizeStatusCode(code)
  return normalizedCode === "00"
}

// Helper function to determine if error is retryable
function isRetryableError(code: string | number): boolean {
  const retryableCodes = ["08", "11", "20", "54", "55", "56", "60", "61", "66", "429", "503"]
  const normalizedCode = normalizeStatusCode(code)
  return retryableCodes.includes(normalizedCode)
}

export const payway = {
  createOrder: async function createOrder(
    price: number,
    orderId: string,
    customerInfo: {
      name: string
      email: string
      phone: string
    },
    paymentOption = "",
  ) {
    // Validate environment variables
    if (!process.env.PAYWAY_MERCHANT_ID || !process.env.PAYWAY_API_KEY) {
      throw new Error("PayWay credentials not configured. Please set PAYWAY_MERCHANT_ID and PAYWAY_API_KEY")
    }

    console.log("=== PayWay Purchase API Integration ===")
    console.log("Payment Option:", paymentOption || "all_methods")
    console.log("Merchant ID:", process.env.PAYWAY_MERCHANT_ID)

    // Generate required parameters in exact format specified
    const req_time = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14)
    const merchant_id = process.env.PAYWAY_MERCHANT_ID.trim()

    // Use format similar to API example: trx-20201019130949
    const timestamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14)
    const tran_id = `trx-${timestamp}`.substring(0, 20) // Ensure <= 20 chars

    const amount = price.toFixed(2)
    const currency = "USD"

    // Customer info validation and formatting per API spec
    const nameParts = customerInfo.name.trim().split(" ")
    const firstname = nameParts[0]?.replace(/[^a-zA-Z\s]/g, "").substring(0, 20) || ""
    const lastname =
      nameParts
        .slice(1)
        .join(" ")
        .replace(/[^a-zA-Z\s]/g, "")
        .substring(0, 20) || ""

    // Email validation per API spec
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const email = emailRegex.test(customerInfo.email) ? customerInfo.email.substring(0, 50) : ""

    // Phone validation per API spec (remove non-digits, keep max 20 chars)
    const phone = customerInfo.phone.replace(/[^\d+\-\s()]/g, "").substring(0, 20) || ""

    // Validate required fields per API documentation
    if (!firstname) {
      throw new Error("Invalid first name. Must contain only letters and be less than 20 characters.")
    }
    if (!email) {
      throw new Error("Invalid email address.")
    }

    // Transaction parameters per Purchase API spec
    const type = "purchase"
    const payment_option = paymentOption

    // Items - base64 encoded JSON per API spec
    const items = Buffer.from(
      JSON.stringify([
        {
          name: `Order ${orderId}`,
          quantity: 1,
          price: Number.parseFloat(amount),
        },
      ]),
    ).toString("base64")

    const shipping = "0.00"

    // URLs per API specification
    const return_url = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/payway/return`
    const cancel_url = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/payway/cancel`
    const continue_success_url = `${process.env.NEXT_PUBLIC_SERVER_URL}/checkout/${orderId}/stripe-payment-success`
    const return_deeplink = ""

    // Custom fields per API spec
    const custom_fields = Buffer.from(
      JSON.stringify({
        order_id: orderId,
        platform: "ecommerce",
      }),
    ).toString("base64")

    const return_params = orderId
    const view_type = paymentOption === "abapay_khqr_deeplink" ? "popup" : ""
    const payment_gate = "0"
    const payout = ""
    const lifetime = "30"
    const additional_params = ""
    const google_pay_token = ""
    const skip_success_page = "0"

    const hashString =
      req_time +
      merchant_id +
      tran_id +
      amount +
      items +
      shipping +
      firstname +
      lastname +
      email +
      phone +
      type +
      payment_option +
      return_url +
      cancel_url +
      continue_success_url +
      return_deeplink +
      currency +
      custom_fields +
      return_params +
      payout +
      lifetime +
      additional_params +
      google_pay_token +
      skip_success_page

    console.log("=== PayWay Purchase API Request Parameters ===")
    console.log("Transaction ID:", tran_id, `(${tran_id.length} chars)`)
    console.log("First Name:", firstname)
    console.log("Last Name:", lastname)
    console.log("Email:", email)
    console.log("Phone:", phone)
    console.log("Amount:", amount)
    console.log("Currency:", currency)
    console.log("Payment Option:", payment_option)
    console.log("View Type:", view_type)

    // Generate hash using HMAC SHA-512 per API spec
    const hash = crypto.createHmac("sha512", process.env.PAYWAY_API_KEY.trim()).update(hashString).digest("base64")

    console.log("Generated hash:", hash)
    console.log("Hash string length:", hashString.length)

    const purchaseRequest: PayWayPurchaseRequest = {
      req_time,
      merchant_id,
      tran_id,
      amount: Number.parseFloat(amount),
      currency,
      items,
      shipping: Number.parseFloat(shipping),
      firstname,
      lastname,
      email,
      phone,
      type,
      payment_option,
      return_url,
      cancel_url,
      continue_success_url,
      return_deeplink,
      custom_fields,
      return_params,
      view_type,
      payment_gate: Number.parseInt(payment_gate),
      payout,
      lifetime: Number.parseInt(lifetime),
      additional_params,
      google_pay_token,
      skip_success_page: Number.parseInt(skip_success_page),
      hash,
    }

    try {
      const validatedRequest = PurchaseConvert.toPayWayPurchaseRequest(JSON.stringify(purchaseRequest))
      console.log("✅ PayWay purchase request validated successfully")
      console.log("Validated request fields:", Object.keys(validatedRequest).length)
    } catch (validationError) {
      console.warn("⚠️ PayWay purchase request validation failed:", validationError)
      // Continue processing - validation is for debugging purposes
    }

    const formData = new FormData()
    formData.append("req_time", req_time)
    formData.append("merchant_id", merchant_id)
    formData.append("tran_id", tran_id)
    formData.append("amount", amount)
    formData.append("currency", currency)
    formData.append("items", items)
    formData.append("shipping", shipping)
    formData.append("firstname", firstname)
    formData.append("lastname", lastname)
    formData.append("email", email)
    formData.append("phone", phone)
    formData.append("type", type)
    formData.append("payment_option", payment_option)
    formData.append("return_url", return_url)
    formData.append("cancel_url", cancel_url)
    formData.append("continue_success_url", continue_success_url)
    formData.append("return_deeplink", return_deeplink)
    formData.append("custom_fields", custom_fields)
    formData.append("return_params", return_params)
    formData.append("view_type", view_type)
    formData.append("payment_gate", payment_gate)
    formData.append("payout", payout)
    formData.append("lifetime", lifetime)
    formData.append("additional_params", additional_params)
    formData.append("google_pay_token", google_pay_token)
    formData.append("skip_success_page", skip_success_page)
    formData.append("hash", hash)

    const url = "https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase"

    let lastError: Error | null = null
    const maxRetries = paymentOption === "abapay_khqr_deeplink" ? 2 : 1

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`=== Making PayWay Purchase API Request (Attempt ${attempt}/${maxRetries}) ===`)
        console.log("URL:", url)
        console.log("Method: POST")
        console.log("Content-Type: multipart/form-data")
        console.log("Payment Option:", payment_option)

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

        const response = await fetch(url, {
          method: "POST",
          body: formData,
          signal: controller.signal,
          // Don't set Content-Type header - let fetch handle it for FormData
        })

        clearTimeout(timeoutId)

        console.log("=== PayWay Purchase API Response ===")
        console.log("Status:", response.status)
        console.log("Content-Type:", response.headers.get("content-type"))

        try {
          const responseHeaders: Record<string, string> = {}
          response.headers.forEach((value, key) => {
            responseHeaders[key] = value
          })

          // Validate Content-Type header if present
          if (responseHeaders["content-type"]) {
            const headerValidation = Convert.toPayWayHeaders(
              JSON.stringify({
                "Content-Type": responseHeaders["content-type"],
              }),
            )
            console.log("✅ PayWay response headers validated:", headerValidation)
          }
        } catch (headerError) {
          console.warn("⚠️ PayWay response header validation failed:", headerError)
          // Continue processing - header validation is not critical for functionality
        }

        if (response.status === 520 || response.status === 502 || response.status === 503) {
          const errorText = await response.text()
          console.error(`❌ PayWay Server Error (${response.status}):`, errorText.substring(0, 500))

          // If this is a deeplink request and we've tried once, fall back to regular abapay_khqr
          if (paymentOption === "abapay_khqr_deeplink" && attempt === 1) {
            console.log("⚠️ Deeplink failed with 520 error, will retry with regular abapay_khqr on next attempt")
            lastError = new Error(`PayWay Server Error: ${response.status} - Server temporarily unavailable`)

            // Update payment_option for next attempt
            formData.set("payment_option", "abapay_khqr")
            formData.set("view_type", "")

            // Regenerate hash with new payment_option
            const newHashString =
              req_time +
              merchant_id +
              tran_id +
              amount +
              items +
              shipping +
              firstname +
              lastname +
              email +
              phone +
              type +
              "abapay_khqr" + // Changed payment option
              return_url +
              cancel_url +
              continue_success_url +
              return_deeplink +
              currency +
              custom_fields +
              return_params +
              payout +
              lifetime +
              additional_params +
              google_pay_token +
              skip_success_page

            const newHash = crypto
              .createHmac("sha512", process.env.PAYWAY_API_KEY!.trim())
              .update(newHashString)
              .digest("base64")
            formData.set("hash", newHash)

            console.log("🔄 Retrying with payment_option: abapay_khqr")
            continue // Retry with fallback
          }

          throw new Error(`PayWay Server Error: ${response.status} - ${response.statusText}`)
        }

        if (response.ok) {
          const contentType = response.headers.get("content-type")

          if (contentType?.includes("application/json")) {
            const result = await response.json()
            console.log("✅ PayWay JSON Response:", result)

            const statusCode = result.status?.code
            const statusMessage = result.status?.message || getPayWayStatusMessage(statusCode)

            if (isPayWaySuccess(statusCode)) {
              return {
                success: true,
                response_type: "json",
                checkout_html: null,
                checkout_url: result.checkout_qr_url || null,
                checkout_qr_url: result.checkout_qr_url || null,
                transaction_ref: result.status.tran_id || tran_id,
                qr_string: result.qr_string || null,
                abapay_deeplink: result.abapay_deeplink || null,
                status: {
                  code: statusCode,
                  message: statusMessage,
                  tran_id: result.status.tran_id || tran_id,
                },
              }
            } else {
              const error = new Error(`PayWay Error: ${statusMessage} (Code: ${statusCode})`)
              ;(error as any).code = statusCode
              ;(error as any).retryable = isRetryableError(statusCode)
              throw error
            }
          } else {
            // HTML response - checkout form
            const htmlContent = await response.text()
            console.log("HTML Response length:", htmlContent.length)
            console.log("HTML Response preview:", htmlContent.substring(0, 500))

            // Validate that we received actual HTML content
            if (!htmlContent || htmlContent.trim().length === 0) {
              throw new Error("PayWay returned empty HTML content")
            }

            // Check if content looks like HTML
            const isValidHtml =
              htmlContent.includes("<html") || htmlContent.includes("<body") || htmlContent.includes("<form")
            if (!isValidHtml) {
              console.error("❌ PayWay returned non-HTML content:", htmlContent.substring(0, 200))
              throw new Error("PayWay returned invalid HTML content")
            }

            // Check for error indicators in HTML
            const errorIndicators = [
              "error occurred",
              "invalid request",
              "authentication failed",
              "merchant not found",
              "hash mismatch",
              "wrong hash",
              "invalid hash",
              "access denied",
              "unauthorized",
              "forbidden",
              "bad request",
              "internal server error",
            ]

            const hasError = errorIndicators.some((indicator) => htmlContent.toLowerCase().includes(indicator))

            if (hasError) {
              // Extract error message from HTML
              const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/i)
              const h1Match = htmlContent.match(/<h1[^>]*>(.*?)<\/h1>/i)
              const errorMatch = htmlContent.match(/error[:\s]*([^<\n]+)/i)

              const errorMessage = titleMatch?.[1] || h1Match?.[1] || errorMatch?.[1] || "Unknown PayWay error"

              console.error("❌ PayWay HTML Error:", errorMessage)
              throw new Error(`PayWay Error: ${errorMessage.trim()}`)
            }

            // Check for valid checkout form
            const checkoutIndicators = ["checkout", "payment", "payway", "<form", "<input", "submit"]
            const isCheckoutForm = checkoutIndicators.some((indicator) => htmlContent.toLowerCase().includes(indicator))

            if (isCheckoutForm) {
              console.log("✅ PayWay HTML checkout form received - preparing for iframe display")

              let processedHtml = htmlContent

              const paywayBaseUrl = "https://checkout-sandbox.payway.com.kh"

              // Fix Nuxt.js asset paths (CSS and JS files)
              processedHtml = processedHtml.replace(/href=["'](\/_nuxt\/[^"']+)["']/gi, `href="${paywayBaseUrl}$1"`)
              processedHtml = processedHtml.replace(/src=["'](\/_nuxt\/[^"']+)["']/gi, `src="${paywayBaseUrl}$1"`)

              // Fix other relative asset paths (images, fonts, etc.)
              processedHtml = processedHtml.replace(
                /href=["'](\/[^"']+\.(css|woff|woff2|ttf|eot))["']/gi,
                `href="${paywayBaseUrl}$1"`,
              )
              processedHtml = processedHtml.replace(
                /src=["'](\/[^"']+\.(js|png|jpg|jpeg|gif|svg|webp))["']/gi,
                `src="${paywayBaseUrl}$1"`,
              )

              // Fix background images in inline styles
              processedHtml = processedHtml.replace(/url$$["']?(\/[^"')]+)["']?$$/gi, `url("${paywayBaseUrl}$1")`)

              console.log("[v0] Converted relative URLs to absolute URLs for PayWay assets")

              // Remove integrity attributes from link tags (CSS)
              processedHtml = processedHtml.replace(/<link([^>]*)\sintegrity=["'][^"']*["']([^>]*)>/gi, "<link$1$2>")

              // Remove integrity attributes from script tags (JS)
              processedHtml = processedHtml.replace(
                /<script([^>]*)\sintegrity=["'][^"']*["']([^>]*)>/gi,
                "<script$1$2>",
              )

              // Remove crossorigin attributes from link tags
              processedHtml = processedHtml.replace(/<link([^>]*)\scrossorigin=["'][^"']*["']([^>]*)>/gi, "<link$1$2>")
              processedHtml = processedHtml.replace(/<link([^>]*)\scrossorigin([^>]*)>/gi, "<link$1$2>")

              // Remove crossorigin attributes from script tags
              processedHtml = processedHtml.replace(
                /<script([^>]*)\scrossorigin=["'][^"']*["']([^>]*)>/gi,
                "<script$1$2>",
              )
              processedHtml = processedHtml.replace(/<script([^>]*)\scrossorigin([^>]*)>/gi, "<script$1$2>")

              console.log("[v0] Removed integrity and crossorigin attributes to bypass CORS checks")

              // Ensure proper DOCTYPE and HTML structure for iframe
              if (!processedHtml.includes("<!DOCTYPE")) {
                processedHtml = "<!DOCTYPE html>\n" + processedHtml
              }

              // Add viewport meta tag for mobile compatibility if not present
              if (!processedHtml.includes("viewport")) {
                processedHtml = processedHtml.replace(
                  /<head>/i,
                  '<head>\n<meta name="viewport" content="width=device-width, initial-scale=1.0">',
                )
              }

              // Add iframe-friendly styling if not present
              if (!processedHtml.includes("iframe-friendly")) {
                const iframeStyling = `
                <style id="iframe-friendly">
                  body { 
                    margin: 0; 
                    padding: 20px; 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background-color: #ffffff;
                    overflow-x: hidden;
                  }
                  * { box-sizing: border-box; }
                  .container, .main-content { 
                    max-width: 100% !important; 
                    width: 100% !important;
                  }
                  form { 
                    max-width: 100% !important; 
                    width: 100% !important;
                  }
                  input, select, button { 
                    max-width: 100% !important; 
                    font-size: 16px !important;
                  }
                  @media (max-width: 768px) {
                    body { padding: 10px; }
                    input, select, button { font-size: 16px !important; }
                  }
                </style>
              `
                processedHtml = processedHtml.replace(/<\/head>/i, iframeStyling + "</head>")
              }

              let extractedQrString = null
              let extractedCheckoutUrl = null

              // Try to extract QR data from __NUXT_DATA__ script tag
              const nuxtDataMatch = htmlContent.match(/<script[^>]*id="__NUXT_DATA__"[^>]*>(.*?)<\/script>/)
              if (nuxtDataMatch) {
                try {
                  const nuxtData = JSON.parse(nuxtDataMatch[1])
                  console.log("[v0] Extracted NUXT data from HTML")

                  // Parse the NUXT data structure to find qr_string
                  if (Array.isArray(nuxtData)) {
                    for (const item of nuxtData) {
                      if (typeof item === "object" && item !== null) {
                        if (item.qr_string) {
                          extractedQrString = item.qr_string
                          console.log("[v0] Found qr_string in NUXT data")
                        }
                        if (item.checkout_qr_url) {
                          extractedCheckoutUrl = item.checkout_qr_url
                          console.log("[v0] Found checkout_qr_url in NUXT data")
                        }
                      }
                    }
                  }
                } catch (parseError) {
                  console.warn("[v0] Failed to parse NUXT data:", parseError)
                }
              }

              // Add target="aba_webservice" to all forms for ABA PayWay integration
              processedHtml = processedHtml.replace(/<form([^>]*)>/gi, (match, attributes) => {
                // Check if target attribute already exists
                if (attributes.includes("target=")) {
                  // Replace existing target with aba_webservice
                  return match.replace(/target\s*=\s*["'][^"']*["']/gi, 'target="aba_webservice"')
                } else {
                  // Add target attribute
                  return `<form${attributes} target="aba_webservice">`
                }
              })

              const abaPaywayScript = `
              <script src="https://checkout.payway.com.kh/plugins/checkout2-0.js"></script>
              <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
              <script>
                $(document).ready(function(){
                  console.log('[PayWay HTML] Initializing ABA PayWay checkout for transaction: ${tran_id}');
                  
                  // Extract QR data from page
                  const nuxtDataScript = document.getElementById('__NUXT_DATA__');
                  if (nuxtDataScript) {
                    try {
                      const nuxtData = JSON.parse(nuxtDataScript.textContent);
                      console.log('[PayWay HTML] NUXT data found:', nuxtData);
                      
                      // Search for qr_string and checkout_qr_url in the data structure
                      function findInData(obj, key) {
                        if (typeof obj !== 'object' || obj === null) return null;
                        if (obj[key]) return obj[key];
                        if (Array.isArray(obj)) {
                          for (const item of obj) {
                            const result = findInData(item, key);
                            if (result) return result;
                          }
                        }
                        for (const k in obj) {
                          const result = findInData(obj[k], key);
                          if (result) return result;
                        }
                        return null;
                      }
                      
                      const qrString = findInData(nuxtData, 'qr_string');
                      const checkoutQrUrl = findInData(nuxtData, 'checkout_qr_url');
                      
                      if (checkoutQrUrl) {
                        console.log('[PayWay HTML] Found checkout_qr_url, sending to parent');
                        // Send to parent window for popup display
                        if (window.parent !== window) {
                          window.parent.postMessage({
                            type: 'CHECKOUT_QR_URL',
                            data: {
                              checkout_qr_url: checkoutQrUrl,
                              qr_string: qrString,
                              transaction_id: '${tran_id}'
                            }
                          }, '*');
                        }
                      }
                    } catch (e) {
                      console.error('[PayWay HTML] Failed to parse NUXT data:', e);
                    }
                  }
                  
                  // Find checkout button (common selectors)
                  const checkoutButton = $('#checkout_button, .checkout-button, [type="submit"], button[name*="checkout"], input[value*="checkout"], input[value*="pay"]').first();
                  
                  if (checkoutButton.length) {
                    console.log('[PayWay HTML] Checkout button found');
                    checkoutButton.click(function(e){
                      e.preventDefault();
                      console.log('[PayWay HTML] Checkout button clicked');
                      
                      // Find the form and append payment options
                      const form = $(this).closest('form');
                      const paymentOption = $(".payment_option:checked, input[name*='payment']:checked").first();
                      
                      if (form.length && form.attr('id')) {
                        $('#' + form.attr('id')).append(paymentOption);
                      } else if (form.length) {
                        form.append(paymentOption);
                      }
                      
                      // Trigger ABA PayWay checkout
                      if (typeof AbaPayway !== 'undefined' && AbaPayway.checkout) {
                        console.log('[PayWay HTML] Calling AbaPayway.checkout()');
                        AbaPayway.checkout();
                      } else {
                        console.warn('[PayWay HTML] AbaPayway.checkout not available, submitting form normally');
                        form.submit();
                      }
                    });
                  }
                  
                  // Listen for checkout_qr_url response from ABA PayWay
                  window.addEventListener('message', function(event) {
                    console.log('[PayWay HTML] Received message:', event.data);
                    
                    if (event.data && event.data.checkout_qr_url) {
                      console.log('[PayWay HTML] Checkout QR URL received from AbaPayway');
                      // Send QR URL to parent window for popup display
                      if (window.parent !== window) {
                        window.parent.postMessage({
                          type: 'CHECKOUT_QR_URL',
                          data: {
                            checkout_qr_url: event.data.checkout_qr_url,
                            transaction_id: event.data.transaction_id || '${tran_id}'
                          }
                        }, '*');
                      }
                    }
                  });
                });
              </script>
            `

              // Insert ABA PayWay script before closing body tag
              if (processedHtml.includes("</body>")) {
                processedHtml = processedHtml.replace("</body>", abaPaywayScript + "</body>")
              } else {
                processedHtml += abaPaywayScript
              }

              return {
                success: true,
                response_type: "html",
                checkout_html: processedHtml,
                checkout_url: extractedCheckoutUrl,
                checkout_qr_url: extractedCheckoutUrl,
                transaction_ref: tran_id,
                qr_string: extractedQrString,
                abapay_deeplink: null,
                status: {
                  code: "00",
                  message: "Checkout form generated successfully",
                  tran_id,
                },
              }
            } else {
              console.error("❌ Unexpected HTML content - not a valid checkout form")
              console.error("Content preview:", htmlContent.substring(0, 1000))
              throw new Error("PayWay returned unexpected content - not a valid checkout form")
            }
          }
        } else {
          const errorText = await response.text()
          console.error("❌ PayWay HTTP Error:")
          console.error("Status:", response.status, response.statusText)
          console.error("Response:", errorText.substring(0, 1000))

          throw new Error(`PayWay HTTP Error: ${response.status} - ${response.statusText}`)
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          console.error("❌ PayWay request timeout after 30 seconds")
          lastError = new Error("PayWay request timeout - please try again")

          if (attempt < maxRetries) {
            console.log(`🔄 Retrying... (${attempt + 1}/${maxRetries})`)
            continue
          }
        }

        console.error(`❌ PayWay Purchase API Integration Error (Attempt ${attempt}/${maxRetries}):`, error)
        lastError = error as Error

        // If we have more retries and this is a deeplink request, try fallback
        if (attempt < maxRetries && paymentOption === "abapay_khqr_deeplink") {
          console.log("🔄 Retrying with fallback...")
          continue
        }

        // No more retries, throw the error
        break
      }
    }

    throw lastError || new Error("PayWay request failed after all retries")
  },

  createQRPayment: async function createQRPayment(
    price: number,
    orderId: string,
    customerInfo: {
      name: string
      email: string
      phone: string
    },
    paymentOption: PayWayPaymentOption = PayWayPaymentOption.ABA_KHQR_DEEPLINK,
  ) {
    return this.createOrder(price, orderId, customerInfo, paymentOption)
  },

  getTransactionDetails: async function getTransactionDetails(tran_id: string) {
    const url = "https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/transaction-detail"
    const req_time = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14)
    const merchant_id = process.env.PAYWAY_MERCHANT_ID!

    const hashString = req_time + merchant_id + tran_id
    const hash = crypto.createHmac("sha512", process.env.PAYWAY_API_KEY!).update(hashString).digest("base64")

    try {
      const formData = new FormData()
      formData.append("req_time", req_time)
      formData.append("merchant_id", merchant_id)
      formData.append("tran_id", tran_id)
      formData.append("hash", hash)

      const response = await fetch(url, {
        method: "POST",
        body: formData,
      })

      try {
        const responseHeaders: Record<string, string> = {}
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value
        })

        if (responseHeaders["content-type"]) {
          const headerValidation = Convert.toPayWayHeaders(
            JSON.stringify({
              "Content-Type": responseHeaders["content-type"],
            }),
          )
          console.log("✅ Transaction details headers validated:", headerValidation)
        }
      } catch (headerError) {
        console.warn("⚠️ Transaction details header validation failed:", headerError)
      }

      if (response.ok) {
        const result = await response.json()
        const statusCode = result.status?.code

        return {
          success: isPayWaySuccess(statusCode),
          status: statusCode,
          message: result.status?.message || getPayWayStatusMessage(statusCode),
          amount: result.amount,
          email: result.email,
          transaction_ref: result.tran_id || tran_id,
          ...result,
        }
      } else {
        const errorText = await response.text()
        throw new Error(`PayWay Transaction Details Error: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error("PayWay getTransactionDetails error:", error)
      throw error
    }
  },

  // Helper method to validate payment options
  validatePaymentOption: function validatePaymentOption(option: string): boolean {
    return Object.values(PayWayPaymentOption).includes(option as PayWayPaymentOption)
  },

  // Helper method to get supported currencies
  getSupportedCurrencies: function getSupportedCurrencies(): string[] {
    return Object.values(PayWayCurrency)
  },

  // Helper method to get supported transaction types
  getSupportedTransactionTypes: function getSupportedTransactionTypes(): string[] {
    return Object.values(PayWayTransactionType)
  },

  // Helper methods
  getStatusMessage: getPayWayStatusMessage,
  isSuccess: isPayWaySuccess,
  isRetryable: isRetryableError,
}
