import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { verifyPayWayPayment } from "@/lib/actions/order.actions"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Verify webhook signature
    const signature = request.headers.get("x-payway-signature")
    const expectedSignature = crypto
      .createHmac("sha256", process.env.PAYWAY_API_KEY!)
      .update(JSON.stringify(body))
      .digest("hex")

    if (signature !== expectedSignature) {
      console.error("Invalid webhook signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const { transaction_ref, status, metadata } = body
    const orderId = metadata?.order_id

    if (!orderId || !transaction_ref) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (status === "completed") {
      await verifyPayWayPayment(orderId, transaction_ref)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook processing error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
