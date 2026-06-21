"use client"

import { useRouter } from "next/navigation"
import { ProfileForm } from "@/components/ProfileForm"
export default function OnboardingClient({ userId }: { userId: string }) {
  const router = useRouter()

  function handleSuccess() {
    router.push("/")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#16A34A] rounded-xl mb-4">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Configurar seu perfil</h1>
          <p className="text-gray-500 text-sm mt-2">
            Crie seu primeiro perfil para começar a gerenciar suas apostas
          </p>
        </div>
        <div className="bg-white rounded-xl border border-[#E5E1D8] p-6 shadow-sm">
          <ProfileForm userId={userId} onSuccess={handleSuccess} />
        </div>
      </div>
    </div>
  )
}
