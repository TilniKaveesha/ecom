import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FaqForm } from "../faq-form"

export const metadata = {
  title: "Create FAQ - Admin",
  description: "Create a new frequently asked question",
}

export default function CreateFaqPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create FAQ</h1>
        <p className="text-gray-600 mt-1">Add a new frequently asked question</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>FAQ Details</CardTitle>
          <CardDescription>Fill in the information below to create a new FAQ entry</CardDescription>
        </CardHeader>
        <CardContent>
          <FaqForm />
        </CardContent>
      </Card>
    </div>
  )
}
