import { createAdminClient } from "@/lib/supabase/admin"
import ApostasAdminClient from "./ApostasAdminClient"

export default async function AdminApostasPage() {
  const supabase = createAdminClient()
  const { data: apostas } = await supabase
    .from("apostas")
    .select("id, evento, esporte, tipo, investimento_total, lucro_garantido, resultado_real, roi_percentual, status, created_at, profile:profiles(nome, sobrenome, apelido)")
    .order("created_at", { ascending: false })
    .limit(1000)

  return <ApostasAdminClient apostas={apostas ?? []} />
}
