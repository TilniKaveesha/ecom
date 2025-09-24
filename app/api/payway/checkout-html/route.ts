/* eslint-disable no-var */
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const transactionId = searchParams.get("transactionId")

  if (!transactionId) {
    return new NextResponse("Transaction ID is required", { status: 400 })
  }

  try {
    // Retrieve the stored HTML content from session storage or database
    // For now, we'll return a placeholder - this will be populated by the checkout component
    let htmlContent = global.paywayHtmlStorage?.[transactionId]

    if (!htmlContent) {
      return new NextResponse("Transaction not found or expired", { status: 404 })
    }

    // Convert relative /_nuxt/ URLs to absolute PayWay URLs
    htmlContent = htmlContent.replace(/href="\/_nuxt\//g, 'href="https://checkout-sandbox.payway.com.kh/_nuxt/')
    htmlContent = htmlContent.replace(/src="\/_nuxt\//g, 'src="https://checkout-sandbox.payway.com.kh/_nuxt/')

    // Also fix any other relative asset URLs that might cause issues
    htmlContent = htmlContent.replace(/href="\/images\//g, 'href="https://checkout-sandbox.payway.com.kh/images/')
    htmlContent = htmlContent.replace(/src="\/images\//g, 'src="https://checkout-sandbox.payway.com.kh/images/')

    // Clean up the stored HTML after serving it
    delete (global.paywayHtmlStorage ?? {})[transactionId]

    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch (error) {
    console.error("Error serving PayWay HTML:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

// Initialize global storage for HTML content
declare global {
  var paywayHtmlStorage: Record<string, string> | undefined
}

if (!global.paywayHtmlStorage) {
  global.paywayHtmlStorage = {}
}
