import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { PaymentLink } from "@/lib/db/models/payment-link.model"
import { connectToDatabase } from "@/lib/db"
import Order from "@/lib/db/models/order.model"
import type { Document } from "mongoose"

interface PaymentLinkDocument extends Document {
  _id: string
  orderId: string
  paymentLink: string
  paymentLinkId: string
  amount: number
  currency: string
  status: string
  customerInfo?: {
    name?: string
    email?: string
    phone?: string
  }
  createdAt: Date
  expiresAt?: Date
  paidAt?: Date
}

interface OrderDocument extends Document {
  _id: string
  user: string
  orderNumber: string
  totalPrice: number
  currency: string
  paymentMethod: string
  paymentResult?: {
    id?: string
    status?: string
    email_address?: string
  }
  createdAt: Date
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    await connectToDatabase()

    // First, get all orders for the current user
    const userOrders = await Order.find({ user: session.user.id }).select("_id orderNumber").lean<OrderDocument[]>()

    if (userOrders.length === 0) {
      return NextResponse.json({
        success: true,
        paymentLinks: [],
        pagination: {
          total: 0,
          limit,
          offset,
          hasMore: false,
        },
      })
    }

    // Extract order IDs
    const orderIds = userOrders.map((order: OrderDocument) => order._id.toString())

    // Build query for payment links
    const query: Record<string, unknown> = {
      orderId: { $in: orderIds },
    }

    if (status) {
      query.status = status
    }

    // Get payment links for user's orders
    const paymentLinks = await PaymentLink.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .lean<PaymentLinkDocument[]>()

    // Get total count
    const total = await PaymentLink.countDocuments(query)

    // Create a map of order IDs to order numbers for easier lookup
    const orderMap = new Map(userOrders.map((order: OrderDocument) => [order._id.toString(), order.orderNumber]))

    // Transform data for frontend
    const transformedLinks = paymentLinks.map((link) => ({
      id: link._id.toString(),
      orderId: link.orderId,
      orderNumber: orderMap.get(link.orderId) || link.orderId,
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
    console.error("Error fetching user payment links:", error)
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
