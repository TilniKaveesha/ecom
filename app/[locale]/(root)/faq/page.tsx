/* eslint-disable react/no-unescaped-entities */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, HelpCircle, MessageCircle, Phone, Mail } from "lucide-react"
import { getFaqCategories, getPopularFaqs } from "@/lib/actions/faq.actions"
import Link from "next/link"

export const metadata = {
  title: "FAQ - Frequently Asked Questions",
  description: "Find answers to frequently asked questions about our products and services",
}

export default async function FaqPage() {
  const categories = await getFaqCategories()
  const popularFaqs = await getPopularFaqs(6)

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <HelpCircle className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Get quick answers to common questions about our products, services, and policies
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto mb-12">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder="Search for answers..."
            className="pl-10 pr-4 py-3 text-lg border-2 border-gray-200 focus:border-blue-500 rounded-lg"
          />
        </div>
      </div>

      {/* FAQ Categories */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Browse by Category</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Link key={category.slug} href={`/faq/${category.slug}`}>
              <Card className="h-full hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer border-2 hover:border-blue-200">
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-3">
                    <div className="p-3 bg-blue-50 rounded-full">
                      {category.icon && <span className="text-2xl">{category.icon}</span>}
                    </div>
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900 mb-2">{category.title}</CardTitle>
                  <CardDescription className="text-gray-600">{category.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0 text-center">
                  <Badge variant="secondary" className="text-sm">
                    {category.faqCount || 0} questions
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Popular Questions */}
      {popularFaqs.length > 0 && (
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Popular Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {popularFaqs.map((faq) => (
              <Card key={faq._id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-gray-900 leading-tight">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 line-clamp-3 mb-4">
                    {faq.answer.replace(/<[^>]*>/g, "").substring(0, 150)}...
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {faq.category}
                    </Badge>
                    <Link
                      href={`/faq/${faq.categorySlug}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Read more →
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Contact Support */}
      <div className="bg-gray-50 rounded-2xl p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Still need help?</h2>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          Can't find what you're looking for? Our support team is here to help you with any questions or concerns.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Card className="flex-1 max-w-sm">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-2">
                <MessageCircle className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg">Live Chat</CardTitle>
              <CardDescription>Get instant help from our support team</CardDescription>
            </CardHeader>
          </Card>
          <Card className="flex-1 max-w-sm">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-2">
                <Mail className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-lg">Email Support</CardTitle>
              <CardDescription>Send us a message and we'll respond within 24 hours</CardDescription>
            </CardHeader>
          </Card>
          <Card className="flex-1 max-w-sm">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-2">
                <Phone className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle className="text-lg">Phone Support</CardTitle>
              <CardDescription>Call us for immediate assistance</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  )
}
