import { type NextRequest, NextResponse } from "next/server"
import { paywayPaymentLinks } from "@/lib/payway-payment-links"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const title = formData.get("title") as string
    const amount = Number.parseFloat(formData.get("amount") as string)
    const currency = formData.get("currency") as "USD" | "KHR"
    const description = formData.get("description") as string
    const paymentLimit = formData.get("paymentLimit")
      ? Number.parseInt(formData.get("paymentLimit") as string)
      : undefined
    const expiredDate = Number.parseInt(formData.get("expiredDate") as string)
    const returnUrl = formData.get("returnUrl") as string
    const merchantRefNo = formData.get("merchantRefNo") as string
    const image = formData.get("image") as File | null

    // Validate required fields
    if (!title || !amount || !currency || !expiredDate || !returnUrl) {
      return NextResponse.json(
        { error: "Missing required fields: title, amount, currency, expiredDate, returnUrl" },
        { status: 400 },
      )
    }

    const result = await paywayPaymentLinks.createPaymentLink({
      title,
      amount,
      currency,
      description,
      paymentLimit,
      expiredDate,
      returnUrl,
      merchantRefNo,
      image: image || undefined,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Payment Link creation error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create payment link" },
      { status: 500 },
    )
  }
}
