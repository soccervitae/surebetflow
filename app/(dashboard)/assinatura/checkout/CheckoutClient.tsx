"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ShieldCheck, Lock, CheckCircle, Loader2, Star, Zap, Copy, Check, QrCode, CreditCard } from "lucide-react"
import Image from "next/image"

const PLANS = {
  trader: {
    name: "Trader",
    price: "R$ 99,00",
    amount: 99,
    icon: Star,
    maxProfiles: 5,
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

type PaymentMethod = "card" | "pix"

interface PixData {
  qrCode: string
  qrCodeBase64: string
  paymentId: string | number
}

export default function CheckoutClient() {
  const searchParams = useSearchParams()
  const planKey = (searchParams.get("plan") ?? "trader") as keyof typeof PLANS
  const plan = PLANS[planKey] ?? PLANS.trader

  const [method, setMethod] = useState<PaymentMethod>("card")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [pixData, setPixData] = useState<PixData | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleCardCheckout() {
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

  async function handlePixCheckout() {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/mp/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
        setLoading(false)
      } else {
        setPixData(data)
        setLoading(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar Pix. Tente novamente.")
      setLoading(false)
    }
  }

  async function handleCopy() {
    if (!pixData?.qrCode) return
    await navigator.clipboard.writeText(pixData.qrCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
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
          {!pixData && (
            <div className="flex gap-2 bg-[var(--bg-elevated)] rounded-xl p-1">
              <button
                onClick={() => setMethod("card")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  method === "card"
                    ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <CreditCard className="w-4 h-4" />
                Cartão
              </button>
              <button
                onClick={() => setMethod("pix")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  method === "pix"
                    ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <QrCode className="w-4 h-4" />
                Pix
              </button>
            </div>
          )}

          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-6">

            {/* --- Cartão --- */}
            {method === "card" && !pixData && (
              <>
                <div className="flex items-center gap-2 mb-5">
                  <Lock className="w-4 h-4 text-[var(--accent-text)]" />
                  <span className="text-sm font-medium text-[var(--text-primary)]">Pagamento seguro via Stripe</span>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed">
                  Você será redirecionado para a página de pagamento segura do Stripe, onde poderá pagar com cartão de crédito ou débito. Seus dados são protegidos com criptografia de ponta a ponta.
                </p>
                {error && (
                  <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>
                )}
                <button
                  onClick={handleCardCheckout}
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

            {/* --- Pix: antes de gerar --- */}
            {method === "pix" && !pixData && (
              <>
                <div className="flex items-center gap-2 mb-5">
                  <QrCode className="w-4 h-4 text-[var(--accent-text)]" />
                  <span className="text-sm font-medium text-[var(--text-primary)]">Pagamento via Pix</span>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-2 leading-relaxed">
                  Gere um QR Code Pix para pagar {plan.price} à vista. O acesso é liberado assim que o pagamento for confirmado.
                </p>
                <ul className="text-xs text-[var(--text-muted)] space-y-1 mb-6 list-disc list-inside">
                  <li>Pagamento processado pelo Mercado Pago</li>
                  <li>QR Code válido por 24 horas</li>
                  <li>Confirmação instantânea</li>
                </ul>
                {error && (
                  <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>
                )}
                <button
                  onClick={handlePixCheckout}
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-[#00b894] hover:bg-[#00a381] disabled:opacity-60 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando QR Code...</>
                    : <><QrCode className="w-4 h-4" /> Gerar QR Code Pix — {plan.price}</>
                  }
                </button>
              </>
            )}

            {/* --- Pix: QR Code gerado --- */}
            {pixData && (
              <div className="text-center space-y-4">
                <div className="flex items-center gap-2 justify-center mb-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-[var(--text-primary)]">QR Code gerado com sucesso!</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">
                  Escaneie o QR Code abaixo com o app do seu banco ou copie o código Pix.
                </p>

                {pixData.qrCodeBase64 && (
                  <div className="flex justify-center">
                    <div className="bg-white p-3 rounded-xl inline-block">
                      <Image
                        src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                        alt="QR Code Pix"
                        width={200}
                        height={200}
                        className="block"
                        unoptimized
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-xs text-[var(--text-muted)]">Ou copie o código Pix Copia e Cola:</p>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={pixData.qrCode}
                      className="flex-1 text-xs bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-secondary)] truncate"
                    />
                    <button
                      onClick={handleCopy}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors flex-shrink-0 ${
                        copied
                          ? "bg-green-500/10 border-green-500/30 text-green-500"
                          : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                      }`}
                    >
                      {copied ? <><Check className="w-3.5 h-3.5" /> Copiado</> : <><Copy className="w-3.5 h-3.5" /> Copiar</>}
                    </button>
                  </div>
                </div>

                <div className="bg-[var(--bg-elevated)] rounded-xl px-4 py-3 text-left space-y-1">
                  <p className="text-xs font-semibold text-[var(--text-primary)]">Valor: {plan.price}</p>
                  <p className="text-xs text-[var(--text-muted)]">Após o pagamento, seu acesso será liberado automaticamente em até 1 minuto.</p>
                  <p className="text-xs text-[var(--text-muted)]">QR Code válido por 24 horas.</p>
                </div>
              </div>
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
