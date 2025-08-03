/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { connectToDatabase } from "@/lib/db"
import FAQ from "@/lib/db/models/faq.model"
import type { CreateFAQInput, UpdateFAQInput, FAQ as FAQType, FAQCategory, PopularFAQ } from "@/types"
import { revalidatePath } from "next/cache"

// Get all FAQs
export async function getAllFaqs(): Promise<FAQType[]> {
  try {
    await connectToDatabase()
    const faqs = await FAQ.find({}).sort({ displayOrder: 1, createdAt: -1 }).lean()
    return JSON.parse(JSON.stringify(faqs))
  } catch (error) {
    console.error("Error fetching FAQs:", error)
    return []
  }
}

// Get FAQs by category
export async function getFaqsByCategory(categorySlug: string): Promise<FAQType[]> {
  try {
    await connectToDatabase()
    const faqs = await FAQ.find({
      categorySlug,
      isPublished: true,
    })
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean()

    return JSON.parse(JSON.stringify(faqs))
  } catch (error) {
    console.error("Error fetching FAQs by category:", error)
    return []
  }
}

// Get FAQ categories with counts
export async function getFaqCategories(): Promise<FAQCategory[]> {
  try {
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
        description: "Shipping methods, delivery times, and tracking",
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
        description: "Return policies, exchanges, and warranty information",
        icon: "↩️",
      },
      {
        slug: "refunds",
        title: "Refund Purchase",
        description: "Refund processes, timelines, and policies",
        icon: "💰",
      },
    ]

    // Get FAQ counts for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const count = await FAQ.countDocuments({
          categorySlug: category.slug,
          isPublished: true,
        })
        return {
          ...category,
          faqCount: count,
        }
      }),
    )

    return categoriesWithCounts
  } catch (error) {
    console.error("Error fetching FAQ categories:", error)
    return []
  }
}

// Get popular FAQs
export async function getPopularFaqs(limit = 5): Promise<PopularFAQ[]> {
  try {
    await connectToDatabase()
    const faqs = await FAQ.find({ isPublished: true }).sort({ views: -1, createdAt: -1 }).limit(limit).lean()

    const categories = await getFaqCategories()
    const categoryMap = categories.reduce(
      (acc, cat) => {
        acc[cat.slug] = cat.title
        return acc
      },
      {} as Record<string, string>,
    )

    const popularFaqs = faqs.map((faq: any) => ({
      ...faq,
      categoryTitle: categoryMap[faq.categorySlug] || faq.category,
    }))

    return JSON.parse(JSON.stringify(popularFaqs))
  } catch (error) {
    console.error("Error fetching popular FAQs:", error)
    return []
  }
}

// Get FAQ by ID
export async function getFaqById(id: string): Promise<FAQType | null> {
  try {
    await connectToDatabase()
    const faq = await FAQ.findById(id).lean()
    return faq ? JSON.parse(JSON.stringify(faq)) : null
  } catch (error) {
    console.error("Error fetching FAQ by ID:", error)
    return null
  }
}

// Create FAQ
export async function createFaq(data: CreateFAQInput): Promise<{ success: boolean; message: string; data?: FAQType }> {
  try {
    await connectToDatabase()

    const categorySlug = data.category.toLowerCase().replace(/\s+/g, "-")

    const faq = await FAQ.create({
      ...data,
      categorySlug,
      views: 0,
    })

    revalidatePath("/admin/faqs")
    revalidatePath("/faq")
    revalidatePath(`/faq/${categorySlug}`)

    return {
      success: true,
      message: "FAQ created successfully",
      data: JSON.parse(JSON.stringify(faq)),
    }
  } catch (error) {
    console.error("Error creating FAQ:", error)
    return {
      success: false,
      message: "Failed to create FAQ",
    }
  }
}

// Update FAQ
export async function updateFaq(data: UpdateFAQInput): Promise<{ success: boolean; message: string; data?: FAQType }> {
  try {
    await connectToDatabase()

    const updateData = { ...data }
    if (data.category) {
      updateData.category = data.category.toLowerCase().replace(/\s+/g, "-")
    }

    const faq = await FAQ.findByIdAndUpdate(data._id, updateData, { new: true }).lean()

    if (!faq) {
      return {
        success: false,
        message: "FAQ not found",
      }
    }

    revalidatePath("/admin/faqs")
    revalidatePath("/faq")

    return {
      success: true,
      message: "FAQ updated successfully",
      data: JSON.parse(JSON.stringify(faq)),
    }
  } catch (error) {
    console.error("Error updating FAQ:", error)
    return {
      success: false,
      message: "Failed to update FAQ",
    }
  }
}

// Delete FAQ
export async function deleteFaq(id: string): Promise<{ success: boolean; message: string }> {
  try {
    await connectToDatabase()

    const faq = await FAQ.findByIdAndDelete(id)

    if (!faq) {
      return {
        success: false,
        message: "FAQ not found",
      }
    }

    revalidatePath("/admin/faqs")
    revalidatePath("/faq")
    revalidatePath(`/faq/${faq.categorySlug}`)

    return {
      success: true,
      message: "FAQ deleted successfully",
    }
  } catch (error) {
    console.error("Error deleting FAQ:", error)
    return {
      success: false,
      message: "Failed to delete FAQ",
    }
  }
}

// Search FAQs
export async function searchFaqs(query: string): Promise<FAQType[]> {
  try {
    await connectToDatabase()

    const faqs = await FAQ.find({
      isPublished: true,
      $or: [
        { question: { $regex: query, $options: "i" } },
        { answer: { $regex: query, $options: "i" } },
        { tags: { $in: [new RegExp(query, "i")] } },
      ],
    })
      .sort({ views: -1, createdAt: -1 })
      .lean()

    return JSON.parse(JSON.stringify(faqs))
  } catch (error) {
    console.error("Error searching FAQs:", error)
    return []
  }
}

// Increment FAQ views
export async function incrementFaqViews(id: string): Promise<void> {
  try {
    await connectToDatabase()
    await FAQ.findByIdAndUpdate(id, { $inc: { views: 1 } })
  } catch (error) {
    console.error("Error incrementing FAQ views:", error)
  }
}
