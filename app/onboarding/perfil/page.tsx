"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ProfileForm } from "@/components/ProfileForm"
export default function OnboardingPerfilPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [userId, setUserId] = useState("")

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push("/login"); return }
      const { count } = await supabase.from("profiles").select("id", { count: "exact", head: true })
      if (count && count > 0) { router.push("/"); return }
      setUserId(user.id)
      setChecking(false)
    })
  }, [router])

  if (checking) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <p className="text-gray-500">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#16A34A] rounded-xl mb-4">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Bem-vindo ao SureBetFlow!</h1>
          <p className="text-gray-500 text-sm mt-2">
            Antes de começar, crie seu primeiro perfil de apostador.
          </p>
        </div>
        <div className="bg-white rounded-xl border border-[#E5E1D8] p-6 shadow-sm">
          <ProfileForm
            userId={userId}
            onSuccess={() => router.push("/")}
          />
        </div>
      </div>
    </div>
  )
}
