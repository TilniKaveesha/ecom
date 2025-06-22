import { type NextRequest, NextResponse } from "next/server"
import { payway } from "@/lib/payway"

interface CheckoutRequest {
  orderId: string
  amount: number
  currency: string
  customerInfo: {
    name: string
    email: string
    phone: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutRequest = await request.json()
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { orderId, amount, currency, customerInfo } = body

    // Validate required fields
    if (!orderId || !amount || !customerInfo.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
        },
        { status: 400 },
      )
    }

    // Create PayWay checkout session
    const paywayResponse = await payway.createOrder(amount, orderId, customerInfo)

    if (paywayResponse.success) {
      return NextResponse.json({
        success: true,
        checkoutHtml: paywayResponse.checkout_html,
        transactionRef: paywayResponse.transaction_ref,
      })
    } else {
      throw new Error("Failed to create checkout session")
    }
  } catch (error) {
    console.error("PayWay checkout creation error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    )
  }
}
