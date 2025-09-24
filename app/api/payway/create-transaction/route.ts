/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from "next/server"
import { payway } from "@/lib/payway"

export async function POST(request: NextRequest) {
  console.log("=== PayWay Create Transaction API ===")

  try {
    const body = await request.json()
    const { orderId, amount, currency = "USD", customerInfo, paymentMethod, return_url } = body

    console.log("Request parameters:", {
      orderId,
      amount,
      currency,
      customerInfo,
      paymentMethod,
      return_url,
    })

    // Validate required fields
    if (!orderId || !amount || !customerInfo) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: orderId, amount, or customerInfo",
        },
        { status: 400 },
      )
    }

    // Validate customer info
    if (!customerInfo.name || !customerInfo.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Customer name and email are required",
        },
        { status: 400 },
      )
    }

    // Map payment method to PayWay payment_option
    const paymentOptionMap: Record<string, string> = {
      "aba-khqr": "abapay_khqr_deeplink", // Returns JSON with QR data
      "aba-deeplink": "abapay_khqr_deeplink", // Same as above
      card: "cards", // Returns HTML checkout form
      alipay: "alipay", // Returns HTML checkout form
      wechat: "wechat", // Returns HTML checkout form
      google_pay: "google_pay", // Returns HTML checkout form
    }

    const payment_option = paymentOptionMap[paymentMethod] || ""

    console.log("Creating PayWay order with payment option:", payment_option)
    console.log("Original payment method:", paymentMethod)

    // Create PayWay order using existing library
    const result = await payway.createOrder(
      Number(amount),
      orderId,
      {
        name: customerInfo.name,
        email: customerInfo.email,
        phone: customerInfo.phone || "",
      },
      payment_option,
    )

    console.log("PayWay order result:", result)

    if (result.success) {
      // Format response based on result type
      if (result.response_type === "json") {
        // QR payment methods (ABA KHQR) - return JSON data
        const response = {
          success: true,
          tran_id: result.transaction_ref,
          paymentType: "qr",
          qr_string: result.qr_string,
          abapay_deeplink: result.abapay_deeplink,
          checkout_qr_url: result.checkout_url,
          status: result.status,
        }
        return NextResponse.json(response)
      } else if (result.response_type === "html" && result.checkout_html) {
        // HTML payment methods (cards, alipay, wechat, google_pay) - store HTML and provide access URL
        try {
          // Store the HTML content using the store-html endpoint
          const storeResponse = await fetch(
            `${process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000"}/api/payway/store-html`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                tran_id: result.transaction_ref,
                html_content: result.checkout_html,
              }),
            },
          )

          if (!storeResponse.ok) {
            throw new Error("Failed to store PayWay HTML content")
          }

          // Return the checkout HTML URL instead of direct PayWay URL
          const checkoutUrl = `${process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000"}/api/payway/checkout-html?tran_id=${result.transaction_ref}`

          const response = {
            success: true,
            tran_id: result.transaction_ref,
            paymentType: "hosted",
            checkoutUrl: checkoutUrl,
            status: result.status,
          }
          return NextResponse.json(response)
        } catch (storeError) {
          console.error("Failed to store PayWay HTML:", storeError)
          return NextResponse.json(
            {
              success: false,
              error: "Failed to prepare PayWay checkout page",
            },
            { status: 500 },
          )
        }
      } else {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid PayWay response format",
          },
          { status: 500 },
        )
      }
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.status?.message || "Failed to create PayWay transaction",
          code: result.status?.code,
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("PayWay create transaction error:", error)

    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    const isRetryable = error instanceof Error && (error as any).retryable

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        retryable: isRetryable,
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "PayWay Create Transaction API",
    version: "1.0.0",
    description: "Creates PayWay payment transactions",
    supported_methods: ["POST"],
    required_fields: ["orderId", "amount", "customerInfo"],
    optional_fields: ["currency", "paymentMethod", "return_url"],
    supported_payment_methods: ["aba-khqr", "aba-deeplink", "card", "alipay", "wechat", "google_pay"],
  })
}
