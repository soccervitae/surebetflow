"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CreditCard, CheckCircle, Star, AlertCircle, Clock, Calendar, Hash, Activity, Loader2, ExternalLink, Zap } from "lucide-react"

type Subscription = {
  status: string
  plan: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  stripe_subscription_id: string | null
} | null

const PLANS = [
  {
    key: "free",
    name: "Gratuito",
    price: "R$ 0",
    period: "",
    maxProfiles: 1,
    icon: Star,
    features: [
      "1 perfil de apostador",
      "Até 10 apostas registradas",
      "Calculadora de surebet 2-way e 3-way",
      "Dashboard financeiro básico",
    ],
  },
  {
    key: "trader",
    name: "Trader",
    price: "R$ 99",
    period: "/mês",
    maxProfiles: 5,
    icon: Star,
    features: [
      "Até 5 perfis de apostador",
      "Apostas ilimitadas",
      "Casas de apostas ilimitadas por perfil",
      "Calculadora de surebet 2-way e 3-way",
      "Dashboard financeiro completo",
      "Histórico completo de apostas",
      "Suporte prioritário por ticket",
    ],
  },
  {
    key: "trader_pro",
    name: "Trader Pro",
    price: "R$ 179",
    period: "/mês",
    maxProfiles: 20,
    icon: Zap,
    features: [
      "Até 20 perfis de apostador",
      "Apostas ilimitadas",
      "Casas de apostas ilimitadas por perfil",
      "Calculadora de surebet 2-way e 3-way",
      "Dashboard financeiro completo",
      "Histórico completo de apostas",
      "Suporte prioritário por ticket",
    ],
  },
]

const STATUS_INFO: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  active:     { label: "Ativa",      color: "text-green-400", bg: "bg-green-500/10",  icon: CheckCircle },
  trialing:   { label: "Trial",      color: "text-blue-400",  bg: "bg-blue-500/10",   icon: Clock },
  past_due:   { label: "Vencida",    color: "text-red-400",   bg: "bg-red-500/10",    icon: AlertCircle },
  canceled:   { label: "Cancelada",  color: "text-gray-400",  bg: "bg-gray-500/10",   icon: AlertCircle },
  incomplete: { label: "Pendente",   color: "text-yellow-400",bg: "bg-yellow-500/10", icon: Clock },
  inactive:   { label: "Inativa",    color: "text-gray-400",  bg: "bg-gray-500/10",   icon: AlertCircle },
}

