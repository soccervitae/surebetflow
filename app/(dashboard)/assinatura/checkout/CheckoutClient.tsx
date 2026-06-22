"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ShieldCheck, Lock, CheckCircle, Loader2 } from "lucide-react"

const PRO_FEATURES = [
  "Perfis ilimitados de apostador",
  "Casas de apostas ilimitadas",
  "Calculadora 2-way e 3-way",
  "Dashboard financeiro completo",
  "Histórico completo de apostas",
  "Suporte prioritário por ticket",
]

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    MercadoPago: any
  }
}

export default function CheckoutClient({ publicKey, userEmail }: { publicKey: string; userEmail: string }) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [mpReady, setMpReady] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cardFormRef = useRef<any>(null)

  // Load MP SDK
  useEffect(() => {
    if (document.getElementById("mp-sdk")) { setMpReady(true); return }
    const script = document.createElement("script")
    script.id = "mp-sdk"
    script.src = "https://sdk.mercadopago.com/js/v2"
    script.onload = () => setMpReady(true)
    document.head.appendChild(script)
  }, [])

  // Init CardForm after SDK loads
  useEffect(() => {
    if (!mpReady || !formRef.current) return

    const mp = new window.MercadoPago(publicKey, { locale: "pt-BR" })

    const cardForm = mp.cardForm({
      amount: "99.00",
      iframe: true,
      form: {
        id: "mp-card-form",
        cardNumber:     { id: "mp-card-number",     placeholder: "0000 0000 0000 0000" },
        expirationDate: { id: "mp-expiration-date", placeholder: "MM/AA" },
        securityCode:   { id: "mp-security-code",   placeholder: "CVV" },
        cardholderName: { id: "mp-cardholder-name", placeholder: "Como no cartão" },
        issuer:         { id: "mp-issuer" },
        installments:   { id: "mp-installments" },
        identificationType:   { id: "mp-identification-type" },
        identificationNumber: { id: "mp-identification-number", placeholder: "000.000.000-00" },
        cardholderEmail:      { id: "mp-email" },
      },
      callbacks: {
        onFormMounted: (err: unknown) => { if (err) console.error("CardForm mount error", err) },
        onSubmit: async (event: Event) => {
          event.preventDefault()
          setSubmitting(true)
          setError("")

          const {
            paymentMethodId, issuerId, cardholderEmail,
            token, installments, identificationNumber, identificationType,
          } = cardForm.getCardFormData()

          const res = await fetch("/api/mp/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token,
              paymentMethodId,
              issuerId,
              installments: Number(installments),
              identificationNumber,
              identificationType,
              email: cardholderEmail,
            }),
          })

          const data = await res.json()
          if (data.error) {
            setError(data.error)
            setSubmitting(false)
          } else {
            router.push("/assinatura?success=1")
          }
        },
        onFetching: (resource: string) => {
          // shows loading state while MP fetches card data
          return () => {}
        },
      },
    })

    cardFormRef.current = cardForm
    return () => { cardForm.unmount?.() }
  }, [mpReady, publicKey]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/assinatura" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Finalizar assinatura</h1>
          <p className="text-sm text-[var(--text-secondary)]">Plano Pro · R$ 99,00/mês</p>
        </div>
      </div>

      <div className="grid md:grid-cols-5 gap-6">
        {/* Payment form */}
        <div className="md:col-span-3">
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Lock className="w-4 h-4 text-[#1e3a8a]" />
              <span className="text-sm font-medium text-[var(--text-primary)]">Dados do cartão</span>
              <span className="ml-auto text-xs text-[var(--text-muted)]">Pagamento seguro via MercadoPago</span>
            </div>

            {!mpReady ? (
              <div className="flex items-center justify-center py-16 gap-3 text-[var(--text-muted)]">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Carregando formulário...</span>
              </div>
            ) : (
              <form id="mp-card-form" ref={formRef}>
                {/* Card number */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Número do cartão</label>
                  <div id="mp-card-number" className="mp-field bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 h-11" />
                </div>

                {/* Expiry + CVV */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Validade</label>
                    <div id="mp-expiration-date" className="mp-field bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 h-11" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">CVV</label>
                    <div id="mp-security-code" className="mp-field bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 h-11" />
                  </div>
                </div>

                {/* Cardholder name */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Nome no cartão</label>
                  <div id="mp-cardholder-name" className="mp-field bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 h-11" />
                </div>

                {/* CPF */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Tipo de documento</label>
                    <select id="mp-identification-type" className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 h-11 text-[var(--text-primary)] text-sm focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Número do documento</label>
                    <div id="mp-identification-number" className="mp-field bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 h-11" />
                  </div>
                </div>

                {/* Email (hidden, prefilled) */}
                <input id="mp-email" type="hidden" defaultValue={userEmail} />
                <select id="mp-issuer" className="hidden" />
                <select id="mp-installments" className="hidden" />

                {error && (
                  <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-xl bg-[#1e3a8a] hover:bg-[#1e40af] disabled:opacity-60 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 mt-2"
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Processando...</>
                  ) : (
                    <><Lock className="w-4 h-4" /> Assinar por R$ 99,00/mês</>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Order summary */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-3">Resumo do pedido</p>
            <div className="flex items-baseline justify-between mb-1">
              <span className="font-semibold text-[var(--text-primary)]">Plano Pro</span>
              <span className="font-bold text-[var(--text-primary)]">R$ 99,00</span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mb-4">Cobrança mensal recorrente</p>
            <div className="border-t border-[var(--border)] pt-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-[var(--text-secondary)]">Total hoje</span>
                <span className="text-lg font-bold text-[var(--text-primary)]">R$ 99,00</span>
              </div>
            </div>
          </div>

          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-3">Incluído no plano</p>
            <ul className="space-y-2">
              {PRO_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                  <CheckCircle className="w-3.5 h-3.5 text-[#1e3a8a] flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] px-1">
            <ShieldCheck className="w-4 h-4 text-[#1e3a8a] flex-shrink-0" />
            Pagamento 100% seguro. Dados criptografados pelo MercadoPago.
          </div>
        </div>
      </div>
    </div>
  )
}
