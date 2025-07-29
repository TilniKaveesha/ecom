import { Schema, model, models } from "mongoose"

const PaymentLinkSchema = new Schema(
  {
    orderId: {
      type: String,
      required: true,
      index: true,
    },
    paymentLink: {
      type: String,
      required: true,
    },
    paymentLinkId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      enum: ["USD", "KHR"],
    },
    status: {
      type: String,
      enum: ["pending", "paid", "expired", "cancelled"],
      default: "pending",
    },
    customerInfo: {
      name: String,
      email: String,
      phone: String,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    paidAt: Date,
    webhookData: Schema.Types.Mixed,
  },
  {
    timestamps: true,
  },
)

export const PaymentLink = models.PaymentLink || model("PaymentLink", PaymentLinkSchema)
