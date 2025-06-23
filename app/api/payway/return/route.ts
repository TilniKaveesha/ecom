import { type NextRequest, NextResponse } from "next/server"
import { verifyPayWayPayment } from "@/lib/actions/order.actions"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const orderId = searchParams.get("order_id") || searchParams.get("return_params")
  const transactionRef = searchParams.get("tran_id") || searchParams.get("transaction_ref")
  const status = searchParams.get("status")
  const hash = searchParams.get("hash")

  console.log("PayWay return params:", {
    orderId,
    transactionRef,
    status,
    hash,
    allParams: Object.fromEntries(searchParams.entries()),
  })

  if (!orderId) {
    console.error("Missing order ID in return URL")
    return NextResponse.redirect(new URL("/payment/error?reason=missing_order", request.url))
  }

  if (!transactionRef) {
    console.error("Missing transaction reference")
    return NextResponse.redirect(new URL(`/checkout/${orderId}?error=missing_transaction`, request.url))
  }

  // Handle different PayWay status values
  if (status === "completed" || status === "success" || status === "paid") {
    try {
      const result = await verifyPayWayPayment(orderId, transactionRef)

      if (result.success) {
        console.log("Payment verification successful")
        return NextResponse.redirect(new URL(`/account/orders/${orderId}?payment=success`, request.url))
      } else {
        console.error("Payment verification failed:", result.message)
        return NextResponse.redirect(new URL(`/account/orders/${orderId}?payment=verification_failed`, request.url))
      }
    } catch (error) {
      console.error("Error verifying payment:", error)
      return NextResponse.redirect(new URL(`/account/orders/${orderId}?payment=error`, request.url))
    }
  } else if (status === "failed") {
    console.log("Payment failed")
    return NextResponse.redirect(new URL(`/checkout/${orderId}?payment=failed`, request.url))
  } else if (status === "cancelled") {
    console.log("Payment cancelled")
    return NextResponse.redirect(new URL(`/checkout/${orderId}?payment=cancelled`, request.url))
  } else {
    console.log("Unknown payment status:", status)
    return NextResponse.redirect(new URL(`/checkout/${orderId}?payment=unknown&status=${status}`, request.url))
  }
}
