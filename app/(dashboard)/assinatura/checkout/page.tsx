import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getMpPublicKey } from "@/lib/settings"
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

  const publicKey = await getMpPublicKey()

  if (!publicKey) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <p className="text-[var(--text-secondary)]">Pagamento temporariamente indisponível. Tente mais tarde.</p>
      </div>
    )
  }

  return <CheckoutClient publicKey={publicKey} userEmail={user.email ?? ""} />
}
