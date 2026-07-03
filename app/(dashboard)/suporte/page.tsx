import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import SuporteClient from "./SuporteClient"

export const metadata: Metadata = {
  title: "SureBet AI",
  description: "Tire suas dúvidas sobre a SurebetFlow com nosso assistente virtual.",
}

export default async function SuportePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  return <SuporteClient />
}
