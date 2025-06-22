import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const orderId = searchParams.get("order_id")

  if (orderId) {
    return NextResponse.redirect(new URL(`/checkout/${orderId}?cancelled=true`, request.url))
  }

  return NextResponse.redirect(new URL("/cart", request.url))
}
