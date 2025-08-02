import { FaqForm } from "../faq-form"

export const metadata = {
  title: "Create FAQ",
  description: "Create a new frequently asked question",
}

export default function CreateFaqPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create FAQ</h1>
        <p className="text-gray-600">Add a new frequently asked question</p>
      </div>
      <FaqForm type="create" />
    </div>
  )
}
