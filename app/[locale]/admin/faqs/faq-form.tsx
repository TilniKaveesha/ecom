/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/hooks/use-toast"
import { createFaq, updateFaq } from "@/lib/actions/faq.actions"
import { FaqInputSchema } from "@/lib/validator"
import type { IFaq } from "@/lib/db/models/faq.model"

type FaqFormData = z.infer<typeof FaqInputSchema>

interface FaqFormProps {
  type: "create" | "update"
  faq?: IFaq
}

export function FaqForm({ type, faq }: FaqFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [tags, setTags] = useState<string[]>(faq?.tags || [])
  const [tagInput, setTagInput] = useState("")

  const form = useForm<FaqFormData>({
    resolver: zodResolver(FaqInputSchema),
    defaultValues: {
      question: faq?.question || "",
      answer: faq?.answer || "",
      category: faq?.category || "general",
      tags: faq?.tags || [],
      isPublished: faq?.isPublished ?? true,
      order: faq?.order || 0,
    },
  })

  const categories = [
    { value: "general", label: "General Info" },
    { value: "payments", label: "Payment Methods" },
    { value: "delivery", label: "Delivery Options" },
    { value: "order-status", label: "Order Status" },
    { value: "returns", label: "Exchange and Returns" },
    { value: "refunds", label: "Refund Purchase" },
  ]

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      const newTags = [...tags, tagInput.trim()]
      setTags(newTags)
      form.setValue("tags", newTags)
      setTagInput("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter((tag) => tag !== tagToRemove)
    setTags(newTags)
    form.setValue("tags", newTags)
  }

  const onSubmit = (data: FaqFormData) => {
    startTransition(async () => {
      const result = type === "create" ? await createFaq(data) : await updateFaq({ ...data, _id: faq!._id })

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        router.push("/admin/faqs")
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{type === "create" ? "Create" : "Update"} FAQ</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="question">Question</Label>
            <Input id="question" {...form.register("question")} placeholder="Enter the question" />
            {form.formState.errors.question && (
              <p className="text-sm text-red-600">{form.formState.errors.question.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="answer">Answer</Label>
            <Textarea id="answer" {...form.register("answer")} placeholder="Enter the answer (HTML allowed)" rows={6} />
            {form.formState.errors.answer && (
              <p className="text-sm text-red-600">{form.formState.errors.answer.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={form.watch("category")} onValueChange={(value) => form.setValue("category", value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add a tag"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag} variant="outline">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm flex items-center gap-1"
                >
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="text-blue-600 hover:text-blue-800">
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="order">Order</Label>
            <Input
              id="order"
              type="number"
              {...form.register("order", { valueAsNumber: true })}
              placeholder="Display order (0 = first)"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isPublished"
              checked={form.watch("isPublished")}
              onCheckedChange={(checked) => form.setValue("isPublished", checked)}
            />
            <Label htmlFor="isPublished">Published</Label>
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : type === "create" ? "Create FAQ" : "Update FAQ"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push("/admin/faqs")}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
