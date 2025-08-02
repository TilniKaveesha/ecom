import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { getFaqCategories, getPopularFaqs } from "@/lib/actions/faq.actions"
import Link from "next/link"

type FaqItem = {
  _id: string;
  question: string;
  category: string;
  categoryTitle: string;
};

export const metadata = {
  title: "FAQ - Frequently Asked Questions",
  description: "Find answers to frequently asked questions about our products and services",
}

export default async function FaqPage() {
  const categories = await getFaqCategories()
  const popularFaqs = await getPopularFaqs()

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h1>
        <p className="text-xl text-gray-600 mb-8">Find answers to common questions about our products and services</p>

        {/* Search Bar */}
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input type="text" placeholder="Search FAQs..." className="pl-10 pr-4 py-2 w-full" />
        </div>
      </div>

      {/* FAQ Categories */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Browse by Category</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Link key={category.slug} href={`/faq/${category.slug}`}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-200">
                <CardHeader>
                  <div className="flex items-center mb-2">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-2xl">{category.icon}</span>
                    </div>
                    <CardTitle className="text-lg">{category.title}</CardTitle>
                  </div>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">{category.faqCount} questions</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Popular FAQs */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Popular Questions</h2>
        <div className="space-y-4">
          {popularFaqs.map((faq: FaqItem) => (
            <Card key={faq._id} className="border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-900">
                  <Link href={`/faq/${faq.category}#${faq._id}`} className="hover:text-blue-600 transition-colors">
                    {faq.question}
                  </Link>
                </CardTitle>
                <CardDescription className="text-sm text-gray-500">Category: {faq.categoryTitle}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
