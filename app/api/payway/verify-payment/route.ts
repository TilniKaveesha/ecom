import { type NextRequest, NextResponse } from "next/server"
import { payway } from "@/lib/payway"

export async function POST(request: NextRequest) {
  console.log("=== PayWay Verify Payment API ===")

  try {
    const body = await request.json()
    const { transactionId } = body

    console.log("Verifying payment for transaction:", transactionId)

    if (!transactionId) {
      return NextResponse.json(
        {
          success: false,
          error: "Transaction ID is required",
        },
        { status: 400 },
      )
    }

    const result = await payway.getTransactionDetails(transactionId)

    console.log("PayWay transaction details:", result)

    if (result.success) {
      // Map PayWay payment status to our expected format
      let status = "PENDING"

      switch (result.payment_status) {
        case "APPROVED":
        case "PRE-AUTH":
          status = "PAID"
          break
        case "PENDING":
          status = "PENDING"
          break
        case "DECLINED":
        case "CANCELLED":
          status = "FAILED"
          break
        case "REFUNDED":
          status = "REFUNDED"
          break
        default:
          status = "PENDING"
      }

      return NextResponse.json({
        success: true,
        status: status,
        transactionId: result.transaction_id,
        payment_status: result.payment_status,
        payment_status_code: result.payment_status_code,
        amount: result.payment_amount || result.total_amount,
        currency: result.payment_currency || result.original_currency,
        email: result.email,
        first_name: result.first_name,
        last_name: result.last_name,
        phone: result.phone,
        payment_type: result.payment_type,
        bank_ref: result.bank_ref,
        transaction_date: result.transaction_date,
        message: result.message,
        payway_status: result.status,
        detailed_info: {
          original_amount: result.original_amount,
          refund_amount: result.refund_amount,
          discount_amount: result.discount_amount,
          apv: result.apv,
          payer_account: result.payer_account,
          bank_name: result.bank_name,
          transaction_operations: result.transaction_operations,
        },
      })
    } else {
      return NextResponse.json({
        success: false,
        status: "FAILED",
        error: result.message || "Payment verification failed",
        payway_status: result.status,
      })
    }
  } catch (error) {
    console.error("PayWay verify payment error:", error)

    return NextResponse.json(
      {
        success: false,
        status: "ERROR",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "PayWay Verify Payment API",
    version: "1.0.0",
    description: "Verifies PayWay payment status",
    supported_methods: ["POST"],
    required_fields: ["transactionId"],
    possible_statuses: ["PAID", "PENDING", "FAILED", "ERROR", "REFUNDED"],
  })
}
