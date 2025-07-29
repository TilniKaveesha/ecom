"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PaymentLinkDebugProps {
  orderId: string
  amount: number
  customerInfo: {
    name: string
    email: string
    phone: string
  }
}

export default function PaymentLinkDebug({ orderId, amount, customerInfo }: PaymentLinkDebugProps) {
  const [logs, setLogs] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [paymentLink, setPaymentLink] = useState<string | null>(null)

  const addLog = (message: string) => {
    console.log(message)
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testPaymentLinkCreation = async () => {
    addLog("🔥 Starting payment link creation test...")
    setLoading(true)
    setPaymentLink(null)

    try {
      addLog("📝 Creating form data...")
      const formData = new FormData()
      formData.append("title", `Payment for Order #${orderId}`)
      formData.append("amount", amount.toString())
      formData.append("currency", "USD")
      formData.append("description", `Payment for order ${orderId} - ${customerInfo.name}`)
      formData.append("merchantRefNo", orderId)
      formData.append("paymentLimit", "1")

      const expiredDate = Math.floor(Date.now() / 1000) + 24 * 60 * 60
      formData.append("expiredDate", expiredDate.toString())
      formData.append("returnUrl", `${window.location.origin}/api/payway/payment-link/webhook`)

      addLog("📤 Making API request...")

      const response = await fetch("/api/payway/payment-link/create", {
        method: "POST",
        body: formData,
      })

      addLog(`📥 Response received: ${response.status} ${response.statusText}`)
      addLog(`📥 Response OK: ${response.ok}`)

      const responseText = await response.text()
      addLog(`📥 Raw response: ${responseText.substring(0, 200)}...`)

      let data
      try {
        data = JSON.parse(responseText)
        addLog(`📥 Parsed JSON successfully`)
        addLog(`📥 Success field: ${data.success}`)
        addLog(`📥 Payment link field: ${data.payment_link}`)
        addLog(`📥 Payment link ID field: ${data.payment_link_id}`)
      } catch (parseError) {
        addLog(`❌ JSON parse error: ${parseError}`)
        throw new Error("Failed to parse JSON response")
      }

      if (!response.ok) {
        addLog(`❌ HTTP error: ${response.status}`)
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      if (data.success && data.payment_link) {
        const link = data.payment_link.startsWith("http") ? data.payment_link : `https://${data.payment_link}`
        addLog(`✅ Payment link received: ${link}`)
        setPaymentLink(link)
        addLog(`✅ State updated with payment link`)
      } else {
        addLog(`❌ No payment link in successful response`)
        addLog(`❌ Full response: ${JSON.stringify(data)}`)
        throw new Error("No payment link in response")
      }
    } catch (error) {
      addLog(`❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`)
      console.error("Full error:", error)
    } finally {
      setLoading(false)
      addLog("🏁 Test completed")
    }
  }

  const clearLogs = () => {
    setLogs([])
    setPaymentLink(null)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>🔧 Payment Link Debug Tool</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Test Info */}
        <div className="bg-blue-50 p-3 rounded">
          <h4 className="font-medium mb-2">Test Parameters:</h4>
          <div className="text-sm space-y-1">
            <div>Order ID: {orderId}</div>
            <div>Amount: ${amount}</div>
            <div>Customer: {customerInfo.name}</div>
            <div>Email: {customerInfo.email}</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          <Button onClick={testPaymentLinkCreation} disabled={loading}>
            {loading ? "Testing..." : "🧪 Test Payment Link Creation"}
          </Button>
          <Button onClick={clearLogs} variant="outline">
            🗑️ Clear Logs
          </Button>
        </div>

        {/* Payment Link Display */}
        {paymentLink && (
          <Alert className="border-green-200 bg-green-50">
            <AlertDescription>
              <strong className="text-green-800">✅ Payment Link Generated!</strong>
              <br />
              <a
                href={paymentLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline break-all"
              >
                {paymentLink}
              </a>
              <br />
              <Button onClick={() => window.open(paymentLink, "_blank")} className="mt-2" size="sm">
                🔗 Open Payment Link
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Debug Logs */}
        <div className="bg-gray-50 p-3 rounded max-h-96 overflow-y-auto">
          <h4 className="font-medium mb-2">Debug Logs:</h4>
          {logs.length === 0 ? (
            <p className="text-gray-500 text-sm">No logs yet. Click the test button to start.</p>
          ) : (
            <div className="text-xs font-mono space-y-1">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className={`
                  ${log.includes("❌") ? "text-red-600" : ""}
                  ${log.includes("✅") ? "text-green-600" : ""}
                  ${log.includes("📤") || log.includes("📥") ? "text-blue-600" : ""}
                `}
                >
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
