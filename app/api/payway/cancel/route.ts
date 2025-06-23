import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const orderId = searchParams.get("order_id") || searchParams.get("return_params")
  const reason = searchParams.get("reason") || "user_cancelled"

  console.log("PayWay cancellation:", { orderId, reason })

  if (orderId) {
    // Redirect back to checkout with cancellation message
    return NextResponse.redirect(new URL(`/checkout/${orderId}?cancelled=true&reason=${reason}`, request.url))
  }

  // If no order ID, redirect to cart
  return NextResponse.redirect(new URL("/cart?cancelled=true", request.url))
}
