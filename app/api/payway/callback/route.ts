import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { verifyPayWayPayment } from "@/lib/actions/order.actions"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
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

    // Handle different PayWay status values
    if (status === "completed" || status === "success" || status === "paid") {
      console.log("Payment successful, verifying order:", orderId)
      await verifyPayWayPayment(orderId, tran_id)
    } else if (status === "failed" || status === "cancelled") {
      console.log("Payment failed/cancelled:", { orderId, status })
      // Handle failed payment if needed
    }

    return NextResponse.json({ received: true, status: "ok" })
  } catch (error) {
    console.error("PayWay webhook processing error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
