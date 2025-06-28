import type React from "react"
import Link from "next/link"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { User, Package, Settings, CreditCard, ChevronRight } from "lucide-react"

const accountNavItems = [
  {
    title: "Profile",
    href: "/account",
    icon: User,
    description: "View and edit your profile information",
  },
  {
    title: "Orders",
    href: "/account/orders",
    icon: Package,
    description: "View your order history and track shipments",
  },
  {
    title: "Payment Links",
    href: "/account/payment-links",
    icon: CreditCard,
    description: "View and manage your PayWay payment links",
  },
  {
    title: "Settings",
    href: "/account/manage",
    icon: Settings,
    description: "Manage your account settings and preferences",
  },
]

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/sign-in")
  }

  return (
    <div className="container mx-auto py-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">Account</h2>
                <p className="text-sm text-muted-foreground">Manage your account settings</p>
              </div>
              <nav className="mt-6 space-y-2">
                {accountNavItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <Button variant="ghost" className="w-full justify-start h-auto p-3 text-left">
                      <div className="flex items-center gap-3 w-full">
                        <item.icon className="h-4 w-4 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{item.title}</div>
                          <div className="text-xs text-muted-foreground truncate">{item.description}</div>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0" />
                      </div>
                    </Button>
                  </Link>
                ))}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">{children}</div>
      </div>
    </div>
  )
}
