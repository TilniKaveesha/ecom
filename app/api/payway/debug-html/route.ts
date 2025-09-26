import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const transactionId = searchParams.get("transactionId") || searchParams.get("tran_id")
  const format = searchParams.get("format") || "html" // html, json, or raw

  if (!transactionId) {
    return NextResponse.json({ error: "Transaction ID is required" }, { status: 400 })
  }

  try {
    // Retrieve the stored HTML content from global storage
    const htmlContent = global.paywayHtmlStorage?.[transactionId]

    if (!htmlContent) {
      return NextResponse.json(
        {
          error: "HTML content not found",
          message: "This payment session has expired or was not found",
          transactionId,
        },
        { status: 404 },
      )
    }

    // Return different formats based on request
    switch (format) {
      case "json":
        return NextResponse.json({
          transactionId,
          htmlLength: htmlContent.length,
          htmlContent,
          timestamp: new Date().toISOString(),
          hasContent: !!htmlContent,
          preview: htmlContent.substring(0, 500) + "...",
        })

      case "raw":
        return new NextResponse(htmlContent, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Content-Disposition": `attachment; filename="payway-${transactionId}.html"`,
          },
        })

      case "download":
        return new NextResponse(htmlContent, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Content-Disposition": `attachment; filename="payway-${transactionId}.html"`,
          },
        })

      default: // html format
        const debugHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PayWay HTML Debug - ${transactionId}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
            color: #333;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            border-bottom: 2px solid #007bff;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .info-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #007bff;
        }
        .info-card h3 {
            margin: 0 0 10px 0;
            color: #007bff;
        }
        .actions {
            display: flex;
            gap: 15px;
            margin-bottom: 30px;
            flex-wrap: wrap;
        }
        .btn {
            background-color: #007bff;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 4px;
            text-decoration: none;
            font-size: 14px;
            cursor: pointer;
            display: inline-block;
        }
        .btn:hover {
            background-color: #0056b3;
        }
        .btn.secondary {
            background-color: #6c757d;
        }
        .btn.secondary:hover {
            background-color: #545b62;
        }
        .code-container {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            overflow: hidden;
        }
        .code-header {
            background: #e9ecef;
            padding: 15px 20px;
            border-bottom: 1px solid #dee2e6;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .code-content {
            max-height: 600px;
            overflow: auto;
            padding: 0;
        }
        pre {
            margin: 0;
            padding: 20px;
            white-space: pre-wrap;
            word-wrap: break-word;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 12px;
            line-height: 1.4;
        }
        .copy-btn {
            background: #28a745;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        }
        .copy-btn:hover {
            background: #218838;
        }
        .preview-iframe {
            width: 100%;
            height: 600px;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            margin-top: 20px;
        }
        .tabs {
            display: flex;
            border-bottom: 2px solid #dee2e6;
            margin-bottom: 20px;
        }
        .tab {
            padding: 12px 24px;
            background: none;
            border: none;
            cursor: pointer;
            font-size: 16px;
            border-bottom: 3px solid transparent;
        }
        .tab.active {
            border-bottom-color: #007bff;
            color: #007bff;
            font-weight: 600;
        }
        .tab-content {
            display: none;
        }
        .tab-content.active {
            display: block;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        .stat {
            text-align: center;
            padding: 15px;
            background: #e3f2fd;
            border-radius: 8px;
        }
        .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #1976d2;
        }
        .stat-label {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>PayWay HTML Debug</h1>
            <p>Transaction ID: <strong>${transactionId}</strong></p>
        </div>

        <div class="info-grid">
            <div class="info-card">
                <h3>Content Info</h3>
                <p><strong>Size:</strong> ${htmlContent.length.toLocaleString()} characters</p>
                <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>Status:</strong> <span style="color: green;">✓ Available</span></p>
            </div>
            <div class="info-card">
                <h3>Content Analysis</h3>
                <p><strong>Has Forms:</strong> ${htmlContent.includes("<form") ? "✓ Yes" : "✗ No"}</p>
                <p><strong>Has Scripts:</strong> ${htmlContent.includes("<script") ? "✓ Yes" : "✗ No"}</p>
                <p><strong>Has Styles:</strong> ${htmlContent.includes("<style") || htmlContent.includes("<link") ? "✓ Yes" : "✗ No"}</p>
            </div>
        </div>

        <div class="actions">
            <a href="/api/payway/debug-html?transactionId=${transactionId}&format=download" class="btn">
                📥 Download HTML
            </a>
            <a href="/api/payway/debug-html?transactionId=${transactionId}&format=raw" class="btn secondary">
                📄 View Raw
            </a>
            <a href="/api/payway/debug-html?transactionId=${transactionId}&format=json" class="btn secondary">
                📊 JSON Format
            </a>
            <button onclick="copyToClipboard()" class="btn secondary">
                📋 Copy HTML
            </button>
        </div>

        <div class="tabs">
            <button class="tab active" onclick="showTab('preview')">Live Preview</button>
            <button class="tab" onclick="showTab('source')">HTML Source</button>
            <button class="tab" onclick="showTab('analysis')">Analysis</button>
        </div>

        <div id="preview" class="tab-content active">
            <h3>Live Preview</h3>
            <p>This is how the PayWay checkout page appears in the iframe:</p>
            <iframe src="/api/payway/checkout-html?transactionId=${transactionId}" class="preview-iframe"></iframe>
        </div>

        <div id="source" class="tab-content">
            <div class="code-container">
                <div class="code-header">
                    <h3>Complete HTML Source</h3>
                    <button class="copy-btn" onclick="copyToClipboard()">Copy All</button>
                </div>
                <div class="code-content">
                    <pre id="html-content">${htmlContent.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
                </div>
            </div>
        </div>

        <div id="analysis" class="tab-content">
            <h3>Content Analysis</h3>
            <div class="stats">
                <div class="stat">
                    <div class="stat-value">${htmlContent.length.toLocaleString()}</div>
                    <div class="stat-label">Total Characters</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${(htmlContent.match(/<form/g) || []).length}</div>
                    <div class="stat-label">Forms Found</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${(htmlContent.match(/<input/g) || []).length}</div>
                    <div class="stat-label">Input Fields</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${(htmlContent.match(/<script/g) || []).length}</div>
                    <div class="stat-label">Script Tags</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${(htmlContent.match(/<button/g) || []).length}</div>
                    <div class="stat-label">Buttons</div>
                </div>
            </div>
            
            <h4>Key Elements Found:</h4>
            <ul>
                ${htmlContent.includes("payment") ? "<li>✓ Payment-related content detected</li>" : "<li>✗ No payment content detected</li>"}
                ${htmlContent.includes("form") ? "<li>✓ Form elements present</li>" : "<li>✗ No form elements found</li>"}
                ${htmlContent.includes("submit") ? "<li>✓ Submit functionality available</li>" : "<li>✗ No submit functionality found</li>"}
                ${htmlContent.includes("card") || htmlContent.includes("credit") ? "<li>✓ Card payment options detected</li>" : "<li>✗ No card payment options detected</li>"}
                ${htmlContent.includes("error") ? "<li>⚠️ Error handling present</li>" : "<li>✓ No error states detected</li>"}
            </ul>
        </div>
    </div>

    <script>
        function showTab(tabName) {
            // Hide all tab contents
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Remove active class from all tabs
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Show selected tab content
            document.getElementById(tabName).classList.add('active');
            
            // Add active class to clicked tab
            event.target.classList.add('active');
        }

        function copyToClipboard() {
            const htmlContent = document.getElementById('html-content').textContent;
            navigator.clipboard.writeText(htmlContent).then(() => {
                alert('HTML content copied to clipboard!');
            }).catch(err => {
                console.error('Failed to copy: ', err);
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = htmlContent;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                alert('HTML content copied to clipboard!');
            });
        }
    </script>
</body>
</html>
        `

        return new NextResponse(debugHtml, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        })
    }
  } catch (error) {
    console.error("Error in debug HTML endpoint:", error)
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
