/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useState, useEffect } from "react"
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"

interface PayWayHtmlDebugProps {
  transactionId: string
  onClose?: () => void
}

export default function PayWayHtmlDebug({ transactionId, onClose }: PayWayHtmlDebugProps) {
  const [htmlContent, setHtmlContent] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"analysis" | "raw" | "preview">("analysis")
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    fetchHtmlContent()
  }, [transactionId])

  const fetchHtmlContent = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/payway/checkout-html?tran_id=${transactionId}`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const content = await response.text()
      setHtmlContent(content)

      const externalLinks =
        content.match(/<link[^>]*href="https:\/\/checkout-sandbox\.payway\.com\.kh[^"]*"[^>]*>/g) || []
      const externalScripts =
        content.match(/<script[^>]*src="https:\/\/checkout-sandbox\.payway\.com\.kh[^"]*"[^>]*><\/script>/g) || []

      console.log("[v0] External links found:", externalLinks.length)
      console.log("[v0] External scripts found:", externalScripts.length)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch HTML content"
      console.error("[v0] HTML debug error:", errorMessage)
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const analyzeHtml = () => {
    if (!htmlContent) return null

    const analysis = {
      totalSize: htmlContent.length,
      hasDoctype: htmlContent.includes("<!DOCTYPE"),
      hasHtml: htmlContent.includes("<html"),
      hasHead: htmlContent.includes("<head"),
      hasBody: htmlContent.includes("<body"),
      hasForms: (htmlContent.match(/<form/g) || []).length,
      hasInputs: (htmlContent.match(/<input/g) || []).length,
      hasButtons: (htmlContent.match(/<button/g) || []).length,
      hasScripts: (htmlContent.match(/<script/g) || []).length,
      hasStyles: (htmlContent.match(/<style/g) || []).length,
      hasLinks: (htmlContent.match(/<link/g) || []).length,
      externalResources: (htmlContent.match(/https:\/\/checkout-sandbox\.payway\.com\.kh/g) || []).length,
      communicationScript: htmlContent.includes("sendToParent"),
      paymentMonitoring: htmlContent.includes("monitorPaymentStatus"),
    }

    return analysis
  }

  const analysis = analyzeHtml()

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading PayWay HTML content...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl h-[90vh] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex justify-between items-center">
            <CardTitle>PayWay HTML Debug - Transaction: {transactionId}</CardTitle>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden">
          {error ? (
            <div className="text-center p-6">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Error Loading HTML</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={fetchHtmlContent}>Retry</Button>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <div className="flex-shrink-0 mb-4">
                <div className="inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1">
                  <button
                    onClick={() => setActiveTab("analysis")}
                    className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
                      activeTab === "analysis"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Analysis
                  </button>
                  <button
                    onClick={() => setActiveTab("raw")}
                    className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
                      activeTab === "raw" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Raw HTML
                  </button>
                  <button
                    onClick={() => setActiveTab("preview")}
                    className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
                      activeTab === "preview" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Preview
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-auto">
                {activeTab === "analysis" && analysis && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded">
                        <div className="text-2xl font-bold">{Math.round(analysis.totalSize / 1024)}KB</div>
                        <div className="text-sm text-gray-600">Total Size</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded">
                        <div className="text-2xl font-bold">{analysis.hasForms}</div>
                        <div className="text-sm text-gray-600">Forms</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded">
                        <div className="text-2xl font-bold">{analysis.hasInputs}</div>
                        <div className="text-sm text-gray-600">Inputs</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded">
                        <div className="text-2xl font-bold">{analysis.hasButtons}</div>
                        <div className="text-sm text-gray-600">Buttons</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">HTML Structure</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between">
                            <span>DOCTYPE</span>
                            <Badge variant={analysis.hasDoctype ? "default" : "destructive"}>
                              {analysis.hasDoctype ? "✓" : "✗"}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>HTML Tag</span>
                            <Badge variant={analysis.hasHtml ? "default" : "destructive"}>
                              {analysis.hasHtml ? "✓" : "✗"}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Head Section</span>
                            <Badge variant={analysis.hasHead ? "default" : "destructive"}>
                              {analysis.hasHead ? "✓" : "✗"}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Body Section</span>
                            <Badge variant={analysis.hasBody ? "default" : "destructive"}>
                              {analysis.hasBody ? "✓" : "✗"}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Resources & Scripts</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between">
                            <span>Scripts</span>
                            <Badge variant="outline">{analysis.hasScripts}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Stylesheets</span>
                            <Badge variant="outline">{analysis.hasLinks}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>External Resources</span>
                            <Badge variant={analysis.externalResources > 0 ? "secondary" : "outline"}>
                              {analysis.externalResources}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Communication Script</span>
                            <Badge variant={analysis.communicationScript ? "default" : "destructive"}>
                              {analysis.communicationScript ? "✓" : "✗"}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Content Preview</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-gray-100 p-4 rounded text-sm font-mono max-h-40 overflow-auto">
                          {htmlContent.substring(0, 500)}...
                        </div>
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm text-gray-600 mb-2">For complete HTML analysis and debugging tools:</p>
                          <Button
                            variant="outline"
                            onClick={() =>
                              window.open(`/api/payway/debug-html?transactionId=${transactionId}`, "_blank")
                            }
                            className="w-full"
                          >
                            🔍 Open Full HTML Debug Viewer
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {activeTab === "raw" && (
                  <div className="h-full">
                    <textarea
                      value={htmlContent}
                      readOnly
                      className="w-full h-full p-4 font-mono text-sm border rounded resize-none"
                      placeholder="HTML content will appear here..."
                    />
                  </div>
                )}

                {activeTab === "preview" && (
                  <div className="h-full border rounded">
                    {showPreview ? (
                      <iframe
                        srcDoc={htmlContent}
                        className="w-full h-full border-0"
                        sandbox="allow-scripts allow-forms allow-same-origin"
                        title="PayWay HTML Preview"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <p className="mb-4">Click to preview the PayWay HTML content</p>
                          <Button onClick={() => setShowPreview(true)}>Show Preview</Button>
                          <p className="text-sm text-gray-500 mt-2">
                            Note: This preview may not work exactly like the actual payment page
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
