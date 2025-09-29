// Test script to verify ABA PayWay checkout HTML integration
import { payway } from "../lib/payway"

async function testCheckoutHTML() {
  console.log("🧪 Testing ABA PayWay Checkout HTML Integration")

  try {
    // Test with ABA PayWay payment option
    const result = await payway.createOrder(
      10.0,
      "test-order-123",
      {
        name: "John Doe",
        email: "john@example.com",
        phone: "+855123456789",
      },
      "abapay", // This should return HTML form
    )

    console.log("✅ PayWay Response Type:", result.response_type)

    if (result.response_type === "html" && result.checkout_html) {
      console.log("✅ HTML checkout form received")

      // Test for ABA PayWay integration requirements
      const html = result.checkout_html

      // Check for target="aba_webservice" in forms
      const hasAbaTarget = html.includes('target="aba_webservice"')
      console.log("✅ Forms have target='aba_webservice':", hasAbaTarget)

      // Check for ABA PayWay script
      const hasAbaScript = html.includes("checkout.payway.com.kh/plugins/checkout2-0.js")
      console.log("✅ ABA PayWay script included:", hasAbaScript)

      // Check for jQuery
      const hasJQuery = html.includes("jquery")
      console.log("✅ jQuery included:", hasJQuery)

      // Check for AbaPayway.checkout() call
      const hasAbaCheckout = html.includes("AbaPayway.checkout()")
      console.log("✅ AbaPayway.checkout() call present:", hasAbaCheckout)

      // Check for checkout_qr_url message listener
      const hasQrListener = html.includes("checkout_qr_url")
      console.log("✅ QR URL message listener present:", hasQrListener)

      if (hasAbaTarget && hasAbaScript && hasJQuery && hasAbaCheckout && hasQrListener) {
        console.log("🎉 All ABA PayWay integration requirements met!")
      } else {
        console.log("⚠️ Some ABA PayWay integration requirements missing")
      }

      // Save HTML for inspection (first 2000 chars)
      console.log("\n📄 HTML Preview:")
      console.log(html.substring(0, 2000))
      console.log("...")
    } else if (result.response_type === "json" && result.checkout_qr_url) {
      console.log("✅ QR URL received:", result.checkout_qr_url)
      console.log("✅ Transaction ID:", result.transaction_ref)
    }
  } catch (error) {
    console.error("❌ Test failed:", error)
  }
}

// Run the test
testCheckoutHTML()
