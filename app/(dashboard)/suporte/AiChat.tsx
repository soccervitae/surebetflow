"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, Loader2 } from "lucide-react"

type Message = {
  role: "user" | "assistant"
  content: string
}

export default function AiChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    const newMessages: Message[] = [...messages, { role: "user", content: text }]
    setMessages(newMessages)
    setInput("")
    setLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      })

      if (!res.ok || !res.body) throw new Error("Erro na requisição")

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let assistantText = ""

      setMessages(prev => [...prev, { role: "assistant", content: "" }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        assistantText += decoder.decode(value, { stream: true })
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: "assistant", content: assistantText }
          return updated
        })
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "Desculpe, ocorreu um erro. Tente novamente." },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[600px] bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border)] flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-[#1e3a8a]/20 flex items-center justify-center">
          <Bot className="w-4 h-4 text-[#3b82f6]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">Assistente SurebetFlow</p>
          <p className="text-xs text-[var(--text-muted)]">Tire suas dúvidas sobre o sistema</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-10">
            <Bot className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3" />
            <p className="text-sm text-[var(--text-secondary)]">Olá! Como posso ajudar?</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Pergunte sobre qualquer funcionalidade da SurebetFlow.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
              msg.role === "user"
                ? "bg-[#1e3a8a]"
                : "bg-[#1e3a8a]/20"
            }`}>
              {msg.role === "user"
                ? <User className="w-3.5 h-3.5 text-white" />
                : <Bot className="w-3.5 h-3.5 text-[#3b82f6]" />
              }
            </div>
            <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${
              msg.role === "user"
                ? "bg-[#1e3a8a] text-white rounded-tr-sm"
                : "bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-tl-sm"
            }`}>
              {msg.content || (loading && i === messages.length - 1
                ? <Loader2 className="w-4 h-4 animate-spin text-[var(--text-muted)]" />
                : null
              )}
            </div>
          </div>
        ))}
        {loading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-[#1e3a8a]/20 flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5 text-[#3b82f6]" />
            </div>
            <div className="bg-[var(--bg-elevated)] px-4 py-2.5 rounded-2xl rounded-tl-sm">
              <Loader2 className="w-4 h-4 animate-spin text-[var(--text-muted)]" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex items-end gap-2 p-4 border-t border-[var(--border)] flex-shrink-0">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e as any) }
          }}
          placeholder="Digite sua dúvida..."
          rows={1}
          className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#1e3a8a]/50 resize-none transition-colors"
          style={{ maxHeight: "120px", overflowY: "auto" }}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-[#1e3a8a] hover:bg-[#1e40af] disabled:opacity-40 transition-colors"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </form>
    </div>
  )
}
