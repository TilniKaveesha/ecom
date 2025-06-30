"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type React from "react"

import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

const links = [
  {
    title: "Overview",
    href: "/admin/overview",
  },
  {
    title: "Products",
    href: "/admin/products",
  },
  {
    title: "Orders",
    href: "/admin/orders",
  },
  {title:"Payment Link",
    href:"/admin/payment-links"
  },
  {
    title: "Users",
    href: "/admin/users",
  },
  {
    title: "Pages",
    href: "/admin/web-pages",
  },
  {
    title: "Settings",
    href: "/admin/settings",
  },
]
export function AdminNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname()
  const t = useTranslations("Admin")
  return (
    <nav className={cn("flex items-center flex-wrap overflow-hidden gap-2 md:gap-4", className)} {...props}>
      {links.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "px-3 py-2 rounded-md text-sm font-medium transition-colors hover:text-white",
            pathname.includes(item.href) ? "bg-white/10 text-white" : "text-gray-300 hover:bg-white/5",
          )}
        >
          {t(item.title)}
        </Link>
      ))}
    </nav>
  )
}
