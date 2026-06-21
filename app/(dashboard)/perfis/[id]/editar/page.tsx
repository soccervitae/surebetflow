import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import EditarPerfilClient from "./EditarPerfilClient"

export default async function EditarPerfilPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single()

  if (error || !profile) notFound()

  return <EditarPerfilClient profile={profile} />
}
