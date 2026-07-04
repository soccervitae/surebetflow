"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError("E-mail ou senha incorretos. Verifique seus dados e tente novamente.")
      setLoading(false)
      return
    }

    localStorage.setItem("sbf-theme", "light")
    document.documentElement.classList.remove("dark")
    router.push("/surebet")
    router.refresh()
  }

  return (
    <>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Entrar na sua conta</h2>
      <p className="text-gray-500 text-sm mb-6">Digite seu e-mail e senha para acessar</p>
      <form onSubmit={handleSubmit} className="space-y-4">
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
            className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a]/20 transition-colors"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium text-gray-700">Senha</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 pr-10 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a]/20 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-6">
        Não tem uma conta?{" "}
        <Link href="/cadastro" className="text-[#1e3a8a] font-medium hover:underline">
          Cadastre-se
        </Link>
      </p>
    </>
  )
}
