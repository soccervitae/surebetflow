import Link from "next/link"
import ForceLight from "./ForceLight"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ForceLight />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://gkkuttabavwxjuibmrnr.supabase.co/storage/v1/object/public/logos/SUREBETFLOW%20LOGOSS%20LIGHT.png"
                alt="SurebetFlow"
                className="h-12 w-auto mx-auto"
              />
            </Link>
            <p className="text-gray-500 text-sm mt-1">Sistema de Gestão para Apostadores</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
            {children}
          </div>
          <p className="text-center text-xs text-gray-400 mt-6">
            © 2026 SurebetFlow. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </>
  )
}
