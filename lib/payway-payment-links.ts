/* eslint-disable @typescript-eslint/no-unused-vars */
import crypto from "crypto"

// PayWay Payment Link Configuration
const PAYWAY_CONFIG = {
  merchant_id: process.env.PAYWAY_MERCHANT_ID || "ec460814",
  api_key: process.env.PAYWAY_API_KEY || "5b614bf17453092a752c8d91e5fa0866ef090775",
  rsa_public_key:
    process.env.PAYWAY_RSA_PUBLIC_KEY ||
    `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCt+cXOt3xchpnOb7TYnxQgS/Ek
28ZpBlQ9CDMarQgivKOTtamAfjxQNc0iBifsJ0iTK4F/LVtgGkKPU6OWt4Qrwz9C
BNZpionE4uda3oow8dtaIp8B6PxnzLoM00vLb45BQHtUN5ARTMhesl5B2ajif9Gc
zyfhL91w0yMy5xpV7QIDAQAB
-----END PUBLIC KEY-----`,
  api_url: "https://checkout-sandbox.payway.com.kh/api/merchant-portal/merchant-access/payment-link/create",
  detail_url: "https://checkout-sandbox.payway.com.kh/api/merchant-portal/merchant-access/payment-link/detail",
}

// PayWay API Response Types
interface PayWayResponse {
  data?: {
    id: string
    title: string
    amount: string | number
    currency: string
    status: string
    description: string
    payment_limit: number
    total_amount: number
    total_trxn: number
    created_at: string
    updated_at: string
    expired_date: number
    return_url: string
    merchant_ref_no: string
    payment_link: string
  }
  status: {
    code: string
    message: string
  }
  tran_id: string | number
}

interface PaymentNotification {
  tran_id: string
  status: string
  merchant_ref_no: string
  amount?: string | number
  currency?: string
}

interface PaymentLinkCreateParams {
  title: string
  amount: number
  currency: string
  description?: string
  paymentLimit?: number
  expiredDate?: string
  returnUrl?: string
  merchantRefNo?: string
  payout?: string
}

// OpenSSL encryption function
function opensslEncryption(source: string, publicKey: string): string {
  const maxlength = 117
  let output = ""
  let sourceData = source

  while (sourceData.length > 0) {
    const input = sourceData.substring(0, maxlength)

    try {
      const encrypted = crypto.publicEncrypt(
        {
          key: publicKey,
          padding: crypto.constants.RSA_PKCS1_PADDING,
        },
        Buffer.from(input, "utf8"),
      )
      output += encrypted.toString("binary")
    } catch (error) {
      console.error("Encryption error:", error)
      throw new Error("Failed to encrypt data with RSA public key")
    }

    sourceData = sourceData.substring(maxlength)
  }

  return Buffer.from(output, "binary").toString("base64")
}

// Generate current time in PayWay format
function getCurrentPayWayTime(): string {
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = String(now.getUTCMonth() + 1).padStart(2, "0")
  const day = String(now.getUTCDate()).padStart(2, "0")
  const hours = String(now.getUTCHours()).padStart(2, "0")
  const minutes = String(now.getUTCMinutes()).padStart(2, "0")
  const seconds = String(now.getUTCSeconds()).padStart(2, "0")

  return `${year}${month}${day}${hours}${minutes}${seconds}`
}

// Generate HMAC SHA-512 hash
function generateHash(requestTime: string, merchantId: string, merchantAuth: string, apiKey: string): string {
  const b4hash = requestTime + merchantId + merchantAuth
  return crypto.createHmac("sha512", apiKey).update(b4hash, "utf8").digest("base64")
}

