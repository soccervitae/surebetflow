import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import CheckoutClient from "./CheckoutClient"

export default async function CheckoutPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", user.id)
    .single()

  if (sub?.status === "active" || sub?.status === "trialing") redirect("/assinatura")

  return (
    <Suspense fallback={null}>
      <CheckoutClient />
    </Suspense>
  )
}
