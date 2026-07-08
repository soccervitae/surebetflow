import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import DicasClient from "./DicasClient"

export const metadata: Metadata = {
  title: "Dicas de Parcerias",
  description: "Aprenda como iniciar e gerenciar parcerias com segurança para ampliar sua operação de surebets.",
}

export default async function DicasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", user.id)
    .single()

  const isActive = sub?.status === "active" || sub?.status === "trialing"
  if (!isActive) redirect("/assinatura")

  return <DicasClient />
}
