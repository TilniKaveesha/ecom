import { type NextRequest, NextResponse } from "next/server"
import { updateOrderToPaid } from "@/lib/actions/order.actions"
import { paywayPaymentLinks } from "@/lib/payway-payment-links"
import { PaymentLink } from "@/lib/db/models/payment-link.model"
import { connectToDatabase } from "@/lib/db"
import crypto from "crypto"

// Webhook signature verification
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  try {
    const expectedSignature = crypto.createHmac("sha256", secret).update(payload).digest("hex")
    return crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expectedSignature, "hex"))
  } catch {
    return false
  }
}

// Rate limiting for webhooks
const webhookRateLimit = new Map<string, { count: number; resetTime: number }>()
const WEBHOOK_RATE_LIMIT = 100
const WEBHOOK_RATE_LIMIT_WINDOW = 60 * 1000

function checkWebhookRateLimit(ip: string): boolean {
  const now = Date.now()
  const key = `webhook_rate_limit_${ip}`
  const current = webhookRateLimit.get(key)

  if (!current || now > current.resetTime) {
    webhookRateLimit.set(key, { count: 1, resetTime: now + WEBHOOK_RATE_LIMIT_WINDOW })
    return true
  }

  if (current.count >= WEBHOOK_RATE_LIMIT) {
    return false
  }

  current.count++
  return true
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const realIP = request.headers.get("x-real-ip")
  const cfConnectingIP = request.headers.get("cf-connecting-ip")

  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }
  if (realIP) {
    return realIP
  }
  if (cfConnectingIP) {
    return cfConnectingIP
  }

  return "unknown"
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log("=== PayWay Payment Link Webhook ===")
  console.log("Timestamp:", new Date().toISOString())

  try {
    // Rate limiting - get IP from headers
    const ip = getClientIP(request)

    if (!checkWebhookRateLimit(ip)) {
      console.warn(`Webhook rate limit exceeded for IP: ${ip}`)
      return NextResponse.json({ error: "Too many webhook requests" }, { status: 429 })
    }

    // Get request body
    const body = await request.text()
    console.log("Raw webhook body:", body)

    // Parse JSON
    let notification: Record<string, string | number>
    try {
      notification = JSON.parse(body)
    } catch (parseError) {
      console.error("❌ Invalid JSON in webhook:", parseError)
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
    }

    console.log("Parsed notification:", JSON.stringify(notification, null, 2))

    // Validate webhook signature if available
    const signature = request.headers.get("x-payway-signature")
    if (signature && process.env.PAYWAY_WEBHOOK_SECRET) {
      if (!verifyWebhookSignature(body, signature, process.env.PAYWAY_WEBHOOK_SECRET)) {
        console.error("❌ Invalid webhook signature")
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
      console.log("✅ Webhook signature verified")
    }

    // Validate the notification structure
    if (!notification.tran_id || !notification.status || !notification.merchant_ref_no) {
      console.error("❌ Invalid notification structure")
      console.error("Missing fields:", {
        tran_id: !notification.tran_id,
        status: !notification.status,
        merchant_ref_no: !notification.merchant_ref_no,
      })
      return NextResponse.json({ error: "Invalid notification structure" }, { status: 400 })
    }

    // Process the notification using the payment links handler
    let processResult
    try {
      processResult = paywayPaymentLinks.handlePaymentNotification({
        tran_id: notification.tran_id.toString(),
        status: notification.status.toString(),
        merchant_ref_no: notification.merchant_ref_no.toString(),
        amount: notification.amount?.toString(),
        currency: notification.currency?.toString(),
      })
      console.log("✅ Notification processed:", processResult)
    } catch (handlerError) {
      console.error("❌ Error processing notification:", handlerError)
      return NextResponse.json({ error: "Failed to process notification" }, { status: 400 })
    }

    const { tran_id, status, merchant_ref_no, amount, currency } = notification

    // Log payment details
    console.log("=== Payment Details ===")
    console.log("Transaction ID:", tran_id)
    console.log("Status:", status)
    console.log("Status Message:", processResult.status_message)
    console.log("Merchant Reference:", merchant_ref_no)
    console.log("Amount:", amount)
    console.log("Currency:", currency)

    // Update payment link status in database
    try {
      await connectToDatabase()

      const paymentLink = await PaymentLink.findOne({
        $or: [{ orderId: merchant_ref_no }, { paymentLinkId: merchant_ref_no }],
      })

      if (paymentLink) {
        paymentLink.status = processResult.success ? "paid" : "failed"
        if (processResult.success) {
          paymentLink.paidAt = new Date()
        }
        paymentLink.webhookData = notification
        await paymentLink.save()
        console.log("✅ Payment link status updated in database")
      }
    } catch (dbError) {
      console.error("❌ Database update error:", dbError)
    }

    // Check if payment was successful
    if (processResult.success && status === "00") {
      console.log("✅ Payment successful - updating order")

      try {
        // Update order status using existing function
        const updateResult = await updateOrderToPaid(merchant_ref_no.toString())

        if (updateResult.success) {
          console.log("✅ Order updated successfully")
          console.log("Processing time:", Date.now() - startTime, "ms")

          return NextResponse.json({
            received: true,
            processed: true,
            tran_id,
            merchant_ref_no,
            status: "success",
            message: "Payment processed and order updated",
            processed_at: new Date().toISOString(),
            processing_time_ms: Date.now() - startTime,
          })
        } else {
          console.error("❌ Failed to update order:", updateResult.message)

          return NextResponse.json({
            received: true,
            processed: false,
            tran_id,
            merchant_ref_no,
            status: "received_but_not_processed",
            message: "Payment received but order update failed",
            error: updateResult.message,
            processed_at: new Date().toISOString(),
          })
        }
      } catch (dbError) {
        console.error("❌ Database update error:", dbError)

        return NextResponse.json({
          received: true,
          processed: false,
          tran_id,
          merchant_ref_no,
          status: "received_but_db_error",
          message: "Payment received but database error occurred",
          error: dbError instanceof Error ? dbError.message : "Unknown database error",
          processed_at: new Date().toISOString(),
        })
      }
    } else {
      console.log("❌ Payment failed, cancelled, or pending")
      console.log("Status code:", status)
      console.log("Status message:", processResult.status_message)

      return NextResponse.json({
        received: true,
        processed: true,
        tran_id,
        merchant_ref_no,
        status: "payment_not_successful",
        message: processResult.status_message,
        processed_at: new Date().toISOString(),
      })
    }
  } catch (error) {
    console.error("❌ Payment Link webhook error:", error)

    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace")
    console.error("Processing time:", Date.now() - startTime, "ms")

    return NextResponse.json(
      {
        received: false,
        processed: false,
        error: "Webhook processing failed",
        message: error instanceof Error ? error.message : "Unknown error",
        processed_at: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "PayWay Payment Link Webhook Endpoint",
    status: "active",
    version: "2.0.0",
    supported_methods: ["POST"],
    webhook_info: {
      description: "Handles PayWay payment link notifications",
      expected_fields: ["tran_id", "status", "merchant_ref_no"],
      success_status: "00",
      rate_limit: {
        requests_per_minute: WEBHOOK_RATE_LIMIT,
        window_ms: WEBHOOK_RATE_LIMIT_WINDOW,
      },
    },
    timestamp: new Date().toISOString(),
  })
}
