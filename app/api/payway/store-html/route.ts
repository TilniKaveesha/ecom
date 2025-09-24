/* eslint-disable no-var */
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { transactionId, htmlContent } = await request.json()

    if (!transactionId || !htmlContent) {
      return NextResponse.json({ error: "Transaction ID and HTML content are required" }, { status: 400 })
    }

    // Initialize global storage if it doesn't exist
    if (!global.paywayHtmlStorage) {
      global.paywayHtmlStorage = {}
    }

    // Store the HTML content temporarily (expires after 10 minutes)
    global.paywayHtmlStorage[transactionId] = htmlContent

    // Clean up after 10 minutes
    setTimeout(
      () => {
        if (global.paywayHtmlStorage && global.paywayHtmlStorage[transactionId]) {
          delete global.paywayHtmlStorage[transactionId]
        }
      },
      10 * 60 * 1000,
    ) // 10 minutes

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error storing PayWay HTML:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// Initialize global storage for HTML content
declare global {
  var paywayHtmlStorage: Record<string, string> | undefined
}
