"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Mail, RefreshCw, CheckCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function VerificarEmailPage() {
  const [code, setCode] = useState(["", "", "", "", "", ""])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") ?? ""
  const nome = searchParams.get("nome") ?? "usuário"

  // Countdown for resend
  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  function handleInput(i: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1)
    const next = [...code]
    next[i] = digit
    setCode(next)
    setError("")
    if (digit && i < 5) inputsRef.current[i + 1]?.focus()
    if (next.every(d => d !== "")) handleVerify(next.join(""))
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !code[i] && i > 0) {
      inputsRef.current[i - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (digits.length === 6) {
      setCode(digits.split(""))
      handleVerify(digits)
    }
  }

  async function handleVerify(codeStr: string) {
    setLoading(true)
    setError("")
    const res = await fetch("/api/auth/verify-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: codeStr }),
    })
    const data = await res.json()
    if (data.ok) {
      setSuccess(true)
      setTimeout(() => router.push("/assinatura"), 1500)
    } else {
      setError(data.error ?? "Código inválido")
      setCode(["", "", "", "", "", ""])
      inputsRef.current[0]?.focus()
    }
    setLoading(false)
  }

  async function handleResend() {
    setResending(true)
    setError("")
    await fetch("/api/auth/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome }),
    })
    setResending(false)
    setCountdown(60)
    setCode(["", "", "", "", "", ""])
    inputsRef.current[0]?.focus()
  }

  return (
    <>
      <div className="flex items-center justify-center w-14 h-14 bg-[#1e3a8a]/20 rounded-2xl mx-auto mb-5">
        {success
          ? <CheckCircle className="w-7 h-7 text-green-400" />
          : <Mail className="w-7 h-7 text-[#1e3a8a]" />
        }
      </div>

      <h2 className="text-xl font-bold text-white mb-1 text-center">
        {success ? "Email verificado!" : "Verifique seu e-mail"}
      </h2>
      <p className="text-gray-500 text-sm mb-6 text-center leading-relaxed">
        {success
          ? "Redirecionando..."
          : <>Enviamos um código de 6 dígitos para <strong className="text-gray-300">{email || "seu e-mail"}</strong></>
        }
      </p>

      {!success && (
        <>
          {/* Code inputs */}
          <div className="flex gap-3 justify-center mb-5" onPaste={handlePaste}>
            {code.map((digit, i) => (
              <input
                key={i}
                ref={el => { inputsRef.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleInput(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                disabled={loading}
                className={`w-12 h-14 text-center text-xl font-bold rounded-xl border transition-colors focus:outline-none
                  ${digit ? "bg-[#1e3a8a]/20 border-[#1e3a8a] text-white" : "bg-[#0a0a0a] border-white/10 text-white"}
                  ${error ? "border-red-500/50" : ""}
                  focus:border-[#1e3a8a] disabled:opacity-50`}
              />
            ))}
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3 mb-4 text-center">
              {error}
            </p>
          )}

          {loading && (
            <p className="text-center text-sm text-gray-500 mb-4">Verificando...</p>
          )}

          {/* Resend */}
          <div className="text-center">
            {countdown > 0 ? (
              <p className="text-sm text-gray-500">
                Reenviar código em <span className="text-gray-300 font-medium">{countdown}s</span>
              </p>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending}
                className="text-sm text-[#1e3a8a] hover:underline font-medium flex items-center gap-1.5 mx-auto disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
                {resending ? "Enviando..." : "Reenviar código"}
              </button>
            )}
          </div>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-400 flex items-center gap-1.5 justify-center transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              Voltar ao login
            </Link>
          </div>
        </>
      )}
    </>
  )
}
