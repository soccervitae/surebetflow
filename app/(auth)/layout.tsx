import Link from "next/link"
import { TrendingUp } from "lucide-react"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-[#16A34A] rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-white text-xl">SureBetFlow</span>
          </Link>
          <p className="text-gray-500 text-sm mt-2">Gerenciador de Apostas Seguras</p>
        </div>
        <div className="bg-[#111] border border-white/5 rounded-2xl p-8">
          {children}
        </div>
        <p className="text-center text-xs text-gray-600 mt-6">
          © 2026 SureBetFlow. Todos os direitos reservados.
        </p>
      </div>
    </div>
  )
}
