import { type NextRequest, NextResponse } from "next/server"
import { PaymentLink } from "@/lib/db/models/payment-link.model"
import { connectToDatabase } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get("orderId")
    const status = searchParams.get("status")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    await connectToDatabase()

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {}
    if (orderId) {
      query.orderId = orderId
    }
    if (status) {
      query.status = status
    }

    // Get payment links with pagination
    const paymentLinks = await PaymentLink.find(query).sort({ createdAt: -1 }).limit(limit).skip(offset).lean()

    // Get total count
    const total = await PaymentLink.countDocuments(query)

    // Transform data for frontend
    const transformedLinks = paymentLinks.map((link) => ({
      id: link._id?.toString(),
      orderId: link.orderId,
      paymentLink: link.paymentLink,
      paymentLinkId: link.paymentLinkId,
      amount: link.amount,
      currency: link.currency,
      status: link.status,
      createdAt: link.createdAt,
      expiresAt: link.expiresAt,
      paidAt: link.paidAt,
      customerName: link.customerInfo?.name || "",
      customerEmail: link.customerInfo?.email || "",
      customerPhone: link.customerInfo?.phone || "",
    }))

    return NextResponse.json({
      success: true,
      paymentLinks: transformedLinks,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error("Error fetching payment links:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch payment links",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    await connectToDatabase()

    const paymentLink = new PaymentLink({
      orderId: body.orderId,
      paymentLink: body.paymentLink,
      paymentLinkId: body.paymentLinkId,
      amount: body.amount,
      currency: body.currency,
      status: body.status || "pending",
      customerInfo: body.customerInfo || {},
      expiresAt: body.expiresAt,
    })

    await paymentLink.save()

    return NextResponse.json({
      success: true,
      paymentLink: {
        id: paymentLink._id.toString(),
        orderId: paymentLink.orderId,
        paymentLink: paymentLink.paymentLink,
        paymentLinkId: paymentLink.paymentLinkId,
        amount: paymentLink.amount,
        currency: paymentLink.currency,
        status: paymentLink.status,
        createdAt: paymentLink.createdAt,
        expiresAt: paymentLink.expiresAt,
      },
    })
  } catch (error) {
    console.error("Error creating payment link record:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create payment link record",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
