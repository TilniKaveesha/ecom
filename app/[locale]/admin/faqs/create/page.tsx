import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getFaqById } from "@/lib/actions/faq.actions"
import { FaqForm } from "../faq-form"

interface EditFaqPageProps {
  params: Promise<{
    id: string
    locale: string
  }>
}

export async function generateMetadata({ params }: EditFaqPageProps) {
  const { id } = await params
  const faq = await getFaqById(id)

  return {
    title: faq ? `Edit FAQ: ${faq.question}` : "FAQ Not Found",
    description: faq ? `Edit FAQ: ${faq.question}` : "The requested FAQ could not be found",
  }
}

export default async function EditFaqPage({ params }: EditFaqPageProps) {
  const { id } = await params
  const faq = await getFaqById(id)

  if (!faq) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit FAQ</h1>
        <p className="text-gray-600 mt-1">Update the frequently asked question</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>FAQ Details</CardTitle>
          <CardDescription>Update the information below to modify the FAQ entry</CardDescription>
        </CardHeader>
        <CardContent>
          <FaqForm faq={faq} />
        </CardContent>
      </Card>
    </div>
  )
}
