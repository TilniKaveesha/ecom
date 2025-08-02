/* eslint-disable @typescript-eslint/no-unused-vars */
import { getFaqById } from "@/lib/actions/faq.actions"
import { FaqForm } from "../faq-form"
import { notFound } from "next/navigation"

interface EditFaqPageProps {
  params: {
    id: string
  }
}

export default async function EditFaqPage({ params }: EditFaqPageProps) {
  const { id } = await params

  try {
    const faq = await getFaqById(id)

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Edit FAQ</h1>
          <p className="text-gray-600">Update the frequently asked question</p>
        </div>
        <FaqForm type="update" faq={faq} />
      </div>
    )
  } catch (error) {
    notFound()
  }
}
