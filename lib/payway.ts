import crypto from "crypto"

// PayWay API URLs - try different possible sandbox URLs
const PAYWAY_URLS = [
  "https://checkout-sandbox.payway.com.kh",
  "https://api-sandbox.payway.com.kh",
  "https://sandbox.payway.com.kh",
  "https://checkout.payway.com.kh", // Production - use only if sandbox doesn't work
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
    // Generate required parameters
    const req_time = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14) // YYYYMMDDHHmmss
    const merchant_id = process.env.PAYWAY_MERCHANT_ID!
    const tran_id = `TXN_${orderId}_${Date.now()}`
    const amount = price.toFixed(2) // Ensure 2 decimal places
    const currency = "USD"

    // Required parameters for PayWay
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
    const firstname = customerInfo.name.split(" ")[0] || ""
    const lastname = customerInfo.name.split(" ").slice(1).join(" ") || ""
    const email = customerInfo.email
    const phone = customerInfo.phone || ""
    const type = "purchase"
    const payment_option = "cards" // Specify payment method
    const return_url = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/payway/return`
    const cancel_url = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/payway/cancel`
    const continue_success_url = `${process.env.NEXT_PUBLIC_SERVER_URL}/checkout/${orderId}/stripe-payment-success`
    const return_deeplink = ""
    const custom_fields = Buffer.from(
      JSON.stringify({
        order_id: orderId,
        platform: "ecommerce",
      }),
    ).toString("base64")
    const return_params = orderId
    const payout = ""
    const lifetime = "30" // 30 minutes as string
    const additional_params = ""
    const google_pay_token = ""
    const skip_success_page = "0" // Keep as string

    // Generate hash according to PayWay documentation
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

    const hash = crypto.createHmac("sha512", process.env.PAYWAY_API_KEY!).update(hashString).digest("base64")

    // Prepare request body
    const requestBody = {
      req_time,
      merchant_id,
      tran_id,
      amount,
      currency,
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
      custom_fields,
      return_params,
      payout,
      lifetime,
      additional_params,
      google_pay_token,
      skip_success_page,
      hash,
    }

    // Try multiple URLs if the primary one fails
    const urlsToTry = process.env.PAYWAY_API_URL ? [process.env.PAYWAY_API_URL] : PAYWAY_URLS

    for (const baseUrl of urlsToTry) {
      const url = `${baseUrl}/api/payment-gateway/v1/payments/purchase`

      try {
        console.log(`Trying PayWay URL: ${url}`)

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/html,application/json", // Accept both HTML and JSON
            "User-Agent": "Ecommerce-App/1.0",
          },
          body: JSON.stringify(requestBody),
        })

        console.log("PayWay Response Status:", response.status)
        console.log("PayWay Response Content-Type:", response.headers.get("content-type"))

        if (response.ok) {
          const contentType = response.headers.get("content-type")

          // Check if response is HTML (checkout form) or JSON
          if (contentType?.includes("text/html")) {
            // PayWay returned HTML checkout form
            const htmlContent = await response.text()
            console.log("PayWay returned HTML checkout form")

            return {
              success: true,
              checkout_html: htmlContent,
              transaction_ref: tran_id,
              checkout_url: null, // No redirect URL, using embedded HTML
            }
          } else if (contentType?.includes("application/json")) {
            // PayWay returned JSON response
            const result = await response.json()
            console.log("PayWay Success Response:", result)

            return {
              success: true,
              checkout_html: result.checkout_html || result.data?.checkout_html,
              transaction_ref: tran_id,
              checkout_url: result.checkout_url || result.data?.checkout_url,
            }
          } else {
            // Try to parse as text first, then as JSON
            const textContent = await response.text()

            // Check if it looks like HTML
            if (textContent.trim().startsWith("<!DOCTYPE") || textContent.trim().startsWith("<html")) {
              console.log("PayWay returned HTML content")
              return {
                success: true,
                checkout_html: textContent,
                transaction_ref: tran_id,
                checkout_url: null,
              }
            }

            // Try to parse as JSON
            try {
              const jsonResult = JSON.parse(textContent)
              return {
                success: true,
                checkout_html: jsonResult.checkout_html || jsonResult.data?.checkout_html,
                transaction_ref: tran_id,
                checkout_url: jsonResult.checkout_url || jsonResult.data?.checkout_url,
              }
            } catch {
              // If all else fails, treat as HTML
              return {
                success: true,
                checkout_html: textContent,
                transaction_ref: tran_id,
                checkout_url: null,
              }
            }
          }
        } else {
          const errorText = await response.text()
          console.error(`PayWay API Error for ${url}:`, errorText)

          // If this is the last URL to try, throw the error
          if (baseUrl === urlsToTry[urlsToTry.length - 1]) {
            throw new Error(`PayWay API Error: ${response.status} - ${errorText}`)
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
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          req_time,
          merchant_id,
          tran_id,
          hash,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        return {
          status: result.status,
          amount: result.amount,
          email: result.email,
          transaction_ref: result.tran_id,
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
