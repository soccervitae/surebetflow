import type { Metadata } from "next"
import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import AssinaturaClient from "./AssinaturaClient"

export const metadata: Metadata = {
  title: "Assinatura",
  description: "Gerencie seu plano SurebetFlow. Assine, atualize a forma de pagamento e acompanhe o status da sua assinatura.",
}

export default async function AssinaturaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .single()

  return (
    <Suspense fallback={null}>
      <AssinaturaClient subscription={subscription} />
    </Suspense>
  )
}
