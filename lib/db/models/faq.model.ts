import { Schema, model, models, type Document } from "mongoose"

export interface IFAQ extends Document {
  question: string
  answer: string
  category: string
  categorySlug: string
  tags: string[]
  isPublished: boolean
  views: number
  displayOrder: number
  createdAt: Date
  updatedAt: Date
}

const faqSchema = new Schema<IFAQ>(
  {
    question: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    categorySlug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    isPublished: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
)

// Create indexes for better search performance
faqSchema.index({ question: "text", answer: "text", tags: "text" })
faqSchema.index({ categorySlug: 1, isPublished: 1 })
faqSchema.index({ views: -1 })
faqSchema.index({ displayOrder: 1 })

const FAQ = models.FAQ || model<IFAQ>("FAQ", faqSchema)

export default FAQ
