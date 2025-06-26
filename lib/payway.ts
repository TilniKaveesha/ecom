/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from "crypto"

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

    console.log("=== PayWay Integration Debug ===")
    console.log("Payment Option:", paymentOption || "all_methods")
    console.log("Merchant ID:", process.env.PAYWAY_MERCHANT_ID)

    // Generate required parameters
    const req_time = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14)
    const merchant_id = process.env.PAYWAY_MERCHANT_ID.trim()
    const tran_id = `TXN_${orderId}_${Date.now()}`
    const amount = price.toFixed(2)
    const currency = "USD"

    // Customer info validation and formatting
    const nameParts = customerInfo.name.trim().split(" ")
    const firstname = nameParts[0]?.replace(/[^a-zA-Z\s]/g, "").substring(0, 20) || ""
    const lastname =
      nameParts
        .slice(1)
        .join(" ")
        .replace(/[^a-zA-Z\s]/g, "")
        .substring(0, 20) || ""

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const email = emailRegex.test(customerInfo.email) ? customerInfo.email.substring(0, 50) : ""

    // Phone validation (remove non-digits, keep max 20 chars)
    const phone = customerInfo.phone.replace(/[^\d+\-\s()]/g, "").substring(0, 20) || ""

    // Validate required fields
    if (!firstname) {
      throw new Error("Invalid first name. Must contain only letters and be less than 20 characters.")
    }
    if (!email) {
      throw new Error("Invalid email address.")
    }

    // Transaction parameters
    const type = "purchase"
    const payment_option = paymentOption

    // Items - base64 encoded JSON
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

    // URLs
    const return_url = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/payway/return`
    const cancel_url = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/payway/cancel`
    const continue_success_url = `${process.env.NEXT_PUBLIC_SERVER_URL}/checkout/${orderId}/stripe-payment-success`
    const return_deeplink = ""

    // Custom fields
    const custom_fields = Buffer.from(
      JSON.stringify({
        order_id: orderId,
        platform: "ecommerce",
      }),
    ).toString("base64")

    const return_params = orderId
    const view_type = paymentOption === "abapay_khqr_deeplink" ? "popup" : "" // Use popup for QR deeplink
    const payment_gate = "0"
    const payout = ""
    const lifetime = "30"
    const additional_params = ""
    const google_pay_token = ""
    const skip_success_page = "0"

    // Hash generation - EXACT order as per PayWay documentation
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

    console.log("=== PayWay Request Parameters ===")
    console.log("First Name:", firstname)
    console.log("Last Name:", lastname)
    console.log("Email:", email)
    console.log("Phone:", phone)
    console.log("Amount:", amount)
    console.log("Currency:", currency)
    console.log("Payment Option:", payment_option)
    console.log("View Type:", view_type)

    // Generate hash using HMAC SHA-512
    const hash = crypto.createHmac("sha512", process.env.PAYWAY_API_KEY.trim()).update(hashString).digest("base64")

    console.log("Generated hash:", hash)

    // Prepare FormData - exactly as shown in PayWay documentation
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

    // Use the exact URL from your credentials
    const url = "https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase"

    try {
      console.log("=== Making PayWay Request ===")
      console.log("URL:", url)
      console.log("Method: POST")
      console.log("Content-Type: multipart/form-data")

      const response = await fetch(url, {
        method: "POST",
        body: formData,
        // Don't set Content-Type header - let fetch handle it for FormData
      })

      console.log("=== PayWay Response ===")
      console.log("Status:", response.status)
      console.log("Content-Type:", response.headers.get("content-type"))

      if (response.ok) {
        const contentType = response.headers.get("content-type")

        if (contentType?.includes("application/json")) {
          // JSON response - QR codes, deeplinks, etc.
          const result = await response.json()
          console.log("✅ PayWay JSON Response:", result)

          const statusCode = result.status?.code // This could be string "00" or number 0
          const statusMessage = result.status?.message || getPayWayStatusMessage(statusCode)

          if (isPayWaySuccess(statusCode)) {
            return {
              success: true,
              response_type: "json",
              checkout_html: null,
              checkout_url: result.checkout_qr_url || null,
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
            console.log("✅ PayWay HTML checkout form received")
            return {
              success: true,
              response_type: "html",
              checkout_html: htmlContent,
              checkout_url: null,
              transaction_ref: tran_id,
              qr_string: null,
              abapay_deeplink: null,
              status: {
                code: "00",
                message: "Checkout form generated successfully",
                tran_id,
              },
            }
          } else {
            console.error("❌ Unexpected HTML content")
            throw new Error("PayWay returned unexpected content")
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
      console.error("❌ PayWay Integration Error:", error)
      throw error
    }
  },

  // Specific method for QR payments that return JSON
  createQRPayment: async function createQRPayment(
    price: number,
    orderId: string,
    customerInfo: {
      name: string
      email: string
      phone: string
    },
    paymentOption: "abapay" | "abapay_khqr" | "abapay_khqr_deeplink" | "wechat" | "alipay" = "abapay_khqr_deeplink",
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

  // Helper methods
  getStatusMessage: getPayWayStatusMessage,
  isSuccess: isPayWaySuccess,
  isRetryable: isRetryableError,
}
