import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import DicasClient from "./DicasClient"

export default async function DicasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  return <DicasClient />
}
