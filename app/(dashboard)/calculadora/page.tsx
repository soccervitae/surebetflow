import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import CalculadoraClient from "./CalculadoraClient"

export const metadata: Metadata = {
  title: "Calculadora de Surebet",
  description: "Calcule stakes, lucro garantido e ROI para qualquer oportunidade de arbitragem com 2 ou 3 legs.",
}

export default async function CalculadoraPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const params = await searchParams

  return (
    <CalculadoraClient
      initialOddsA={params.odds_a ?? ""}
      initialOddsB={params.odds_b ?? ""}
      initialOddsC={params.odds_c ?? ""}
      initialInvestimento={params.investimento ?? ""}
      initialSelA={params.sel_a ?? ""}
      initialSelB={params.sel_b ?? ""}
      initialSelC={params.sel_c ?? ""}
      initialBookA={params.book_a ?? ""}
      initialBookB={params.book_b ?? ""}
      initialBookC={params.book_c ?? ""}
    />
  )
}
