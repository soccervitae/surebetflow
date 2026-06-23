import Image from "next/image"
import Link from "next/link"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-3">
            <Image src="https://gkkuttabavwxjuibmrnr.supabase.co/storage/v1/object/public/logos/surebetflow-horizontal-vazada-branca%20(1).png" alt="SurebetFlow" width={280} height={72} priority />
          </Link>
          <p className="text-gray-500 text-sm mt-2">Gerenciador de Apostas Seguras</p>
        </div>
        <div className="bg-[#111] border border-white/5 rounded-2xl p-8">
          {children}
        </div>
        <p className="text-center text-xs text-gray-600 mt-6">
          © 2026 SurebetFlow. Todos os direitos reservados.
        </p>
      </div>
    </div>
  )
}
