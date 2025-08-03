/* eslint-disable @typescript-eslint/no-unused-vars */
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown } from "lucide-react"
import { getFaqsByCategory, getFaqCategories } from "@/lib/actions/faq.actions"

interface FaqPageProps {
  params: Promise<{
    category: string
    locale: string
  }>
}

export async function generateStaticParams() {
  const categories = await getFaqCategories()
  return categories.map((category) => ({
    category: category.slug,
  }))
}

export async function generateMetadata({ params }: FaqPageProps) {
  const { category } = await params
  const categories = await getFaqCategories()
  const categoryData = categories.find((cat) => cat.slug === category)

  if (!categoryData) {
    return {
      title: "FAQ Not Found",
    }
  }

  return {
    title: `${categoryData.title} - FAQ`,
    description: `Frequently asked questions about ${categoryData.title.toLowerCase()}`,
  }
}

export default async function FaqCategoryPage({ params }: FaqPageProps) {
  const { category } = await params
  const faqs = await getFaqsByCategory(category)
  const categories = await getFaqCategories()
  const categoryData = categories.find((cat) => cat.slug === category)

  if (!categoryData || faqs.length === 0) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{categoryData.title}</h1>
        <p className="text-gray-600">
          Find answers to frequently asked questions about {categoryData.title.toLowerCase()}
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <Card key={faq._id} className="border border-gray-200">
            <Collapsible>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-left text-lg font-medium text-gray-900">{faq.question}</CardTitle>
                    <ChevronDown className="h-5 w-5 text-gray-500 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div
                    className="prose prose-sm max-w-none text-gray-700"
                    dangerouslySetInnerHTML={{ __html: faq.answer }}
                  />
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>

      {/* Navigation to other categories */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Other FAQ Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories
            .filter((cat) => cat.slug !== category)
            .map((cat) => (
              <Card key={cat.slug} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    <a href={`/faq/${cat.slug}`} className="hover:text-blue-600 transition-colors">
                      {cat.title}
                    </a>
                  </CardTitle>
                  <CardDescription className="text-sm">{cat.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
        </div>
      </div>
    </div>
  )
}
