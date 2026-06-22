"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ShieldCheck, Lock, CheckCircle, Loader2, QrCode, CreditCard, Copy } from "lucide-react"
import Image from "next/image"

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
    MercadoPago: any // eslint-disable-line @typescript-eslint/no-explicit-any
  }
}

type PaymentMethod = "pix" | "card"

export default function CheckoutClient({ publicKey, userEmail }: { publicKey: string; userEmail: string }) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [method, setMethod] = useState<PaymentMethod>("card")
  const [mpReady, setMpReady] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const cardFormRef = useRef<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any

  // PIX state
  const [pixQr, setPixQr] = useState<string | null>(null)
  const [pixQrImg, setPixQrImg] = useState<string | null>(null)
  const [pixCopied, setPixCopied] = useState(false)
  const [generatingPix, setGeneratingPix] = useState(false)

  // Load MP SDK
  useEffect(() => {
    if (document.getElementById("mp-sdk")) { setMpReady(true); return }
    const script = document.createElement("script")
    script.id = "mp-sdk"
    script.src = "https://sdk.mercadopago.com/js/v2"
    script.onload = () => setMpReady(true)
    document.head.appendChild(script)
  }, [])

  // Init CardForm after SDK loads (only when card method is active)
  useEffect(() => {
    if (!mpReady || !formRef.current || method !== "card") return

    const mp = new window.MercadoPago(publicKey, { locale: "pt-BR" })

    const cardForm = mp.cardForm({
      amount: "99.00",
      iframe: true,
      form: {
        id: "mp-card-form",
        cardNumber:           { id: "mp-card-number",        placeholder: "0000 0000 0000 0000" },
        expirationDate:       { id: "mp-expiration-date",    placeholder: "MM/AA" },
        securityCode:         { id: "mp-security-code",      placeholder: "CVV" },
        cardholderName:       { id: "mp-cardholder-name",    placeholder: "Como no cartão" },
        issuer:               { id: "mp-issuer" },
        installments:         { id: "mp-installments" },
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
              token, paymentMethodId, issuerId,
              installments: Number(installments),
              identificationNumber, identificationType,
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
        onFetching: () => { return () => {} },
      },
    })

    cardFormRef.current = cardForm
    return () => { cardForm.unmount?.() }
  }, [mpReady, publicKey, method]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleGeneratePix() {
    setGeneratingPix(true)
    setError("")
    const res = await fetch("/api/mp/pix", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: userEmail }),
    })
    const data = await res.json()
    if (data.error) {
      setError(data.error)
    } else {
      setPixQr(data.qrCode)
      setPixQrImg(data.qrCodeBase64 ? `data:image/png;base64,${data.qrCodeBase64}` : null)
    }
    setGeneratingPix(false)
  }

  function handleCopyPix() {
    if (!pixQr) return
    navigator.clipboard.writeText(pixQr)
    setPixCopied(true)
    setTimeout(() => setPixCopied(false), 2500)
  }

  const tabs: { id: PaymentMethod; label: string; icon: React.ElementType }[] = [
    { id: "card", label: "Cartão", icon: CreditCard },
    { id: "pix",  label: "PIX",    icon: QrCode },
  ]

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
        <div className="md:col-span-3 space-y-4">

          {/* Method tabs */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-1.5 flex gap-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => { setMethod(id); setError(""); setPixQr(null) }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors
                  ${method === id
                    ? "bg-[#1e3a8a] text-white"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Card form */}
          {method === "card" && (
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <Lock className="w-4 h-4 text-[#1e3a8a]" />
                <span className="text-sm font-medium text-[var(--text-primary)]">Dados do cartão</span>
                <span className="ml-auto text-xs text-[var(--text-muted)]">Seguro via MercadoPago</span>
              </div>

              {!mpReady ? (
                <div className="flex items-center justify-center py-16 gap-3 text-[var(--text-muted)]">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Carregando formulário...</span>
                </div>
              ) : (
                <form id="mp-card-form" ref={formRef}>
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Número do cartão</label>
                    <div id="mp-card-number" className="mp-field bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 h-11" />
                  </div>

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

                  <div className="mb-4">
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Nome no cartão</label>
                    <div id="mp-cardholder-name" className="mp-field bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 h-11" />
                  </div>

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

                  <input id="mp-email" type="hidden" defaultValue={userEmail} />
                  <select id="mp-issuer" className="hidden" />
                  <select id="mp-installments" className="hidden" />

                  {error && (
                    <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 rounded-xl bg-[#1e3a8a] hover:bg-[#1e40af] disabled:opacity-60 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 mt-2"
                  >
                    {submitting
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Processando...</>
                      : <><Lock className="w-4 h-4" /> Assinar por R$ 99,00/mês</>
                    }
                  </button>
                </form>
              )}
            </div>
          )}

          {/* PIX form */}
          {method === "pix" && (
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <QrCode className="w-4 h-4 text-[#1e3a8a]" />
                <span className="text-sm font-medium text-[var(--text-primary)]">Pagamento via PIX</span>
                <span className="ml-auto text-xs text-[var(--text-muted)]">Aprovação imediata</span>
              </div>

              {!pixQr ? (
                <>
                  <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed">
                    Gere um QR Code PIX para pagar R$ 99,00. Após a confirmação do pagamento, sua assinatura será ativada automaticamente.
                  </p>

                  {error && (
                    <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>
                  )}

                  <button
                    onClick={handleGeneratePix}
                    disabled={generatingPix}
                    className="w-full py-3.5 rounded-xl bg-[#1e3a8a] hover:bg-[#1e40af] disabled:opacity-60 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    {generatingPix
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando PIX...</>
                      : <><QrCode className="w-4 h-4" /> Gerar QR Code PIX</>
                    }
                  </button>
                </>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-[var(--text-secondary)] mb-4">Escaneie o QR Code com o app do seu banco:</p>

                  {pixQrImg ? (
                    <div className="flex justify-center mb-4">
                      <div className="bg-white p-3 rounded-2xl inline-block">
                        <Image src={pixQrImg} alt="QR Code PIX" width={200} height={200} />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white/5 border border-[var(--border)] rounded-2xl p-6 mb-4 flex items-center justify-center">
                      <QrCode className="w-24 h-24 text-[var(--text-muted)]" />
                    </div>
                  )}

                  <p className="text-xs text-[var(--text-muted)] mb-3">Ou copie o código PIX:</p>
                  <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-3 flex items-center gap-3 mb-4">
                    <span className="text-xs text-[var(--text-secondary)] flex-1 text-left truncate font-mono">{pixQr}</span>
                    <button
                      onClick={handleCopyPix}
                      className="flex items-center gap-1.5 text-xs font-medium text-[#1e3a8a] hover:text-[#1e40af] flex-shrink-0 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {pixCopied ? "Copiado!" : "Copiar"}
                    </button>
                  </div>

                  <p className="text-xs text-[var(--text-muted)]">
                    Após o pagamento, aguarde alguns instantes e{" "}
                    <button onClick={() => router.push("/assinatura")} className="text-[#1e3a8a] underline">
                      verifique sua assinatura
                    </button>
                    .
                  </p>
                </div>
              )}
            </div>
          )}
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
