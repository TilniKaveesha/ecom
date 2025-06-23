import type { Metadata } from "next"

import OverviewReport from "./overview-report"
import { auth } from "@/auth"
export const metadata: Metadata = {
  title: "Admin Dashboard",
}
const DashboardPage = async () => {
  const session = await auth()

  if (!session) {
    throw new Error("Authentication required")
  }

  if (session.user.role !== "Admin") {
    throw new Error("Admin permission required")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {session.user.name}</p>
      </div>
      <OverviewReport />
    </div>
  )
}

export default DashboardPage
