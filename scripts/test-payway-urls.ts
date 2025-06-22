// Test script to check which PayWay URL is accessible
const PAYWAY_URLS = [
  "https://checkout-sandbox.payway.com.kh",
  "https://api-sandbox.payway.com.kh",
  "https://sandbox.payway.com.kh",
  "https://api.payway.com.kh",
  "https://checkout.payway.com.kh",
]

async function testPayWayUrls() {
  console.log("Testing PayWay URLs...")

  for (const baseUrl of PAYWAY_URLS) {
    const testUrl = `${baseUrl}/api/payment-gateway/v1/payments/purchase`

    try {
      console.log(`\nTesting: ${testUrl}`)

      const response = await fetch(testUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ test: "connection" }),
      })

      console.log(`✅ ${baseUrl} - Status: ${response.status}`)

      if (response.status !== 404) {
        console.log(`🎯 Potential working URL: ${baseUrl}`)
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error.code === "ENOTFOUND") {
        console.log(`❌ ${baseUrl} - Domain not found`)
      } else {
        console.log(`⚠️  ${baseUrl} - Error: ${error.message}`)
      }
    }
  }
}

// Run the test
testPayWayUrls().catch(console.error)
