"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ShieldCheck, Lock, CheckCircle, Loader2, Star, Zap, CreditCard, ExternalLink } from "lucide-react"

const PLANS = {
  trader: {
    name: "Trader",
    price: "R$ 99,00",
    amount: 99,
    icon: Star,
    maxProfiles: 5,
    caktoUrl: process.env.NEXT_PUBLIC_CAKTO_URL_TRADER ?? "",
    features: [
      "Até 5 perfis de apostador",
      "Casas de apostas ilimitadas",
      "Calculadora 2-way e 3-way",
      "Dashboard financeiro completo",
      "Histórico completo de apostas",
      "Suporte prioritário por ticket",
    ],
  },
  trader_pro: {
    name: "Trader Pro",
    price: "R$ 179,00",
    amount: 179,
    icon: Zap,
    maxProfiles: 20,
    caktoUrl: process.env.NEXT_PUBLIC_CAKTO_URL_TRADER_PRO ?? "",
    features: [
      "Até 20 perfis de apostador",
      "Casas de apostas ilimitadas",
      "Calculadora 2-way e 3-way",
      "Dashboard financeiro completo",
      "Histórico completo de apostas",
      "Suporte prioritário por ticket",
    ],
  },
}

type PaymentMethod = "cakto" | "stripe"

export default function CheckoutClient() {
  const searchParams = useSearchParams()
  const planKey = (searchParams.get("plan") ?? "trader") as keyof typeof PLANS
  const plan = PLANS[planKey] ?? PLANS.trader

  const [method, setMethod] = useState<PaymentMethod>("cakto")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleStripeCheckout() {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
        setLoading(false)
      } else {
        window.location.href = data.url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao iniciar pagamento. Tente novamente.")
      setLoading(false)
    }
  }

  const PlanIcon = plan.icon

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/assinatura" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Finalizar assinatura</h1>
          <p className="text-sm text-[var(--text-secondary)]">Plano {plan.name} · {plan.price}/mês</p>
        </div>
      </div>

      <div className="grid md:grid-cols-5 gap-6">
        {/* Payment action */}
        <div className="md:col-span-3 space-y-4">

          {/* Seletor de método */}
          <div className="flex gap-2 bg-[var(--bg-elevated)] rounded-xl p-1">
            <button
              onClick={() => setMethod("cakto")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                method === "cakto"
                  ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <ExternalLink className="w-4 h-4" />
              Cakto
            </button>
            <button
              onClick={() => setMethod("stripe")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                method === "stripe"
                  ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Cartão / Boleto
            </button>
          </div>

          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-6">

            {/* Cakto */}
            {method === "cakto" && (
              <>
                <div className="flex items-center gap-2 mb-5">
                  <ExternalLink className="w-4 h-4 text-[var(--accent-text)]" />
                  <span className="text-sm font-medium text-[var(--text-primary)]">Pagamento via Cakto</span>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-2 leading-relaxed">
                  Você será redirecionado para a Cakto, onde poderá pagar com <strong className="text-[var(--text-primary)]">Pix, cartão ou boleto</strong>.
                </p>
                <ul className="text-xs text-[var(--text-muted)] space-y-1 mb-6 list-disc list-inside">
                  <li>Pix com confirmação instantânea</li>
                  <li>Cartão de crédito em até 12x</li>
                  <li>Boleto bancário com prazo de 3 dias</li>
                </ul>
                {plan.caktoUrl ? (
                  <a
                    href={plan.caktoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Assinar via Cakto — {plan.price}/mês
                  </a>
                ) : (
                  <div className="text-center text-sm text-[var(--text-muted)] py-2">
                    Link da Cakto não configurado ainda.
                  </div>
                )}
              </>
            )}

            {/* Stripe */}
            {method === "stripe" && (
              <>
                <div className="flex items-center gap-2 mb-5">
                  <Lock className="w-4 h-4 text-[var(--accent-text)]" />
                  <span className="text-sm font-medium text-[var(--text-primary)]">Pagamento via Stripe</span>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed">
                  Você será redirecionado para a página de pagamento segura do Stripe. Seus dados são protegidos com criptografia de ponta a ponta.
                </p>
                {error && (
                  <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>
                )}
                <button
                  onClick={handleStripeCheckout}
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-[#1e3a8a] hover:bg-[#1e40af] disabled:opacity-60 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Redirecionando...</>
                    : <><Lock className="w-4 h-4" /> Assinar por {plan.price}/mês</>
                  }
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] px-1">
            <ShieldCheck className="w-4 h-4 text-[var(--accent-text)] flex-shrink-0" />
            Pagamento 100% seguro. Cancele quando quiser.
          </div>
        </div>

        {/* Order summary */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-3">Resumo do pedido</p>
            <div className="flex items-center gap-2 mb-1">
              <PlanIcon className="w-4 h-4 text-[var(--accent-text)]" />
              <span className="font-semibold text-[var(--text-primary)]">Plano {plan.name}</span>
              <span className="font-bold text-[var(--text-primary)] ml-auto">{plan.price}</span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mb-4">Cobrança mensal recorrente</p>
            <div className="border-t border-[var(--border)] pt-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-[var(--text-secondary)]">Total hoje</span>
                <span className="text-lg font-bold text-[var(--text-primary)]">{plan.price}</span>
              </div>
            </div>
          </div>

          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-3">Incluído no plano</p>
            <ul className="space-y-2">
              {plan.features.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                  <CheckCircle className="w-3.5 h-3.5 text-[var(--accent-text)] flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
