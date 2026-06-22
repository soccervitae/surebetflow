"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { CreditCard, CheckCircle, Zap, Star, ExternalLink, AlertCircle, Clock } from "lucide-react"

type Subscription = {
  status: string
  plan: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  stripe_subscription_id: string | null
} | null

const PLAN_INFO = {
  starter: { name: "Starter", price: "R$ 79,90", color: "text-blue-400", features: ["3 perfis de apostador", "Casas ilimitadas por perfil", "Calculadora 2-way e 3-way", "Dashboard financeiro", "Suporte por ticket"] },
  pro: { name: "Pro", price: "R$ 199,90", color: "text-purple-400", features: ["Perfis ilimitados", "Casas ilimitadas por perfil", "Calculadora 2-way e 3-way", "Dashboard financeiro completo", "Suporte prioritário", "Relatórios avançados"] },
}

const STATUS_INFO: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  active:   { label: "Ativa",      color: "text-green-400",  bg: "bg-green-500/10",  icon: CheckCircle },
  trialing: { label: "Trial",      color: "text-blue-400",   bg: "bg-blue-500/10",   icon: Clock },
  past_due: { label: "Vencida",    color: "text-red-400",    bg: "bg-red-500/10",    icon: AlertCircle },
  canceled: { label: "Cancelada",  color: "text-gray-400",   bg: "bg-gray-500/10",   icon: AlertCircle },
  inactive: { label: "Inativa",    color: "text-gray-400",   bg: "bg-gray-500/10",   icon: AlertCircle },
}

export default function AssinaturaClient({ subscription }: { subscription: Subscription }) {
  const [loading, setLoading] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const success = searchParams.get("success")
  const canceled = searchParams.get("canceled")

  const isActive = subscription?.status === "active" || subscription?.status === "trialing"
  const planInfo = subscription?.plan ? PLAN_INFO[subscription.plan as keyof typeof PLAN_INFO] : null
  const statusInfo = STATUS_INFO[subscription?.status ?? "inactive"]
  const StatusIcon = statusInfo.icon

  async function handleCheckout(plan: "starter" | "pro") {
    setLoading(plan)
    const res = await fetch("/api/mp/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else setLoading(null)
  }

  async function handlePortal() {
    // MercadoPago doesn't have a self-serve portal — send to support
    window.location.href = "/suporte"
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-[#1e3a8a]/10 rounded-xl flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-[#1e3a8a]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Assinatura</h1>
          <p className="text-sm text-[var(--text-secondary)]">Gerencie seu plano do SureBetFlow</p>
        </div>
      </div>

      {/* Feedback banners */}
      {success && (
        <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-green-400 text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          Pagamento confirmado! Sua assinatura está ativa.
        </div>
      )}
      {canceled && (
        <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 text-yellow-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          Pagamento cancelado. Escolha um plano para continuar.
        </div>
      )}

      {/* Current subscription status */}
      {isActive && planInfo ? (
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Plano atual</p>
              <p className="text-xl font-bold text-[var(--text-primary)]">{planInfo.name}</p>
              <p className="text-[var(--text-secondary)] text-sm">{planInfo.price}/mês</p>
            </div>
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${statusInfo.bg} ${statusInfo.color}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {statusInfo.label}
            </span>
          </div>

          {subscription?.current_period_end && (
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              {subscription.cancel_at_period_end
                ? <span className="text-red-400">Cancela em {new Date(subscription.current_period_end).toLocaleDateString("pt-BR")}</span>
                : <>Próxima cobrança em <strong className="text-[var(--text-primary)]">{new Date(subscription.current_period_end).toLocaleDateString("pt-BR")}</strong></>
              }
            </p>
          )}

          <div className="grid grid-cols-2 gap-2 mb-5">
            {planInfo.features.map(f => (
              <div key={f} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <CheckCircle className="w-3.5 h-3.5 text-[#1e3a8a] flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>

          <button
            onClick={handlePortal}
            disabled={loading === "portal"}
            className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] hover:border-[#1e3a8a]/30 px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
          >
            <ExternalLink className="w-4 h-4" />
            Cancelar / Gerenciar via Suporte
          </button>
        </div>
      ) : (
        /* No active subscription — show plans */
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 text-center">
          <AlertCircle className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
          <p className="font-semibold text-[var(--text-primary)] mb-1">Nenhuma assinatura ativa</p>
          <p className="text-sm text-[var(--text-secondary)]">Escolha um plano abaixo para ter acesso completo.</p>
        </div>
      )}

      {/* Plans */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Starter */}
        <div className={`bg-[var(--bg-surface)] border rounded-2xl p-5 flex flex-col ${subscription?.plan === "starter" && isActive ? "border-[#1e3a8a]/50" : "border-[var(--border)]"}`}>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-[var(--text-primary)]">Starter</span>
            {subscription?.plan === "starter" && isActive && (
              <span className="ml-auto text-xs bg-[#1e3a8a]/20 text-[#1e3a8a] px-2 py-0.5 rounded-full">Atual</span>
            )}
          </div>
          <p className="text-2xl font-bold text-[var(--text-primary)] mb-0.5">R$ 79,90<span className="text-sm font-normal text-[var(--text-muted)]">/mês</span></p>
          <ul className="space-y-1.5 my-4 flex-1">
            {PLAN_INFO.starter.features.map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <CheckCircle className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" /> {f}
              </li>
            ))}
          </ul>
          <button
            onClick={() => handleCheckout("starter")}
            disabled={!!loading || (subscription?.plan === "starter" && isActive)}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 bg-[#1e3a8a] hover:bg-[#1e40af] text-white"
          >
            {loading === "starter" ? "Redirecionando..." : subscription?.plan === "starter" && isActive ? "Plano atual" : "Assinar Starter"}
          </button>
        </div>

        {/* Pro */}
        <div className={`bg-[var(--bg-surface)] border rounded-2xl p-5 flex flex-col relative overflow-hidden ${subscription?.plan === "pro" && isActive ? "border-purple-500/50" : "border-[var(--border)]"}`}>
          <div className="absolute top-3 right-3">
            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full font-medium">Mais popular</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-4 h-4 text-purple-400" />
            <span className="font-semibold text-[var(--text-primary)]">Pro</span>
            {subscription?.plan === "pro" && isActive && (
              <span className="ml-auto text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">Atual</span>
            )}
          </div>
          <p className="text-2xl font-bold text-[var(--text-primary)] mb-0.5">R$ 199,90<span className="text-sm font-normal text-[var(--text-muted)]">/mês</span></p>
          <ul className="space-y-1.5 my-4 flex-1">
            {PLAN_INFO.pro.features.map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <CheckCircle className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" /> {f}
              </li>
            ))}
          </ul>
          <button
            onClick={() => handleCheckout("pro")}
            disabled={!!loading || (subscription?.plan === "pro" && isActive)}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 bg-purple-600 hover:bg-purple-700 text-white"
          >
            {loading === "pro" ? "Redirecionando..." : subscription?.plan === "pro" && isActive ? "Plano atual" : "Assinar Pro"}
          </button>
        </div>
      </div>
    </div>
  )
}
