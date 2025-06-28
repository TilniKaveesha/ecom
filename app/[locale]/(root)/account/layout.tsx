import type React from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { auth } from "@/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { User, ShoppingBag, Settings, CreditCard, ChevronRight } from "lucide-react"

export const metadata: Metadata = {
  title: "My Account",
  description: "Manage your account settings and view your orders",
}

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
    icon: ShoppingBag,
    description: "Track your orders and view order history",
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

interface AccountLayoutProps {
  children: React.ReactNode
  params: { locale: string }
}

export default async function AccountLayout({ children, params }: AccountLayoutProps) {
  const session = await auth()

  if (!session?.user) {
    notFound()
  }

  return (
    <div className="container mx-auto py-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">My Account</CardTitle>
              <CardDescription>Welcome back, {session.user.name || session.user.email}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <nav className="space-y-1">
                {accountNavItems.map((item, index) => (
                  <div key={item.href}>
                    <Link href={`/${params.locale}${item.href}`}>
                      <Button variant="ghost" className="w-full justify-start h-auto p-4 text-left">
                        <div className="flex items-center space-x-3 w-full">
                          <item.icon className="h-5 w-5 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">{item.title}</div>
                            <div className="text-sm text-muted-foreground truncate">{item.description}</div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </Button>
                    </Link>
                    {index < accountNavItems.length - 1 && <Separator className="mx-4" />}
                  </div>
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
