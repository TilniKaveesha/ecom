import crypto from "crypto"

// PayWay API URLs
const PAYWAY_URLS = [
  "https://checkout-sandbox.payway.com.kh",
  "https://api-sandbox.payway.com.kh",
  "https://sandbox.payway.com.kh",
  "https://checkout.payway.com.kh", // Production
]

const base = process.env.PAYWAY_API_URL || PAYWAY_URLS[0]

export const payway = {
  createOrder: async function createOrder(
    price: number,
    orderId: string,
    customerInfo: {
      name: string
      email: string
      phone: string
    },
  ) {
    // Validate environment variables
    if (!process.env.PAYWAY_MERCHANT_ID || !process.env.PAYWAY_API_KEY) {
      throw new Error("PayWay credentials not configured. Please set PAYWAY_MERCHANT_ID and PAYWAY_API_KEY")
    }

    // Generate required parameters according to PayWay specification
    const req_time = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14) // YYYYMMDDHHmmss
    const merchant_id = process.env.PAYWAY_MERCHANT_ID.trim()
    const tran_id = `TXN_${orderId}_${Date.now()}`
    const amount = price.toFixed(2)
    const currency = "USD"

    // Split customer name
    const nameParts = customerInfo.name.trim().split(" ")
    const firstname = nameParts[0] || ""
    const lastname = nameParts.slice(1).join(" ") || ""
    const email = customerInfo.email || ""
    const phone = customerInfo.phone || ""

    // Required parameters
    const type = "purchase"
    const payment_option = "" // Leave empty to show all available payment methods

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

    // Custom fields - base64 encoded JSON
    const custom_fields = Buffer.from(
      JSON.stringify({
        order_id: orderId,
        platform: "ecommerce",
      }),
    ).toString("base64")

    const return_params = orderId
    const view_type = "" // Leave empty for default
    const payment_gate = "0"
    const payout = ""
    const lifetime = "30" // 30 minutes
    const additional_params = ""
    const google_pay_token = ""
    const skip_success_page = "0"

    // Generate hash according to PayWay specification
    // IMPORTANT: The order must match exactly as specified in the documentation
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

    console.log("Hash string components:", {
      req_time,
      merchant_id,
      tran_id,
      amount,
      items,
      shipping,
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
      currency,
      custom_fields,
      return_params,
      payout,
      lifetime,
      additional_params,
      google_pay_token,
      skip_success_page,
    })

    const hash = crypto.createHmac("sha512", process.env.PAYWAY_API_KEY.trim()).update(hashString).digest("base64")

    console.log("Generated hash:", hash)
    console.log("Hash string length:", hashString.length)

    // Prepare FormData (multipart/form-data)
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

    // Try multiple URLs if the primary one fails
    const urlsToTry = process.env.PAYWAY_API_URL ? [process.env.PAYWAY_API_URL] : PAYWAY_URLS

    for (const baseUrl of urlsToTry) {
      const url = `${baseUrl}/api/payment-gateway/v1/payments/purchase`

      try {
        console.log(`Trying PayWay URL: ${url}`)

        const response = await fetch(url, {
          method: "POST",
          body: formData,
          // Don't set Content-Type header - let fetch set it for FormData
        })

        console.log("PayWay Response Status:", response.status)
        console.log("PayWay Response Content-Type:", response.headers.get("content-type"))

        if (response.ok) {
          const contentType = response.headers.get("content-type")

          // Handle different response types
          if (contentType?.includes("application/json")) {
            // JSON response (for abapay_khqr_deeplink and similar)
            const result = await response.json()
            console.log("PayWay JSON Response:", result)

            if (result.status?.code === "00") {
              return {
                success: true,
                checkout_html: null,
                checkout_url: result.checkout_qr_url || null,
                transaction_ref: tran_id,
                qr_string: result.qr_string || null,
                abapay_deeplink: result.abapay_deeplink || null,
              }
            } else {
              throw new Error(`PayWay Error: ${result.status?.message || "Unknown error"}`)
            }
          } else {
            // HTML response (checkout form)
            const htmlContent = await response.text()

            // Log the first 500 characters to see what we got
            console.log("PayWay HTML Response (first 500 chars):", htmlContent.substring(0, 500))

            // Check for specific error indicators
            const isErrorPage =
              htmlContent.toLowerCase().includes("error occurred") ||
              htmlContent.toLowerCase().includes("invalid request") ||
              htmlContent.toLowerCase().includes("authentication failed") ||
              htmlContent.toLowerCase().includes("merchant not found") ||
              htmlContent.toLowerCase().includes("hash mismatch") ||
              htmlContent.toLowerCase().includes("400 bad request") ||
              htmlContent.toLowerCase().includes("500 internal server error")

            if (isErrorPage) {
              // Extract error message if possible
              const errorMatch =
                htmlContent.match(/<title>(.*?)<\/title>/i) ||
                htmlContent.match(/<h1>(.*?)<\/h1>/i) ||
                htmlContent.match(/error[^<]*([^<]+)/i)

              const errorMessage = errorMatch ? errorMatch[1] : "Unknown PayWay error"
              throw new Error(`PayWay Error: ${errorMessage}`)
            }

            // Check if it looks like a valid checkout form
            const isCheckoutForm =
              htmlContent.toLowerCase().includes("checkout") ||
              htmlContent.toLowerCase().includes("payment") ||
              htmlContent.toLowerCase().includes("form") ||
              htmlContent.toLowerCase().includes("payway")

            if (isCheckoutForm) {
              console.log("PayWay returned valid checkout form")
              return {
                success: true,
                checkout_html: htmlContent,
                checkout_url: null,
                transaction_ref: tran_id,
                qr_string: null,
                abapay_deeplink: null,
              }
            } else {
              throw new Error("PayWay returned unexpected HTML content")
            }
          }
        } else {
          const errorText = await response.text()
          console.error(`PayWay API Error for ${url}:`, {
            status: response.status,
            statusText: response.statusText,
            body: errorText.substring(0, 1000), // First 1000 chars
          })

          // If this is the last URL to try, throw the error
          if (baseUrl === urlsToTry[urlsToTry.length - 1]) {
            throw new Error(
              `PayWay API Error: ${response.status} ${response.statusText} - ${errorText.substring(0, 200)}`,
            )
          }
          // Otherwise, continue to next URL
          continue
        }
      } catch (error) {
        console.error(`PayWay error for ${url}:`, error)

        // If this is the last URL to try, throw the error
        if (baseUrl === urlsToTry[urlsToTry.length - 1]) {
          throw error
        }
        // Otherwise, continue to next URL
        continue
      }
    }

    throw new Error("All PayWay URLs failed")
  },

  getTransactionDetails: async function getTransactionDetails(tran_id: string) {
    const url = `${base}/api/payment-gateway/v1/payments/transaction-detail`

    const req_time = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14)
    const merchant_id = process.env.PAYWAY_MERCHANT_ID!

    // Generate hash for transaction details
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
        console.log("PayWay Transaction Details:", result)

        return {
          status: result.status?.code || result.status,
          amount: result.amount,
          email: result.email,
          transaction_ref: result.tran_id || tran_id,
          ...result,
        }
      } else {
        const errorText = await response.text()
        console.error("PayWay Transaction Details Error:", errorText)
        throw new Error(`PayWay Transaction Details Error: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error("PayWay getTransactionDetails error:", error)
      throw error
    }
  },
}
