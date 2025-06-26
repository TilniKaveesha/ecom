import { type NextRequest, NextResponse } from "next/server"
import { updateOrderToPaid } from "@/lib/actions/order.actions"

export async function POST(request: NextRequest) {
  try {
    const notification = await request.json()

    console.log("=== PayWay Payment Link Webhook ===")
    console.log("Notification received:", notification)

    // Validate the notification structure
    if (!notification.tran_id || !notification.status || !notification.merchant_ref_no) {
      console.error("❌ Invalid notification structure")
      return NextResponse.json({ error: "Invalid notification" }, { status: 400 })
    }

    const { tran_id, status, merchant_ref_no } = notification

    // Check if payment was successful
    if (status === "00") {
      console.log("✅ Payment successful!")
      console.log("Transaction ID:", tran_id)
      console.log("Merchant Reference:", merchant_ref_no)

      try {
        // Update order status using existing function
        // Assuming merchant_ref_no contains the order ID
        const updateResult = await updateOrderToPaid(merchant_ref_no)

        if (updateResult.success) {
          console.log("✅ Order updated successfully")
        } else {
          console.error("❌ Failed to update order:", updateResult.message)
        }
      } catch (dbError) {
        console.error("❌ Database update error:", dbError)
        // Still return success to PayWay to avoid retries
      }
    } else {
      console.log("❌ Payment failed or cancelled")
      console.log("Status code:", status)
    }

    // Always return success to PayWay to acknowledge receipt
    return NextResponse.json({
      received: true,
      tran_id,
      merchant_ref_no,
      processed_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Payment Link webhook error:", error)
    return NextResponse.json(
      {
        error: "Webhook processing failed",
        received: false,
      },
      { status: 500 },
    )
  }
}

// Handle GET requests (for webhook verification if needed)
export async function GET() {
  return NextResponse.json({
    message: "PayWay Payment Link Webhook Endpoint",
    status: "active",
  })
}
