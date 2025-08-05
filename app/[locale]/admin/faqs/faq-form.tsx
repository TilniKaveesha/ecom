/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import type React from "react"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { createFaq, updateFaq } from "@/lib/actions/faq.actions"
import { insertFaqSchema } from "@/lib/validator"
import type { FAQ } from "@/types"
import { X } from "lucide-react"
import type { z } from "zod"

type FormData = z.infer<typeof insertFaqSchema>

interface FaqFormProps {
  faq?: FAQ
}

const categories = [
  { value: "general", label: "General Info" },
  { value: "payments", label: "Payment Methods" },
  { value: "delivery", label: "Delivery Options" },
  { value: "order-status", label: "Order Status" },
  { value: "returns", label: "Exchange and Returns" },
  { value: "refunds", label: "Refund Purchase" },
]

export function FaqForm({ faq }: FaqFormProps) {
  console.log("📦 Faq received in FaqForm:", faq)

  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [tagInput, setTagInput] = useState("")

  const form = useForm<FormData>({
    resolver: zodResolver(insertFaqSchema),
    defaultValues: {
      question: faq?.question || "",
      answer: faq?.answer || "",
      category: faq?.category || "",
      tags: faq?.tags || [],
      isPublished: faq?.isPublished || false,
      displayOrder: faq?.displayOrder || 0,
    },
  })

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      try {
        const result = faq ? await updateFaq({ ...data, _id: faq._id }) : await createFaq(data)

        if (result.success) {
          toast({
            description: result.message,
          })
          router.push("/admin/faqs")
        } else {
          toast({
            variant: "destructive",
            description: result.message,
          })
        }
      } catch (error) {
        toast({
          variant: "destructive",
          description: "An error occurred. Please try again.",
        })
      }
    })
  }

  const addTag = () => {
    if (tagInput.trim() && !form.getValues("tags").includes(tagInput.trim())) {
      const currentTags = form.getValues("tags")
      form.setValue("tags", [...currentTags, tagInput.trim()])
      setTagInput("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues("tags")
    form.setValue(
      "tags",
      currentTags.filter((tag) => tag !== tagToRemove),
    )
  }

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addTag()
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="question"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Question</FormLabel>
              <FormControl>
                <Input placeholder="Enter the frequently asked question..." {...field} />
              </FormControl>
              <FormDescription>The question that users frequently ask (max 500 characters)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="answer"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Answer</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter the detailed answer..." className="min-h-[120px]" {...field} />
              </FormControl>
              <FormDescription>The detailed answer to the question. You can use HTML for formatting.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Choose the category that best fits this FAQ</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tags</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a tag..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={handleTagInputKeyPress}
                    />
                    <Button type="button" onClick={addTag} variant="outline">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {field.value.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                      </Badge>
                    ))}
                  </div>
                </div>
              </FormControl>
              <FormDescription>Add tags to help users find this FAQ more easily</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="displayOrder"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Order</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="0"
                  {...field}
                  onChange={(e) => field.onChange(Number.parseInt(e.target.value) || 0)}
                />
              </FormControl>
              <FormDescription>Lower numbers appear first. Use 0 for default ordering.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isPublished"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Published</FormLabel>
                <FormDescription>Make this FAQ visible to users on the website</FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : faq ? "Update FAQ" : "Create FAQ"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/admin/faqs")}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
