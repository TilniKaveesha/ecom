import Image from "next/image"
import Link from "next/link"
import type React from "react"
import Menu from "@/components/shared/header/menu"
import { AdminNav } from "./admin-nav"
import { getSetting } from "@/lib/actions/setting.actions"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { site } = await getSetting()
  return (
    <>
      <div className="flex flex-col">
        <div className="bg-black text-white">
          <div className="flex h-16 items-center px-2">
            <Link href="/">
              {site.logo ? (
                <Image src={site.logo || "/placeholder.svg"} width={48} height={48} alt={`${site.name} logo`} />
              ) : (
                <div className="w-12 h-12 bg-white rounded flex items-center justify-center text-black font-bold">
                  {site.name.charAt(0)}
                </div>
              )}
            </Link>
            <AdminNav className="mx-6 hidden md:flex" />
            <div className="ml-auto flex items-center space-x-4">
              <Menu forAdmin />
            </div>
          </div>
          <div>
            <AdminNav className="flex md:hidden px-4 pb-2" />
          </div>
        </div>
        <div className="flex-1 p-4">{children}</div>
      </div>
    </>
  )
}
