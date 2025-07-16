import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { PaymentLink } from "@/lib/db/models/payment-link.model"
import { connectToDatabase } from "@/lib/db"

// PayWay Payment Link Configuration
const PAYWAY_CONFIG = {
  merchant_id: process.env.PAYWAY_MERCHANT_ID || "ec461012",
  api_key: process.env.PAYWAY_API_KEY || "940db74c4ecc68e7091a0609d16e5f9bf65f00be",
  rsa_public_key:
    process.env.PAYWAY_RSA_PUBLIC_KEY ||
    `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCu50Nz90osUnYjye+bjKKHBkx4
MibRRJ7Ft7EDb8JdkmCWSqcvexOpnEBuLHHpT1tnicZvuLllU1FarXues297fmO7
4ETnjY1RcSKXwYRl046RbJQyPa7/mffqKfNsyGHEBQhKmae8NRq7TMlt69oNgduk
AbvOAHDlN/5zk3D7zwIDAQAB
-----END PUBLIC KEY-----`,
  api_url: "https://checkout-sandbox.payway.com.kh/api/merchant-portal/merchant-access/payment-link/create",
}

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 10
const RATE_LIMIT_WINDOW = 60 * 1000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const key = `rate_limit_${ip}`
  const current = rateLimitStore.get(key)

  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (current.count >= RATE_LIMIT) {
    return false
  }

  current.count++
  return true
}

// OpenSSL encryption function matching PayWay PHP implementation
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
      console.error("🔥 RSA Encryption error:", error)
      throw new Error("Failed to encrypt data with RSA public key")
    }

    sourceData = sourceData.substring(maxlength)
  }

  return Buffer.from(output, "binary").toString("base64")
}

// Generate current time in PayWay format (YYYYMMDDHHmmss)
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

