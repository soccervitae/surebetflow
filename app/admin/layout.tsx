import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import AdminLayoutClient from "./AdminLayoutClient"

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map(e => e.trim()).filter(Boolean)

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) {
    redirect("/dashboard")
  }

  return <AdminLayoutClient>{children}</AdminLayoutClient>
}
