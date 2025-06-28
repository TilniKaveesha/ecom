/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ExternalLink, Copy, RefreshCw, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PaymentLink {
  id: string
  orderId: string
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
}

export default function PaymentLinksTable() {
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([])
  const [loading, setLoading] = useState(true)
  const [searchOrderId, setSearchOrderId] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false,
  })
  const { toast } = useToast()

  const fetchPaymentLinks = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
      })

      if (searchOrderId) {
        params.append("orderId", searchOrderId)
      }
      if (statusFilter !== "all") {
        params.append("status", statusFilter)
      }

      const response = await fetch(`/api/admin/payment-links?${params}`)
      const data: PaymentLinksResponse = await response.json()

      if (data.success) {
        setPaymentLinks(data.paymentLinks)
        setPagination(data.pagination)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch payment links",
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
    }
  }

  useEffect(() => {
    fetchPaymentLinks()
  }, [pagination.offset, pagination.limit])

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, offset: 0 }))
    fetchPaymentLinks()
  }

  const handleCopyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link)
      toast({
        title: "Copied!",
        description: "Payment link copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy payment link",
        variant: "destructive",
      })
    }
  }

  const handleOpenLink = (link: string) => {
    const url = link.startsWith("http") ? link : `https://${link}`
    window.open(url, "_blank", "noopener,noreferrer")
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "secondary" as const, label: "Pending" },
      paid: { variant: "default" as const, label: "Paid" },
      failed: { variant: "destructive" as const, label: "Failed" },
      expired: { variant: "outline" as const, label: "Expired" },
      open: { variant: "secondary" as const, label: "Open" },
    }

    const config = statusConfig[status.toLowerCase() as keyof typeof statusConfig] || {
      variant: "outline" as const,
      label: status,
    }

    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Links Management</CardTitle>
        <CardDescription>View and manage PayWay payment links</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search and Filter Controls */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search by Order ID..."
              value={searchOrderId}
              onChange={(e) => setSearchOrderId(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="open">Open</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleSearch} disabled={loading}>
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          <Button onClick={fetchPaymentLinks} disabled={loading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Payment Links Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading payment links...
                  </TableCell>
                </TableRow>
              ) : paymentLinks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    No payment links found
                  </TableCell>
                </TableRow>
              ) : (
                paymentLinks.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell className="font-medium">{link.orderId}</TableCell>
                    <TableCell>{formatAmount(link.amount, link.currency)}</TableCell>
                    <TableCell>{getStatusBadge(link.status)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {link.customerName && <div className="text-sm font-medium">{link.customerName}</div>}
                        {link.customerEmail && (
                          <div className="text-xs text-muted-foreground">{link.customerEmail}</div>
                        )}
                        {link.customerPhone && (
                          <div className="text-xs text-muted-foreground">{link.customerPhone}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(link.createdAt)}</TableCell>
                    <TableCell className="text-sm">
                      {link.expiresAt ? formatDate(link.expiresAt) : "No expiry"}
                    </TableCell>
                    <TableCell className="text-sm">{link.paidAt ? formatDate(link.paidAt) : "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyLink(link.paymentLink)}
                          title="Copy payment link"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenLink(link.paymentLink)}
                          title="Open payment link"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of{" "}
            {pagination.total} payment links
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination((prev) => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))}
              disabled={pagination.offset === 0 || loading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination((prev) => ({ ...prev, offset: prev.offset + prev.limit }))}
              disabled={!pagination.hasMore || loading}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
