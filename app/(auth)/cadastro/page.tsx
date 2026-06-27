"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Eye, EyeOff } from "lucide-react"

export default function CadastroPage() {
  const router = useRouter()
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!nome.trim()) { setError("Informe seu nome."); return }
    if (password.length < 8) { setError("A senha deve ter pelo menos 8 caracteres."); return }
    if (password !== confirmPassword) { setError("As senhas não coincidem."); return }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: nome.trim() } },
    })

    if (error) {
      if (error.message.includes("already registered")) {
        setError("Este e-mail já está cadastrado. Tente fazer login.")
      } else {
        setError("Erro ao criar conta. Tente novamente.")
      }
      setLoading(false)
      return
    }

    await fetch("/api/auth/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: nome.trim() }),
    })

    router.push(`/verificar-email?email=${encodeURIComponent(email)}&nome=${encodeURIComponent(nome.trim())}`)
  }

  const inputClass = "w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a]/20 transition-colors"

  return (
    <>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Criar sua conta</h2>
      <p className="text-gray-500 text-sm mb-6">Preencha os dados abaixo para começar</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="nome" className="text-sm font-medium text-gray-700">Nome completo</label>
          <input
            id="nome"
            type="text"
            placeholder="João Silva"
            value={nome}
            onChange={e => setNome(e.target.value)}
            required
            autoComplete="name"
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-gray-700">E-mail</label>
          <input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium text-gray-700">Senha</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className={`${inputClass} pr-10`}
            />
            <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" tabIndex={-1}>
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirmar senha</label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Repita a senha"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              className={`${inputClass} pr-10`}
            />
            <button type="button" onClick={() => setShowConfirmPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" tabIndex={-1}>
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#1e3a8a] hover:bg-[#1e40af] disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
        >
          {loading ? "Criando conta..." : "Criar conta"}
        </button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-6">
        Já tem uma conta?{" "}
        <Link href="/login" className="text-[#1e3a8a] font-medium hover:underline">
          Fazer login
        </Link>
      </p>
    </>
  )
}
