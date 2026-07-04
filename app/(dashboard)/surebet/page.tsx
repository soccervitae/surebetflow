import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { SurebetRow } from "@/lib/types/surebet"
import SurebetClient from "./SurebetClient"

export const metadata: Metadata = {
  title: "Surebets",
  description: "Oportunidades de arbitragem esportiva detectadas em tempo real, com filtros por sport, casa de apostas e profit%.",
}

export default async function SurebetPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data } = await supabase
    .from("surebet_dashboard")
    .select("*")
    .order("profit_pct", { ascending: false })

  return <SurebetClient initialData={(data ?? []) as SurebetRow[]} />
}
