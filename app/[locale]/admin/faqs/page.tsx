import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Plus, Search, Edit, Trash2, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { getAllFaqs } from "@/lib/actions/faq.actions"
import  DeleteDialog  from "@/components/shared/delete-dialog"
import { deleteFaq } from '@/lib/actions/faq.actions'

export const metadata = {
  title: "FAQ Management - Admin",
  description: "Manage frequently asked questions",
}

export default async function AdminFaqsPage() {
  const faqs = await getAllFaqs()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">FAQ Management</h1>
          <p className="text-gray-600 mt-1">Manage frequently asked questions and categories</p>
        </div>
        <Link href="/admin/faqs/create">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add FAQ
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input placeholder="Search FAQs..." className="pl-10" />
            </div>
            <Button variant="outline">Filter by Category</Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total FAQs</CardDescription>
            <CardTitle className="text-2xl">{faqs.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Published</CardDescription>
            <CardTitle className="text-2xl text-green-600">{faqs.filter((faq) => faq.isPublished).length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Draft</CardDescription>
            <CardTitle className="text-2xl text-orange-600">{faqs.filter((faq) => !faq.isPublished).length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Categories</CardDescription>
            <CardTitle className="text-2xl">{new Set(faqs.map((faq) => faq.category)).size}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* FAQ List */}
      <Card>
        <CardHeader>
          <CardTitle>All FAQs</CardTitle>
          <CardDescription>Manage your frequently asked questions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {faqs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No FAQs found</p>
                <Link href="/admin/faqs/create">
                  <Button>Create your first FAQ</Button>
                </Link>
              </div>
            ) : (
              faqs.map((faq) => (
                <div key={faq._id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900 line-clamp-1">{faq.question}</h3>
                        <div className="flex items-center gap-1">
                          {faq.isPublished ? (
                            <Badge variant="default" className="text-xs">
                              <Eye className="h-3 w-3 mr-1" />
                              Published
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              <EyeOff className="h-3 w-3 mr-1" />
                              Draft
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                        {faq.answer.replace(/<[^>]*>/g, "").substring(0, 150)}...
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Category: {faq.category}</span>
                        <span>Views: {faq.views || 0}</span>
                        <span>Created: {new Date(faq.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Link href={`/admin/faqs/${faq._id}`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <DeleteDialog
  id={faq._id}
  action={deleteFaq}
  trigger={
    <Button
      variant="outline"
      size="sm"
      className="text-red-600 hover:text-red-700 bg-transparent"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  }
/>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
