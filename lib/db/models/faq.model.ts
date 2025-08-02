import type { IFaqInput } from "@/types"
import { type Document, type Model, model, models, Schema } from "mongoose"

export interface IFaq extends Document, IFaqInput {
  _id: string
  createdAt: Date
  updatedAt: Date
}

const faqSchema = new Schema<IFaq>(
  {
    question: {
      type: String,
      required: true,
    },
    answer: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["general", "payments", "delivery", "order-status", "returns", "refunds"],
    },
    tags: [
      {
        type: String,
      },
    ],
    isPublished: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
)

// Index for search functionality
faqSchema.index({ question: "text", answer: "text", tags: "text" })

const Faq = (models.Faq as Model<IFaq>) || model<IFaq>("Faq", faqSchema)

export default Faq