export const paywayPaymentLinks = {
  // Create payment link
  async createPaymentLink(params: PaymentLinkCreateParams) {
    try {
      const requestTime = getCurrentPayWayTime()
      const linkId = `pl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Validate amount
      const amount = Number.parseFloat(params.amount.toString())
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Invalid amount. Amount must be a positive number.")
      }

      // Prepare merchant_auth data
      const merchantAuthData = {
        mc_id: PAYWAY_CONFIG.merchant_id,
        title: params.title || "Payment Link",
        amount: amount,
        currency: params.currency || "USD",
        description: params.description || "Payment via PayWay Link",
        payment_limit: params.paymentLimit || 1,
        expired_date: params.expiredDate ? Math.floor(new Date(params.expiredDate).getTime() / 1000) : null,
        return_url: Buffer.from(params.returnUrl || "https://localhost:3000/api/payway/payment-link/webhook").toString(
          "base64",
        ),
        merchant_ref_no: params.merchantRefNo || linkId,
        ...(params.payout && { payout: params.payout }),
      }

      console.log("🔥 Creating PayWay Payment Link:", merchantAuthData)

      // Encrypt merchant_auth
      const merchantAuthJson = JSON.stringify(merchantAuthData)
      const merchantAuth = opensslEncryption(merchantAuthJson, PAYWAY_CONFIG.rsa_public_key)

      // Generate hash
      const hash = generateHash(requestTime, PAYWAY_CONFIG.merchant_id, merchantAuth, PAYWAY_CONFIG.api_key)

      // Prepare form data
      const formData = new FormData()
      formData.append("request_time", requestTime)
      formData.append("merchant_id", PAYWAY_CONFIG.merchant_id)
      formData.append("merchant_auth", merchantAuth)
      formData.append("hash", hash)

      // Make API request
      const response = await fetch(PAYWAY_CONFIG.api_url, {
        method: "POST",
        body: formData,
      })

      const responseText = await response.text()
      console.log("🔥 PayWay API Response:", responseText)

      let result: PayWayResponse
      try {
        result = JSON.parse(responseText)
      } catch (e) {
        throw new Error(`Invalid JSON response: ${responseText}`)
      }

      if (response.ok && result.status?.code === "00") {
        const paymentLinkUrl = result.data!.payment_link.startsWith("http")
          ? result.data!.payment_link
          : `https://${result.data!.payment_link}`

        return {
          success: true,
          payment_link_id: result.data!.id,
          payment_link: paymentLinkUrl,
          title: result.data!.title,
          amount: result.data!.amount,
          currency: result.data!.currency,
          status: result.data!.status,
          merchant_ref_no: result.data!.merchant_ref_no,
          expired_date: result.data!.expired_date,
        }
      } else {
        throw new Error(`PayWay API Error: ${result.status?.message || "Unknown error"}`)
      }
    } catch (error) {
      console.error("🔥 PayWay Payment Link Creation Error:", error)
      throw error
    }
  },

  // Get payment link status
  async getPaymentLinkStatus(paymentLinkId: string) {
    try {
      const requestTime = getCurrentPayWayTime()

      const merchantAuthData = {
        mc_id: PAYWAY_CONFIG.merchant_id,
        id: paymentLinkId,
      }

      const merchantAuthJson = JSON.stringify(merchantAuthData)
      const merchantAuth = opensslEncryption(merchantAuthJson, PAYWAY_CONFIG.rsa_public_key)
      const hash = generateHash(requestTime, PAYWAY_CONFIG.merchant_id, merchantAuth, PAYWAY_CONFIG.api_key)

      const requestBody = {
        request_time: requestTime,
        merchant_id: PAYWAY_CONFIG.merchant_id,
        merchant_auth: merchantAuth,
        hash: hash,
      }

      const response = await fetch(PAYWAY_CONFIG.detail_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      const responseText = await response.text()
      let result: PayWayResponse

      try {
        result = JSON.parse(responseText)
      } catch (e) {
        throw new Error(`Invalid JSON response: ${responseText}`)
      }

      if (response.ok && result.status?.code === "00") {
        return {
          success: true,
          payment_link_id: result.data!.id,
          status: result.data!.status,
          total_amount: result.data!.total_amount,
          total_transactions: result.data!.total_trxn,
          status_message: result.status.message,
        }
      } else {
        return {
          success: false,
          error: result.status?.message || "Failed to get payment link status",
          status_message: result.status?.message,
        }
      }
    } catch (error) {
      console.error("🔥 PayWay Status Check Error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        status_message: "Failed to check payment status",
      }
    }
  },

  // Handle payment notification
  handlePaymentNotification(notification: PaymentNotification) {
    try {
      const { tran_id, status, merchant_ref_no } = notification

      console.log("🔥 Processing PayWay notification:", { tran_id, status, merchant_ref_no })

      // PayWay status codes
      const statusMessages: Record<string, string> = {
        "00": "Payment successful",
        "01": "Payment failed",
        "02": "Payment cancelled",
        "03": "Payment pending",
        "99": "Payment error",
      }

      const isSuccess = status === "00"
      const statusMessage = statusMessages[status] || `Unknown status: ${status}`

      return {
        success: isSuccess,
        status_code: status,
        status_message: statusMessage,
        transaction_id: tran_id,
        merchant_ref_no: merchant_ref_no,
      }
    } catch (error) {
      console.error("🔥 Notification processing error:", error)
      return {
        success: false,
        status_code: "ERROR",
        status_message: "Failed to process notification",
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  },
}
