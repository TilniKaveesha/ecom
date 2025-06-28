import type { Metadata } from "next"
import UserPaymentLinks from "@/components/user/user-payemnt-links"

export const metadata: Metadata = {
  title: "My Payment Links",
  description: "View and manage your PayWay payment links",
}

export default function PaymentLinksPage() {
  return (
    <div className="container mx-auto py-6">
      <UserPaymentLinks />
    </div>
  )
}
