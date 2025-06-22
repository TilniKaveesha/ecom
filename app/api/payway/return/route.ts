import { type NextRequest, NextResponse } from "next/server"
import { verifyPayWayPayment } from "@/lib/actions/order.actions"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const orderId = searchParams.get("order_id")
  const transactionRef = searchParams.get("transaction_ref")
  const status = searchParams.get("status")

  if (!orderId || !transactionRef) {
    return NextResponse.redirect(new URL("/payment/error", request.url))
  }

  if (status === "completed") {
    const result = await verifyPayWayPayment(orderId, transactionRef)

    if (result.success) {
      return NextResponse.redirect(new URL(`/account/orders/${orderId}?payment=success`, request.url))
    }
  }

  return NextResponse.redirect(new URL(`/account/orders/${orderId}?payment=failed`, request.url))
}
