import crypto from "crypto"

const base = process.env.PAYWAY_API_URL || "https://checkout-sandbox.payway.com.kh"

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
    const url = `${base}/api/payment-gateway/v1/payments/purchase`

    // Generate required parameters
    const req_time = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14) // YYYYMMDDHHmmss
    const merchant_id = process.env.PAYWAY_MERCHANT_ID!
    const tran_id = `TXN_${orderId}_${Date.now()}`
    const amount = price
    const currency = "USD"

    // Optional parameters
    const items = Buffer.from(
      JSON.stringify([
        {
          name: `Order ${orderId}`,
          quantity: 1,
          price: price,
        },
      ]),
    ).toString("base64")

    const shipping = 0
    const firstname = customerInfo.name.split(" ")[0] || ""
    const lastname = customerInfo.name.split(" ").slice(1).join(" ") || ""
    const email = customerInfo.email
    const phone = customerInfo.phone
    const type = "purchase"
    const payment_option = "" // Let customer choose
    const return_url = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/payway/callback`
    const cancel_url = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/payway/cancel?orderId=${orderId}`
    const continue_success_url = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/payway/return?orderId=${orderId}`
    const return_deeplink = ""
    const custom_fields = Buffer.from(
      JSON.stringify({
        order_id: orderId,
        platform: "ecommerce",
      }),
    ).toString("base64")
    const return_params = orderId
    const payout = ""
    const lifetime = 30 // 30 minutes
    const additional_params = ""
    const google_pay_token = ""
    const skip_success_page = 1

    // Generate hash - CRITICAL: Must match PayWay documentation exactly
    const b4hash =
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

    const hash = crypto.createHmac("sha512", process.env.PAYWAY_API_KEY!).update(b4hash).digest("base64")

    // Prepare form data
    const formData = new FormData()
    formData.append("req_time", req_time)
    formData.append("merchant_id", merchant_id)
    formData.append("tran_id", tran_id)
    formData.append("amount", amount.toString())
    formData.append("currency", currency)
    formData.append("items", items)
    formData.append("shipping", shipping.toString())
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
    formData.append("payout", payout)
    formData.append("lifetime", lifetime.toString())
    formData.append("additional_params", additional_params)
    formData.append("google_pay_token", google_pay_token)
    formData.append("skip_success_page", skip_success_page.toString())
    formData.append("hash", hash)

    try {
      const response = await fetch(url, {
        method: "POST",
        body: formData, // Don't set Content-Type header - let browser handle it
      })

      if (response.ok) {
        const htmlContent = await response.text()
        return {
          success: true,
          checkout_html: htmlContent,
          transaction_ref: tran_id,
        }
      } else {
        const errorText = await response.text()
        console.error("PayWay API Error:", errorText)
        throw new Error(`PayWay API Error: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error("PayWay createOrder error:", error)
      throw error
    }
  },

  getTransactionDetails: async function getTransactionDetails(tran_id: string) {
    const url = `${base}/api/payment-gateway/v1/payments/transaction-detail`

    const req_time = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14)
    const merchant_id = process.env.PAYWAY_MERCHANT_ID!

    // Generate hash for transaction details
    const b4hash = req_time + merchant_id + tran_id
    const hash = crypto.createHmac("sha512", process.env.PAYWAY_API_KEY!).update(b4hash).digest("base64")

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
