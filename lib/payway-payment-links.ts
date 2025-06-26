import crypto from "crypto"

// RSA Encryption function (based on PayWay documentation)
function opensslEncryption(source: string, publicKey: string): string {
  const maxLength = 117 // RSA 1024-bit key can encrypt max 117 bytes
  let output = ""
  let sourceData = source

  while (sourceData.length > 0) {
    const input = sourceData.substring(0, maxLength)
    const encrypted = crypto.publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      Buffer.from(input, "utf8"),
    )
    output += encrypted.toString("binary")
    sourceData = sourceData.substring(maxLength)
  }

  return Buffer.from(output, "binary").toString("base64")
}

// PayWay Payment Link Status Codes
const PAYMENT_LINK_STATUS_CODES: Record<string, string> = {
  "00": "Success",
  PTL02: "Wrong Hash",
  PTL05: "Parameter Invalid Format",
  PTL99: "Merchant invalid currency",
  PTL132: "Invalid payment link",
}

export const paywayPaymentLinks = {
  createPaymentLink: async function createPaymentLink(params: {
    title: string
    amount: number
    currency: "USD" | "KHR"
    description?: string
    paymentLimit?: number
    expiredDate: number // Unix timestamp
    returnUrl: string
    merchantRefNo?: string
    payout?: Array<{ acc: string; amt: number }>
    image?: File
  }) {
    // Validate environment variables
    if (!process.env.PAYWAY_MERCHANT_ID || !process.env.PAYWAY_API_KEY || !process.env.PAYWAY_RSA_PUBLIC_KEY) {
      throw new Error(
        "PayWay Payment Link credentials not configured. Please set PAYWAY_MERCHANT_ID, PAYWAY_API_KEY, and PAYWAY_RSA_PUBLIC_KEY",
      )
    }

    console.log("=== PayWay Payment Link Creation ===")
    console.log("Title:", params.title)
    console.log("Amount:", params.amount)
    console.log("Currency:", params.currency)

    // Generate required parameters
    const request_time = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14)
    const merchant_id = process.env.PAYWAY_MERCHANT_ID.trim()

    // Validate amount
    const minAmount = params.currency === "USD" ? 0.01 : 100
    if (params.amount < minAmount) {
      throw new Error(`Minimum amount is ${minAmount} ${params.currency}`)
    }

    // Prepare merchant_auth data
    const merchantAuthData = {
      mc_id: merchant_id,
      title: params.title.substring(0, 250),
      amount: params.amount,
      currency: params.currency,
      description: params.description?.substring(0, 250) || "",
      payment_limit: params.paymentLimit || null,
      expired_date: params.expiredDate,
      return_url: Buffer.from(params.returnUrl).toString("base64"),
      merchant_ref_no: params.merchantRefNo?.substring(0, 50) || "",
      payout: params.payout ? JSON.stringify(params.payout) : "",
    }

    console.log("=== Merchant Auth Data ===")
    console.log(JSON.stringify(merchantAuthData, null, 2))

    // Encrypt merchant_auth using RSA
    const merchantAuthJson = JSON.stringify(merchantAuthData)
    const rsaPublicKey = process.env.PAYWAY_RSA_PUBLIC_KEY.trim()

    let merchant_auth: string
    try {
      merchant_auth = opensslEncryption(merchantAuthJson, rsaPublicKey)
      console.log("✅ RSA Encryption successful")
    } catch (error) {
      console.error("❌ RSA Encryption failed:", error)
      throw new Error("Failed to encrypt merchant_auth data. Check your RSA public key format.")
    }

    // Generate HMAC SHA-512 hash
    const hashString = request_time + merchant_id + merchant_auth
    const hash = crypto.createHmac("sha512", process.env.PAYWAY_API_KEY.trim()).update(hashString).digest("base64")

    console.log("Generated hash:", hash)

    // Prepare FormData
    const formData = new FormData()
    formData.append("request_time", request_time)
    formData.append("merchant_id", merchant_id)
    formData.append("merchant_auth", merchant_auth)
    formData.append("hash", hash)

    // Add image if provided
    if (params.image) {
      formData.append("image", params.image)
    }

    const url = "https://checkout-sandbox.payway.com.kh/api/merchant-portal/merchant-access/payment-link/create"

    try {
      console.log("=== Making Payment Link Request ===")
      console.log("URL:", url)

      const response = await fetch(url, {
        method: "POST",
        body: formData,
      })

      console.log("=== PayWay Payment Link Response ===")
      console.log("Status:", response.status)
      console.log("Content-Type:", response.headers.get("content-type"))

      if (response.ok) {
        const result = await response.json()
        console.log("✅ PayWay Payment Link Response:", result)

        const statusCode = result.status?.code
        const statusMessage = result.status?.message || PAYMENT_LINK_STATUS_CODES[statusCode] || "Unknown status"

        if (statusCode === "00") {
          return {
            success: true,
            data: result.data,
            payment_link: result.data.payment_link,
            payment_link_id: result.data.id,
            status: {
              code: statusCode,
              message: statusMessage,
              tran_id: result.tran_id,
            },
          }
        } else {
          throw new Error(`PayWay Payment Link Error: ${statusMessage} (Code: ${statusCode})`)
        }
      } else {
        const errorText = await response.text()
        console.error("❌ PayWay Payment Link HTTP Error:")
        console.error("Status:", response.status, response.statusText)
        console.error("Response:", errorText)
        throw new Error(`PayWay Payment Link HTTP Error: ${response.status} - ${response.statusText}`)
      }
    } catch (error) {
      console.error("❌ PayWay Payment Link Error:", error)
      throw error
    }
  },

  getPaymentLinkDetails: async function getPaymentLinkDetails(paymentLinkId: string) {
    if (!process.env.PAYWAY_MERCHANT_ID || !process.env.PAYWAY_API_KEY || !process.env.PAYWAY_RSA_PUBLIC_KEY) {
      throw new Error("PayWay Payment Link credentials not configured")
    }

    const request_time = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14)
    const merchant_id = process.env.PAYWAY_MERCHANT_ID.trim()

    // Prepare merchant_auth data
    const merchantAuthData = {
      mc_id: merchant_id,
      id: paymentLinkId,
    }

    // Encrypt merchant_auth using RSA
    const merchantAuthJson = JSON.stringify(merchantAuthData)
    const rsaPublicKey = process.env.PAYWAY_RSA_PUBLIC_KEY.trim()
    const merchant_auth = opensslEncryption(merchantAuthJson, rsaPublicKey)

    // Generate HMAC SHA-512 hash
    const hashString = request_time + merchant_id + merchant_auth
    const hash = crypto.createHmac("sha512", process.env.PAYWAY_API_KEY.trim()).update(hashString).digest("base64")

    const url = "https://checkout-sandbox.payway.com.kh/api/merchant-portal/merchant-access/payment-link/detail"

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          request_time,
          merchant_id,
          merchant_auth,
          hash,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        const statusCode = result.status?.code

        if (statusCode === "00") {
          return {
            success: true,
            data: result.data,
            status: {
              code: statusCode,
              message: result.status.message,
              tran_id: result.tran_id,
            },
          }
        } else {
          throw new Error(`PayWay Error: ${result.status.message} (Code: ${statusCode})`)
        }
      } else {
        const errorText = await response.text()
        throw new Error(`PayWay HTTP Error: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error("PayWay getPaymentLinkDetails error:", error)
      throw error
    }
  },

  // Handle webhook notification from PayWay
  handlePaymentNotification: function handlePaymentNotification(notification: {
    tran_id: string
    status: string
    merchant_ref_no: string
  }) {
    console.log("=== PayWay Payment Notification ===")
    console.log("Transaction ID:", notification.tran_id)
    console.log("Status:", notification.status)
    console.log("Merchant Ref:", notification.merchant_ref_no)

    return {
      success: notification.status === "00",
      transaction_id: notification.tran_id,
      merchant_ref: notification.merchant_ref_no,
      status: notification.status,
    }
  },
}
