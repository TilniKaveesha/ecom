import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FaqForm } from "../faq-form"
import { getFaqById } from "@/lib/actions/faq.actions"
import { notFound } from "next/navigation"

interface EditFaqPageProps {
  params: Promise<{
    id: string
    locale: string
  }>
}

export async function generateMetadata({ params }: EditFaqPageProps) {
  const { id } = await params
  const faq = await getFaqById(id)

  if (!faq) {
    return {
      title: "FAQ Not Found",
    }
  }

  return {
    title: `Edit FAQ: ${faq.question} - Admin`,
    description: `Edit FAQ: ${faq.question}`,
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
        <p className="text-gray-600 mt-1">Update the FAQ details</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>FAQ Details</CardTitle>
          <CardDescription>Update the FAQ information below</CardDescription>
        </CardHeader>
        <CardContent>
          <FaqForm faq={faq} />
        </CardContent>
      </Card>
    </div>
  )
}
