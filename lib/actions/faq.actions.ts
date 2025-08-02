"use server"

import { revalidatePath } from "next/cache"
import { connectToDatabase } from "@/lib/db"
import Faq, { type IFaq } from "@/lib/db/models/faq.model"
import { formatError } from "@/lib/utils"
import { FaqInputSchema, FaqUpdateSchema } from "../validator"
import type { z } from "zod"

// CREATE
export async function createFaq(data: z.infer<typeof FaqInputSchema>) {
  try {
    const faq = FaqInputSchema.parse(data)
    await connectToDatabase()
    await Faq.create(faq)
    revalidatePath("/admin/faqs")
    return {
      success: true,
      message: "FAQ created successfully",
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// UPDATE
export async function updateFaq(data: z.infer<typeof FaqUpdateSchema>) {
  try {
    const faq = FaqUpdateSchema.parse(data)
    await connectToDatabase()
    await Faq.findByIdAndUpdate(faq._id, faq)
    revalidatePath("/admin/faqs")
    return {
      success: true,
      message: "FAQ updated successfully",
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// DELETE
export async function deleteFaq(id: string) {
  try {
    await connectToDatabase()
    const res = await Faq.findByIdAndDelete(id)
    if (!res) throw new Error("FAQ not found")
    revalidatePath("/admin/faqs")
    return {
      success: true,
      message: "FAQ deleted successfully",
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// GET ALL
export async function getAllFaqs() {
  await connectToDatabase()
  const faqs = await Faq.find().sort({ order: 1, createdAt: -1 })
  return JSON.parse(JSON.stringify(faqs)) as IFaq[]
}

// GET BY ID
export async function getFaqById(faqId: string) {
  await connectToDatabase()
  const faq = await Faq.findById(faqId)
  if (!faq) throw new Error("FAQ not found")
  return JSON.parse(JSON.stringify(faq)) as IFaq
}

// GET BY CATEGORY
export async function getFaqsByCategory(categorySlug: string) {
  await connectToDatabase()
  const faqs = await Faq.find({
    category: categorySlug,
    isPublished: true,
  }).sort({ order: 1, createdAt: -1 })
  return JSON.parse(JSON.stringify(faqs)) as IFaq[]
}

// GET CATEGORIES
export async function getFaqCategories() {
  await connectToDatabase()

  const categories = [
    {
      slug: "general",
      title: "General Info",
      description: "Basic information about our services and policies",
      icon: "📋",
    },
    {
      slug: "payments",
      title: "Payment Methods",
      description: "Information about payment options and billing",
      icon: "💳",
    },
    {
      slug: "delivery",
      title: "Delivery Options",
      description: "Shipping methods, costs, and delivery times",
      icon: "🚚",
    },
    {
      slug: "order-status",
      title: "Order Status",
      description: "Track your orders and understand order statuses",
      icon: "📦",
    },
    {
      slug: "returns",
      title: "Exchange and Returns",
      description: "Return policy, exchanges, and return process",
      icon: "↩️",
    },
    {
      slug: "refunds",
      title: "Refund Purchase",
      description: "Refund policy and refund process information",
      icon: "💰",
    },
  ]

  // Get FAQ count for each category
  const categoriesWithCount = await Promise.all(
    categories.map(async (category) => {
      const count = await Faq.countDocuments({
        category: category.slug,
        isPublished: true,
      })
      return {
        ...category,
        faqCount: count,
      }
    }),
  )

  return categoriesWithCount
}

// GET POPULAR FAQS
export async function getPopularFaqs(limit = 5) {
  await connectToDatabase()
  const faqs = await Faq.find({ isPublished: true }).sort({ views: -1, createdAt: -1 }).limit(limit)

  const categories = await getFaqCategories()

  const faqsWithCategory = faqs.map((faq) => {
    const category = categories.find((cat) => cat.slug === faq.category)
    return {
      ...faq.toObject(),
      categoryTitle: category?.title || faq.category,
    }
  })

  return JSON.parse(JSON.stringify(faqsWithCategory))
}

// SEARCH FAQS
export async function searchFaqs(query: string) {
  await connectToDatabase()
  const faqs = await Faq.find({
    isPublished: true,
    $or: [
      { question: { $regex: query, $options: "i" } },
      { answer: { $regex: query, $options: "i" } },
      { tags: { $in: [new RegExp(query, "i")] } },
    ],
  }).sort({ views: -1, createdAt: -1 })

  return JSON.parse(JSON.stringify(faqs)) as IFaq[]
}
