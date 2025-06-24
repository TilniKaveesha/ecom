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
    const { orderId, amount, customerInfo } = body

    // Validate required fields
    if (!orderId || !amount || !customerInfo.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: orderId, amount, and customerInfo.email are required",
        },
        { status: 400 },
      )
    }

    // Validate amount
    if (amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Amount must be greater than 0",
        },
        { status: 400 },
      )
    }

    console.log("Creating PayWay checkout for:", {
      orderId,
      amount,
      customerInfo: {
        name: customerInfo.name,
        email: customerInfo.email,
        phone: customerInfo.phone || "N/A",
      },
    })

    // Create PayWay checkout session
    const paywayResponse = await payway.createOrder(amount, orderId, customerInfo)

    if (paywayResponse.success) {
      return NextResponse.json({
        success: true,
        checkoutHtml: paywayResponse.checkout_html,
        checkoutUrl: paywayResponse.checkout_url,
        transactionRef: paywayResponse.transaction_ref,
        qrString: paywayResponse.qr_string,
        abapayDeeplink: paywayResponse.abapay_deeplink,
      })
    } else {
      throw new Error("Failed to create PayWay checkout session")
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
