import { getAllFaqs } from "@/lib/actions/faq.actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Plus, Edit } from "lucide-react"
import  DeleteDialog  from "@/components/shared/delete-dialog"
import { deleteFaq } from "@/lib/actions/faq.actions"

export const metadata = {
  title: "FAQ Management",
  description: "Manage frequently asked questions",
}

export default async function AdminFaqsPage() {
  const faqs = await getAllFaqs()

  const categoryLabels = {
    general: "General Info",
    payments: "Payment Methods",
    delivery: "Delivery Options",
    "order-status": "Order Status",
    returns: "Exchange and Returns",
    refunds: "Refund Purchase",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">FAQ Management</h1>
          <p className="text-gray-600">Manage frequently asked questions</p>
        </div>
        <Button asChild>
          <Link href="/admin/faqs/create">
            <Plus className="h-4 w-4 mr-2" />
            Add FAQ
          </Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {faqs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-gray-500 mb-4">No FAQs found</p>
              <Button asChild>
                <Link href="/admin/faqs/create">Create your first FAQ</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          faqs.map((faq) => (
            <Card key={faq._id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-lg">{faq.question}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{categoryLabels[faq.category as keyof typeof categoryLabels]}</Badge>
                      <Badge variant={faq.isPublished ? "default" : "destructive"}>
                        {faq.isPublished ? "Published" : "Draft"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/faqs/${faq._id}`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <DeleteDialog id={faq._id} action={deleteFaq} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="line-clamp-2">
                  {faq.answer.replace(/<[^>]*>/g, "").substring(0, 150)}...
                </CardDescription>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
