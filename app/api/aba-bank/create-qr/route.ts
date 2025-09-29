import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

// ABA Bank QR API Configuration
const ABA_CONFIG = {
  merchant_id: process.env.ABA_MERCHANT_ID || "keng.dara.online",
  api_key: process.env.ABA_API_KEY || "5b614bf17453092a752c8d91e5fa0866ef090775",
  api_url: "https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/generate-qr",
}

// Generate current time in ABA format (YYYYMMDDHHmmss)
function getCurrentABATime(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  const hours = String(now.getHours()).padStart(2, "0")
  const minutes = String(now.getMinutes()).padStart(2, "0")
  const seconds = String(now.getSeconds()).padStart(2, "0")

  return `${year}${month}${day}${hours}${minutes}${seconds}`
}

export async function POST(request: NextRequest) {
  console.log("=== ABA Bank QR API ===")

  try {
    const body = await request.json()
    const { orderId, amount, currency = "USD", customerInfo, paymentMethod } = body

    console.log("ABA QR Request parameters:", {
      orderId,
      amount,
      currency,
      customerInfo,
      paymentMethod,
    })

    // Validate required fields
    if (!orderId || !amount || !customerInfo) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: orderId, amount, or customerInfo",
        },
        { status: 400 },
      )
    }

    // Generate required parameters for ABA Bank API
    const req_time = getCurrentABATime()
    const merchant_id = ABA_CONFIG.merchant_id
    const tran_id = `qr-${Date.now().toString().slice(-10)}`

    // Customer info formatting
    const nameParts = customerInfo.name.trim().split(" ")
    const first_name = nameParts[0]?.substring(0, 20) || ""
    const last_name = nameParts.slice(1).join(" ").substring(0, 20) || ""
    const email = customerInfo.email.substring(0, 50)
    const phone = customerInfo.phone?.replace(/[^\d]/g, "").substring(0, 20) || ""

    // Items - base64 encoded JSON
    const items = Buffer.from(
      JSON.stringify([
        {
          name: `Order ${orderId}`,
          quantity: 1,
          price: Number.parseFloat(amount.toString()),
        },
      ]),
    ).toString("base64")

    // Map payment methods to ABA payment options
    const paymentOptionMap: Record<string, string> = {
      abapay_khqr: "abapay_khqr",
      wechat: "wechat",
      alipay: "alipay",
    }

    const payment_option = paymentOptionMap[paymentMethod] || "abapay_khqr"
    const purchase_type = "purchase"
    const lifetime = 6 // 6 minutes
    const qr_image_template = "template3_color"

    // Callback URL - base64 encoded
    const callback_url = Buffer.from(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/aba-bank/callback`).toString("base64")

    const hashString = [
      req_time,
      merchant_id,
      tran_id,
      amount,
      items,
      first_name,
      last_name,
      email,
      phone,
      purchase_type,
      payment_option,
      callback_url,
      "", // return_deeplink
      currency,
      "", // custom_fields
      "", // return_params
      "", // payout
      lifetime,
      qr_image_template,
    ].join("")

    const hash = crypto.createHmac("sha512", ABA_CONFIG.api_key).update(hashString).digest("base64")

    console.log("Creating ABA QR with parameters:", {
      req_time,
      merchant_id,
      tran_id,
      payment_option,
      amount,
      currency,
      hashString: hashString.substring(0, 100) + "...", // Log first 100 chars for debugging
    })

    // Prepare request data
    const requestData = {
      req_time,
      merchant_id,
      tran_id,
      first_name,
      last_name,
      email,
      phone,
      amount: Number.parseFloat(amount.toString()),
      purchase_type,
      payment_option,
      items,
      currency,
      callback_url,
      return_deeplink: null,
      custom_fields: null,
      return_params: null,
      payout: null,
      lifetime,
      qr_image_template,
      hash,
    }

    console.log("ABA API Request Data:", {
      ...requestData,
      hash: hash.substring(0, 20) + "...", // Only log first 20 chars of hash
    })

    // Make request to ABA Bank API
    const response = await fetch(ABA_CONFIG.api_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    })

    console.log("ABA API Response Status:", response.status)
    console.log("ABA API Response Headers:", Object.fromEntries(response.headers.entries()))

    const responseText = await response.text()
    console.log("ABA API Raw Response:", responseText.substring(0, 500))

    if (response.ok) {
      try {
        const result = JSON.parse(responseText)
        console.log("ABA API Parsed Response:", result)

        if (result.status?.code === "0") {
          // Success response
          return NextResponse.json({
            success: true,
            response_type: "qr",
            transaction_ref: tran_id,
            qr_string: result.qrString,
            qr_image: result.qrImage,
            abapay_deeplink: result.abapay_deeplink,
            app_store: result.app_store,
            play_store: result.play_store,
            amount: result.amount,
            currency: result.currency,
            status: {
              code: result.status.code,
              message: result.status.message,
              trace_id: result.status.trace_id,
            },
          })
        } else {
          // Error response from ABA
          return NextResponse.json(
            {
              success: false,
              error: result.status?.message || "ABA Bank API error",
              code: result.status?.code,
              trace_id: result.status?.trace_id,
            },
            { status: 400 },
          )
        }
      } catch (parseError) {
        console.error("Failed to parse ABA API response as JSON:", parseError)
        return NextResponse.json(
          {
            success: false,
            error: "Invalid response format from ABA Bank API",
            details: responseText.substring(0, 200),
          },
          { status: 500 },
        )
      }
    } else {
      console.error("ABA API Error Response:", responseText)

      return NextResponse.json(
        {
          success: false,
          error: `ABA Bank API request failed (${response.status})`,
          details: responseText.substring(0, 200),
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("ABA QR creation error:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "ABA Bank QR API",
    version: "1.0.0",
    description: "Creates QR payments using ABA Bank API",
    supported_methods: ["POST"],
    supported_payment_options: ["abapay_khqr", "wechat", "alipay"],
    config: {
      merchant_id: ABA_CONFIG.merchant_id,
      api_url: ABA_CONFIG.api_url,
      has_credentials: !!(ABA_CONFIG.merchant_id && ABA_CONFIG.api_key),
    },
  })
}