export async function POST(request: NextRequest) {
  console.log("🔥 === PayWay Payment Link API - Create Request ===")

  try {
    // Rate limiting
    const forwarded = request.headers.get("x-forwarded-for")
    const realIp = request.headers.get("x-real-ip")
    const ip = forwarded?.split(",")[0] || realIp || "unknown"

    if (!checkRateLimit(ip)) {
      console.warn("🔥 Rate limit exceeded for IP:", ip)
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 })
    }

    // Parse form data
    const formData = await request.formData()

    // Extract parameters
    const title = formData.get("title") as string
    const amountStr = formData.get("amount") as string
    const currency = formData.get("currency") as "USD" | "KHR"
    const description = formData.get("description") as string
    const paymentLimitStr = formData.get("paymentLimit") as string
    const expiredDateStr = formData.get("expiredDate") as string
    const returnUrl = formData.get("returnUrl") as string
    const merchantRefNo = formData.get("merchantRefNo") as string

    console.log("🔥 Request Parameters:", {
      title,
      amount: amountStr,
      currency,
      merchantRefNo,
      returnUrl,
    })

    // Validate required fields
    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    if (!amountStr || isNaN(Number(amountStr))) {
      return NextResponse.json({ error: "Valid amount is required" }, { status: 400 })
    }

    const amount = Number.parseFloat(amountStr)
    if (amount <= 0) {
      return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 })
    }

    if (!currency || !["USD", "KHR"].includes(currency)) {
      return NextResponse.json({ error: "Currency must be USD or KHR" }, { status: 400 })
    }

    if (!expiredDateStr || isNaN(Number(expiredDateStr))) {
      return NextResponse.json({ error: "Valid expiration date is required" }, { status: 400 })
    }

    const expiredDate = Number.parseInt(expiredDateStr)
    if (expiredDate <= Math.floor(Date.now() / 1000)) {
      return NextResponse.json({ error: "Expiration date must be in the future" }, { status: 400 })
    }

    if (!returnUrl?.trim()) {
      return NextResponse.json({ error: "Return URL is required" }, { status: 400 })
    }

    const paymentLimit = paymentLimitStr ? Number.parseInt(paymentLimitStr) : 1

    console.log("🔥 Validation passed, preparing PayWay request...")

    // Generate request time and unique link ID
    const requestTime = getCurrentPayWayTime()
    const linkId = merchantRefNo || `pl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Prepare merchant_auth data
    const merchantAuthData = {
      mc_id: PAYWAY_CONFIG.merchant_id,
      title: title.trim(),
      amount: amount,
      currency: currency,
      description: description?.trim() || "Payment via PayWay Link",
      payment_limit: paymentLimit,
      expired_date: expiredDate,
      return_url: Buffer.from(returnUrl.trim()).toString("base64"),
      merchant_ref_no: linkId,
    }

    console.log("🔥 Creating PayWay Payment Link with data:", {
      merchant_id: PAYWAY_CONFIG.merchant_id,
      request_time: requestTime,
      merchant_auth_data: merchantAuthData,
    })

    // Encrypt merchant_auth using RSA public key
    const merchantAuthJson = JSON.stringify(merchantAuthData)
    const merchantAuth = opensslEncryption(merchantAuthJson, PAYWAY_CONFIG.rsa_public_key)

    // Generate hash for authentication
    const hash = generateHash(requestTime, PAYWAY_CONFIG.merchant_id, merchantAuth, PAYWAY_CONFIG.api_key)

    // Prepare form data for PayWay API
    const paywayFormData = new FormData()
    paywayFormData.append("request_time", requestTime)
    paywayFormData.append("merchant_id", PAYWAY_CONFIG.merchant_id)
    paywayFormData.append("merchant_auth", merchantAuth)
    paywayFormData.append("hash", hash)

    console.log("🔥 Sending request to PayWay Payment Link API:", {
      request_time: requestTime,
      merchant_id: PAYWAY_CONFIG.merchant_id,
      merchant_auth_length: merchantAuth.length,
      hash_preview: hash.substring(0, 20) + "...",
    })

    // Make request to PayWay Payment Link API
    const response = await fetch(PAYWAY_CONFIG.api_url, {
      method: "POST",
      body: paywayFormData,
    })

    const responseText = await response.text()
    console.log("🔥 PayWay API Response Status:", response.status)
    console.log("🔥 PayWay API Response:", responseText)

    let result
    try {
      result = JSON.parse(responseText)
    } catch (e) {
      console.error("🔥 Failed to parse PayWay response as JSON:", e)
      return NextResponse.json(
        {
          success: false,
          error: "Invalid response from PayWay API",
          raw_response: responseText,
        },
        { status: 500 },
      )
    }

    if (response.ok && result.status?.code === "00") {
      // Fix payment link URL format
      const paymentLinkUrl = result.data.payment_link.startsWith("http")
        ? result.data.payment_link
        : `https://${result.data.payment_link}`

      console.log("🔥 ✅ Payment Link Created Successfully:", paymentLinkUrl)

      // Save to database (non-blocking)
      try {
        await connectToDatabase()

        const customerInfo = {
          name: description?.split(" - ")[1] || "",
          email: "",
          phone: "",
        }

        const paymentLinkRecord = new PaymentLink({
          orderId: linkId,
          paymentLink: paymentLinkUrl,
          paymentLinkId: result.data.id,
          amount,
          currency,
          status: "pending",
          customerInfo,
          expiresAt: new Date(expiredDate * 1000),
        })

        await paymentLinkRecord.save()
        console.log("🔥 Payment link saved to database")
      } catch (dbError) {
        console.error("🔥 Database save failed (non-critical):", dbError)
      }

      // Return success response in the format expected by frontend
      const successResponse = {
        success: true,
        message: "Payment link created successfully",
        payment_link: paymentLinkUrl,
        payment_link_id: result.data.id,
        data: result.data,
        status: result.status,
      }

      console.log("🔥 🎉 Final Success Response:", successResponse)
      return NextResponse.json(successResponse)
    } else {
      console.error("🔥 ❌ PayWay API Error:", result)
      return NextResponse.json(
        {
          success: false,
          error: "PayWay Payment Link API Error",
          error_code: result.status?.code,
          error_message: result.status?.message,
          response: result,
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("🔥 ❌ Payment link creation error:", error)

    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes("RSA")) {
        return NextResponse.json(
          { error: "Payment service encryption error. Please contact support." },
          { status: 500 },
        )
      }

      if (error.message.includes("ENOTFOUND") || error.message.includes("network")) {
        return NextResponse.json(
          { error: "Payment service temporarily unavailable. Please try again later." },
          { status: 503 },
        )
      }

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred while creating the payment link",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "PayWay Payment Link Creation API",
    version: "2.0.0",
    config: {
      merchant_id: PAYWAY_CONFIG.merchant_id,
      api_url: PAYWAY_CONFIG.api_url,
      has_credentials: !!(PAYWAY_CONFIG.merchant_id && PAYWAY_CONFIG.api_key && PAYWAY_CONFIG.rsa_public_key),
    },
    endpoints: {
      POST: {
        description: "Create a new payment link",
        required_fields: ["title", "amount", "currency", "expiredDate", "returnUrl"],
        optional_fields: ["description", "paymentLimit", "merchantRefNo"],
        supported_currencies: ["USD", "KHR"],
      },
    },
    rate_limit: {
      requests_per_minute: RATE_LIMIT,
      window_ms: RATE_LIMIT_WINDOW,
    },
  })
}
