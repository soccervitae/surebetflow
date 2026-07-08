import Link from "next/link"
import Image from "next/image"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-base)] px-4">
      <div className="flex flex-col items-center text-center max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-10">
          <Image src="/logo-light.svg" alt="SurebetFlow" width={32} height={32} className="block dark:hidden" />
          <Image src="/logo-dark.svg" alt="SurebetFlow" width={32} height={32} className="hidden dark:block" />
          <span className="text-xl font-bold text-[var(--text-primary)]">SurebetFlow</span>
        </div>

        {/* 404 */}
        <p className="text-8xl font-extrabold text-[#1e3a8a] leading-none mb-4">404</p>

        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Página não encontrada</h1>
        <p className="text-[var(--text-secondary)] text-sm mb-8">
          A página que você está procurando não existe ou foi removida.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-lg bg-[#1e3a8a] text-white text-sm font-medium hover:bg-[#1e40af] transition-colors text-center"
          >
            Ir para o Dashboard
          </Link>
          <Link
            href="/apostas"
            className="px-5 py-2.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] text-sm font-medium hover:bg-[var(--bg-elevated)] transition-colors text-center"
          >
            Ver Apostas
          </Link>
        </div>
      </div>
    </div>
  )
}