export default function AssinaturaClient({ subscription }: { subscription: Subscription }) {
  const searchParams = useSearchParams()
  const success = searchParams.get("success")
  const canceled = searchParams.get("canceled")
  const [portalLoading, setPortalLoading] = useState(false)

  async function openPortal() {
    setPortalLoading(true)
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error ?? "Erro ao abrir portal. Verifique se o portal do cliente está ativado no Stripe Dashboard.")
        setPortalLoading(false)
      }
    } catch {
      alert("Erro ao conectar com o servidor. Tente novamente.")
      setPortalLoading(false)
    }
  }

  const isActive = subscription?.status === "active" || subscription?.status === "trialing"
  const statusInfo = STATUS_INFO[subscription?.status ?? "inactive"]
  const StatusIcon = statusInfo.icon
  const activePlan = PLANS.find(p => p.key === subscription?.plan) ?? null

  const paymentDetails = [
    {
      icon: Activity,
      label: "Status",
      value: (
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${statusInfo.bg} ${statusInfo.color}`}>
          <StatusIcon className="w-3 h-3" />
          {statusInfo.label}
        </span>
      ),
    },
    {
      icon: Star,
      label: "Plano",
      value: <span className="text-[var(--text-primary)] font-medium">{activePlan?.name ?? "—"} — {activePlan?.price ?? "—"}/mês</span>,
    },
    ...(subscription?.current_period_end ? [{
      icon: Calendar,
      label: subscription?.cancel_at_period_end ? "Cancela em" : "Próxima cobrança",
      value: (
        <span className={subscription?.cancel_at_period_end ? "text-red-400 font-medium" : "text-[var(--text-primary)] font-medium"}>
          {new Date(subscription.current_period_end).toLocaleDateString("pt-BR")}
        </span>
      ),
    }] : []),
    ...(subscription?.stripe_subscription_id ? [{
      icon: Hash,
      label: "ID da assinatura",
      value: <span className="text-[var(--text-muted)] font-mono text-xs">{subscription.stripe_subscription_id}</span>,
    }] : []),
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-[#1e3a8a]/10 rounded-xl flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-[var(--accent-text)]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Assinatura</h1>
          <p className="text-sm text-[var(--text-secondary)]">Gerencie seu plano do SurebetFlow</p>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-green-400 text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          Pagamento confirmado! Sua assinatura está ativa.
        </div>
      )}
      {canceled && (
        <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 text-yellow-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          Pagamento cancelado. Assine para ter acesso completo.
        </div>
      )}

      {/* Active plan management */}
      {isActive && activePlan && (
        <div className="bg-[var(--bg-surface)] border border-[#1e3a8a]/40 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <activePlan.icon className="w-5 h-5 text-[var(--accent-text)]" />
              <span className="text-lg font-bold text-[var(--text-primary)]">{activePlan.name}</span>
            </div>
            <span className="text-xs bg-[#1e3a8a]/20 text-[var(--accent-text)] px-2.5 py-1 rounded-full font-medium">Plano atual</span>
          </div>
          <p className="text-4xl font-bold text-[var(--text-primary)] mb-6">
            {activePlan.price}<span className="text-xl font-normal text-[var(--text-muted)]">{activePlan.period}</span>
          </p>
          <button
            onClick={openPortal}
            disabled={portalLoading}
            className="inline-flex items-center gap-2 text-sm font-semibold bg-[#1e3a8a] hover:bg-[#1e40af] disabled:opacity-60 text-white px-4 py-2.5 rounded-xl transition-colors"
          >
            {portalLoading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Abrindo portal...</>
              : <><ExternalLink className="w-4 h-4" /> Gerenciar assinatura</>
            }
          </button>
        </div>
      )}

      {/* Plan cards */}
      {!isActive && (
        <div className="grid sm:grid-cols-2 gap-4">
          {PLANS.map(plan => (
            <div key={plan.key} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-6 flex flex-col relative">
              {plan.key === "trader_pro" && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider bg-[#1e3a8a] text-white px-3 py-1 rounded-full">
                  Mais popular
                </span>
              )}
              <div className="flex items-center gap-2 mb-3">
                <plan.icon className="w-5 h-5 text-[var(--accent-text)]" />
                <span className="text-lg font-bold text-[var(--text-primary)]">{plan.name}</span>
              </div>
              <p className="text-4xl font-bold text-[var(--text-primary)] mb-0.5">
                {plan.price}<span className="text-xl font-normal text-[var(--text-muted)]">{plan.period}</span>
              </p>
              <ul className="space-y-2 my-6 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-[var(--text-secondary)]">
                    <CheckCircle className="w-4 h-4 text-[var(--accent-text)] flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={`/assinatura/checkout?plan=${plan.key}`}
                className="block w-full py-3 rounded-xl text-sm font-semibold bg-[#1e3a8a] hover:bg-[#1e40af] text-white transition-colors text-center"
              >
                Assinar {plan.name} →
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Payment details */}
      {isActive && subscription && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border)]">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Detalhes da assinatura</h2>
          </div>
          <ul className="divide-y divide-[var(--border)]">
            {paymentDetails.map(({ icon: Icon, label, value }) => (
              <li key={label} className="flex items-center justify-between px-5 py-3.5 gap-4">
                <div className="flex items-center gap-2.5 text-sm text-[var(--text-secondary)] min-w-0">
                  <Icon className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
                  {label}
                </div>
                <div className="text-sm text-right">{value}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!isActive && (
        <p className="text-xs text-center text-[var(--text-muted)]">
          Pagamento via cartão de crédito · Stripe · Cancele quando quiser
        </p>
      )}
    </div>
  )
}
