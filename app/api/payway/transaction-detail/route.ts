import { type NextRequest, NextResponse } from "next/server"
import { payway } from "@/lib/payway"

export async function POST(request: NextRequest) {
  console.log("=== PayWay Transaction Detail API Endpoint ===")

  try {
    const body = await request.json()
    const { tran_id, transactionId } = body

    // Support both parameter names for flexibility
    const transactionIdToUse = tran_id || transactionId

    console.log("Getting transaction details for:", transactionIdToUse)

    if (!transactionIdToUse) {
      return NextResponse.json(
        {
          success: false,
          error: "Transaction ID is required (use 'tran_id' or 'transactionId')",
        },
        { status: 400 },
      )
    }

    // Get detailed transaction information from PayWay
    const result = await payway.getTransactionDetails(transactionIdToUse)

    console.log("PayWay transaction details result:", result)

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: {
          transaction_id: result.transaction_id,
          payment_status_code: result.payment_status_code,
          payment_status: result.payment_status,
          original_amount: result.original_amount,
          original_currency: result.original_currency,
          payment_amount: result.payment_amount,
          payment_currency: result.payment_currency,
          total_amount: result.total_amount,
          refund_amount: result.refund_amount,
          discount_amount: result.discount_amount,
          apv: result.apv,
          transaction_date: result.transaction_date,
          first_name: result.first_name,
          last_name: result.last_name,
          email: result.email,
          phone: result.phone,
          bank_ref: result.bank_ref,
          payment_type: result.payment_type,
          payer_account: result.payer_account,
          bank_name: result.bank_name,
          card_source: result.card_source,
          transaction_operations: result.transaction_operations,
        },
        status: {
          code: result.status,
          message: result.message,
          tran_id: result.transaction_id,
        },
        raw_response: result.raw_response,
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.message || "Failed to get transaction details",
        status: {
          code: result.status,
          message: result.message,
          tran_id: transactionIdToUse,
        },
      })
    }
  } catch (error) {
    console.error("PayWay transaction detail API error:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        status: {
          code: "ERROR",
          message: "Internal server error",
        },
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "PayWay Transaction Detail API",
    version: "1.0.0",
    description:
      "Retrieves comprehensive transaction details including payment status, amounts, payer info, and transaction history",
    supported_methods: ["POST"],
    required_fields: ["tran_id or transactionId"],
    rate_limit: "10 requests per minute",
    payment_status_codes: {
      0: "APPROVED - Payment completed successfully or captured",
      2: "PENDING - Awaiting completion from payer",
      3: "DECLINED - Payment was declined",
      4: "REFUNDED - Payment has been refunded fully or partially",
      7: "CANCELLED - Transaction or pre-authorization was cancelled",
    },
    example_request: {
      tran_id: "trx-201019130949",
    },
  })
}
