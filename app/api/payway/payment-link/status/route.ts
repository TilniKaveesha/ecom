import { type NextRequest, NextResponse } from "next/server"
import { paywayPaymentLinks } from "@/lib/payway-payment-links"
import { PaymentLink } from "@/lib/db/models/payment-link.model"
import { connectToDatabase } from "@/lib/db"
import type { Document } from "mongoose"

interface PaymentLinkDocument extends Document {
  _id: string
  orderId: string
  paymentLink: string
  paymentLinkId: string
  amount: number
  currency: string
  status: string
  customerInfo?: {
    name?: string
    email?: string
    phone?: string
  }
  createdAt: Date
  expiresAt?: Date
  paidAt?: Date
}

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 Payment Link Status Check API called")

    const body = await request.json()
    const { paymentLinkId, orderId } = body

    if (!paymentLinkId && !orderId) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment link ID or order ID is required",
        },
        { status: 400 },
      )
    }

    console.log("🔍 Checking status for:", { paymentLinkId, orderId })

    // First check our database
    let dbPaymentLink: PaymentLinkDocument | null = null
    if (orderId || paymentLinkId) {
      try {
        await connectToDatabase()

        const query: Record<string, string> = {}
        if (orderId) query.orderId = orderId
        if (paymentLinkId) query.paymentLinkId = paymentLinkId

        dbPaymentLink = await PaymentLink.findOne(query).lean<PaymentLinkDocument>()
        console.log("🔍 Database payment link:", dbPaymentLink ? "Found" : "Not found")
      } catch (dbError) {
        console.error("🔍 Database query error:", dbError)
      }
    }

    // Check status with PayWay if we have a payment link ID
    let paywayStatus = null
    if (paymentLinkId || dbPaymentLink?.paymentLinkId) {
      const linkIdToCheck = paymentLinkId || dbPaymentLink?.paymentLinkId
      console.log("🔍 Checking PayWay status for link ID:", linkIdToCheck)

      paywayStatus = await paywayPaymentLinks.getPaymentLinkStatus(linkIdToCheck)
      console.log("🔍 PayWay status response:", paywayStatus)
    }

    // Update database if PayWay status is different
    if (dbPaymentLink && paywayStatus?.success && paywayStatus.status) {
      try {
        const currentStatus = dbPaymentLink.status
        const newStatus = paywayStatus.status.toLowerCase()

        if (currentStatus !== newStatus) {
          await PaymentLink.findByIdAndUpdate(dbPaymentLink._id, {
            status: newStatus,
            updatedAt: new Date(),
            ...(newStatus === "paid" && !dbPaymentLink.paidAt && { paidAt: new Date() }),
          })
          console.log("🔍 Updated payment link status from", currentStatus, "to", newStatus)
        }
      } catch (updateError) {
        console.error("🔍 Failed to update payment link status:", updateError)
      }
    }

    // Prepare response
    const response = {
      success: true,
      database: dbPaymentLink
        ? {
            id: dbPaymentLink._id.toString(),
            orderId: dbPaymentLink.orderId,
            paymentLinkId: dbPaymentLink.paymentLinkId,
            paymentLink: dbPaymentLink.paymentLink,
            amount: dbPaymentLink.amount,
            currency: dbPaymentLink.currency,
            status: dbPaymentLink.status,
            createdAt: dbPaymentLink.createdAt,
            expiresAt: dbPaymentLink.expiresAt,
            paidAt: dbPaymentLink.paidAt,
          }
        : null,
      payway: paywayStatus?.success
        ? {
            status: paywayStatus.status,
            status_message: paywayStatus.status_message,
            payment_link_id: paywayStatus.payment_link_id,
            total_amount: paywayStatus.total_amount,
            total_transactions: paywayStatus.total_transactions,
          }
        : null,
      combined_status: paywayStatus?.status || dbPaymentLink?.status || "unknown",
      is_paid: (paywayStatus?.status === "PAID" || dbPaymentLink?.status === "paid") ?? false,
    }

    console.log("🔍 Final response:", response)
    return NextResponse.json(response)
  } catch (error) {
    console.error("🔍 Payment status check error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check payment status",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const paymentLinkId = searchParams.get("paymentLinkId")
  const orderId = searchParams.get("orderId")

  if (!paymentLinkId && !orderId) {
    return NextResponse.json(
      {
        success: false,
        error: "Payment link ID or order ID is required",
      },
      { status: 400 },
    )
  }

  // Convert GET to POST request internally
  const mockRequest = {
    json: async () => ({ paymentLinkId, orderId }),
  } as NextRequest

  return POST(mockRequest)
}
