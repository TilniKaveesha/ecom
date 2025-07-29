"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { Copy, ExternalLink, RefreshCw, CreditCard, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react"

interface PaymentLink {
  id: string
  orderId: string
  orderNumber: string
  paymentLink: string
  paymentLinkId: string
  amount: number
  currency: string
  status: string
  createdAt: string
  expiresAt?: string
  paidAt?: string
  customerName: string
  customerEmail: string
  customerPhone: string
}

interface PaymentLinksResponse {
  success: boolean
  paymentLinks: PaymentLink[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
  error?: string
}

// Format price utility function
const formatPrice = (amount: number, currency: string): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

// Get status badge variant
const getStatusBadgeVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case "paid":
      return "default"
    case "pending":
    case "open":
      return "secondary"
    case "expired":
      return "destructive"
    case "cancelled":
      return "outline"
    default:
      return "secondary"
  }
}

// Get status icon
const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case "paid":
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case "pending":
    case "open":
      return <Clock className="h-4 w-4 text-yellow-600" />
    case "expired":
      return <AlertTriangle className="h-4 w-4 text-red-600" />
    case "cancelled":
      return <XCircle className="h-4 w-4 text-gray-600" />
    default:
      return <CreditCard className="h-4 w-4 text-blue-600" />
  }
}

export default function UserPaymentLinks() {
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const { toast } = useToast()

  const fetchPaymentLinks = async (showRefreshLoader = false) => {
    try {
      if (showRefreshLoader) setRefreshing(true)
      else setLoading(true)

      const params = new URLSearchParams()
      if (statusFilter !== "all") {
        params.append("status", statusFilter)
      }

      const response = await fetch(`/api/user/payment-links?${params.toString()}`)
      const data: PaymentLinksResponse = await response.json()

      if (data.success) {
        setPaymentLinks(data.paymentLinks)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch payment links",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching payment links:", error)
      toast({
        title: "Error",
        description: "Failed to fetch payment links",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchPaymentLinks()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied!",
        description: `${type} copied to clipboard`,
      })
    } catch (error) {
      console.error("Failed to copy:", error)
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      })
    }
  }

  const openPaymentLink = (url: string, status: string) => {
    if (status.toLowerCase() === "paid" || status.toLowerCase() === "expired") {
      toast({
        title: "Cannot Open",
        description: `This payment link is ${status.toLowerCase()} and cannot be used`,
        variant: "destructive",
      })
      return
    }

    const fullUrl = url.startsWith("http") ? url : `https://${url}`
    window.open(fullUrl, "_blank", "noopener,noreferrer")
  }

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payment Links</h1>
          <p className="text-muted-foreground">View and manage your PayWay payment links</p>
        </div>
        <Button onClick={() => fetchPaymentLinks(true)} disabled={refreshing} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Status:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-muted-foreground">
          {paymentLinks.length} payment link{paymentLinks.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Payment Links */}
      {paymentLinks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Payment Links Found</h3>
            <p className="text-muted-foreground text-center">
              {statusFilter === "all"
                ? "You haven't created any payment links yet. Make an order with PayWay to see payment links here."
                : `No payment links found with status "${statusFilter}".`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {paymentLinks.map((link) => (
            <Card key={link.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {getStatusIcon(link.status)}
                      Order #{link.orderNumber}
                    </CardTitle>
                    <CardDescription>
                      Created {new Date(link.createdAt).toLocaleDateString()} at{" "}
                      {new Date(link.createdAt).toLocaleTimeString()}
                    </CardDescription>
                  </div>
                  <Badge variant={getStatusBadgeVariant(link.status)}>{link.status.toUpperCase()}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Amount and Currency */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Amount:</span>
                  <span className="text-lg font-bold">{formatPrice(link.amount, link.currency)}</span>
                </div>

                {/* Payment Link ID */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Payment Link ID:</span>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded">{link.paymentLinkId}</code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(link.paymentLinkId, "Payment Link ID")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Payment Link URL */}
                <div className="space-y-2">
                  <span className="text-sm font-medium">Payment Link:</span>
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                    <code className="text-xs flex-1 truncate">{link.paymentLink}</code>
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard(link.paymentLink, "Payment Link")}>
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openPaymentLink(link.paymentLink, link.status)}
                      disabled={link.status.toLowerCase() === "paid" || link.status.toLowerCase() === "expired"}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {link.expiresAt && (
                    <div>
                      <span className="font-medium">Expires:</span>
                      <div className={`${isExpired(link.expiresAt) ? "text-red-600" : "text-muted-foreground"}`}>
                        {new Date(link.expiresAt).toLocaleDateString()} at{" "}
                        {new Date(link.expiresAt).toLocaleTimeString()}
                        {isExpired(link.expiresAt) && <span className="ml-2 text-red-600 font-medium">(Expired)</span>}
                      </div>
                    </div>
                  )}
                  {link.paidAt && (
                    <div>
                      <span className="font-medium">Paid:</span>
                      <div className="text-green-600">
                        {new Date(link.paidAt).toLocaleDateString()} at {new Date(link.paidAt).toLocaleTimeString()}
                      </div>
                    </div>
                  )}
                </div>

                {/* Customer Info */}
                {(link.customerName || link.customerEmail || link.customerPhone) && (
                  <div className="pt-2 border-t">
                    <span className="text-sm font-medium">Customer Info:</span>
                    <div className="text-sm text-muted-foreground mt-1">
                      {link.customerName && <div>Name: {link.customerName}</div>}
                      {link.customerEmail && <div>Email: {link.customerEmail}</div>}
                      {link.customerPhone && <div>Phone: {link.customerPhone}</div>}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
