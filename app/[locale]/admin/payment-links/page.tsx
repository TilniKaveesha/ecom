import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import PaymentLinksTable from "./payment-links-table"

export default function PaymentLinksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payment Links</h1>
        <p className="text-muted-foreground">Manage and monitor all PayWay payment links</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Payment Links</CardTitle>
          <CardDescription>View, copy, and manage payment links created for orders</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading payment links...</div>}>
            <PaymentLinksTable />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
