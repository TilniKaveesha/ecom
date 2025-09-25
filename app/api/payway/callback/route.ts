import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { verifyPayWayPayment } from "@/lib/actions/order.actions"
import { type PayWayCallbackResponse, PayWayStatus } from "@/lib/payway-response-types"
import { Convert } from "@/lib/payway-header-types"

export async function POST(request: NextRequest) {
  try {
    try {
      const requestHeaders: Record<string, string> = {}
      request.headers.forEach((value, key) => {
        requestHeaders[key] = value
      })

      if (requestHeaders["content-type"]) {
        const headerValidation = Convert.toPayWayHeaders(
          JSON.stringify({
            "Content-Type": requestHeaders["content-type"],
          }),
        )
        console.log("✅ PayWay callback headers validated:", headerValidation)
      }
    } catch (headerError) {
      console.warn("⚠️ PayWay callback header validation failed:", headerError)
      // Continue processing - header validation is not critical for webhook functionality
    }

    const body: PayWayCallbackResponse = await request.json()
    console.log("PayWay Callback received:", body)

    // PayWay typically sends signature in headers or body
    const signature = request.headers.get("x-payway-signature") || body.signature

    if (signature && process.env.PAYWAY_API_KEY) {
      // Verify webhook signature (adjust based on PayWay's documentation)
      const expectedSignature = crypto
        .createHmac("sha256", process.env.PAYWAY_API_KEY)
        .update(JSON.stringify(body))
        .digest("hex")

      if (signature !== expectedSignature) {
        console.error("Invalid webhook signature")
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { tran_id, status, hash, custom_fields } = body

    // Parse custom fields to get order ID
    let orderId = null
    if (custom_fields) {
      try {
        const decoded = Buffer.from(custom_fields, "base64").toString("utf-8")
        const customData = JSON.parse(decoded)
        orderId = customData.order_id
      } catch (error) {
        console.error("Error parsing custom_fields:", error)
      }
    }

    if (!orderId || !tran_id) {
      console.error("Missing required fields:", { orderId, tran_id })
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (
      body.status === PayWayStatus.COMPLETED ||
      body.status === PayWayStatus.SUCCESS ||
      body.status === PayWayStatus.PAID
    ) {
      console.log("Payment successful, verifying order:", orderId)
      await verifyPayWayPayment(orderId, tran_id)
    } else if (body.status === PayWayStatus.FAILED || body.status === PayWayStatus.CANCELLED) {
      console.log("Payment failed/cancelled:", { orderId, status: body.status })
      // Handle failed payment if needed
    }

    return NextResponse.json({ received: true, status: "ok" })
  } catch (error) {
    console.error("PayWay webhook processing error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
