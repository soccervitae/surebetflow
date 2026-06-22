import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import SurebetCalculator from "@/components/SurebetCalculator"

export default async function CalculadoraPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .order("nome")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Calculadora de Surebet</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">
          Calcule apostas seguras e salve automaticamente no sistema
        </p>
      </div>
      <SurebetCalculator profiles={profiles ?? []} />
    </div>
  )
}
