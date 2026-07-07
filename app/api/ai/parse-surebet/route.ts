import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY não configurada no servidor" }, { status: 500 })
    }
    const client = new Anthropic({ apiKey })
    const body = await req.json()
    const { text, imageBase64, imageMediaType } = body as {
      text?: string
      imageBase64?: string
      imageMediaType?: string
    }

    if (!text && !imageBase64) {
      return NextResponse.json({ error: "Forneça texto ou imagem" }, { status: 400 })
    }

    const systemPrompt = `Você é um especialista em apostas esportivas de arbitragem (surebet).
Analise o conteúdo fornecido (texto ou imagem de um localizador de surebets) e extraia TODAS as oportunidades de surebet presentes.
Retorne um JSON com a seguinte estrutura exata:

{
  "surebets": [
    {
      "evento": "Nome do evento (ex: Flamengo x Corinthians ou Djokovic x Alcaraz)",
      "competicao": "Nome da competição/liga (ex: Copa do Mundo 2026, Premier League, Roland Garros)",
      "esporte": "Futebol|Tênis|Basquete|Vôlei|Futebol Americano|Hockey no Gelo|Beisebol|Handebol|Rugby|MMA/UFC|Boxe|Ciclismo|Fórmula 1|Outros",
      "data": "DD/MM/AAAA ou DD/MM se o ano não aparecer — apenas a data, sem horário",
      "tipo": "2-way" ou "3-way",
      "roi": número percentual ou null,
      "legs": [
        {
          "bookmaker": "Nome da casa de apostas exatamente como aparece",
          "mercado": "Resultado apostado (ex: Casa, Visitante, Empate, Over 2.5, 1 realizará 1º arremesso lateral, etc)",
          "odd": número decimal
        }
      ]
    }
  ]
}

Regras:
- Extraia TODAS as surebets visíveis, não apenas a primeira
- "evento": para futebol use "Time A x Time B"; para esportes individuais use "Atleta A x Atleta B"
- "competicao": a liga ou torneio que aparece abaixo do nome do evento (ex: Copa do Mundo 2026, Brasileirão Série A)
- "data": extraia apenas DD/MM ou DD/MM/AAAA — NÃO inclua o horário
- "tipo" é "3-way" se tiver 3 legs, caso contrário "2-way"
- "odd" deve ser número decimal (ex: 2.15, não "2,15")
- "roi" é o percentual de lucro garantido (ex: 3.5 para 3.5%)
- Se não conseguir identificar um campo, use null
- Retorne APENAS o JSON, sem texto adicional`

    const content: Anthropic.MessageParam["content"] = []

    if (imageBase64 && imageMediaType) {
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: imageMediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
          data: imageBase64,
        },
      })
      content.push({
        type: "text",
        text: "Analise esta imagem de um localizador de surebets e extraia todas as oportunidades de arbitragem.",
      })
    } else {
      content.push({
        type: "text",
        text: `Analise este texto de um localizador de surebets:\n\n${text}`,
      })
    }

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: "user", content }],
    })

    const raw = (message.content[0] as { type: string; text: string }).text.trim()
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("Resposta inválida da IA")

    const parsed = JSON.parse(jsonMatch[0])
    return NextResponse.json(parsed)
  } catch (err: unknown) {
    const e = err as any
    console.error("parse-surebet error:", e)
    const message = e?.message ?? e?.error?.message ?? JSON.stringify(e) ?? "Erro ao processar"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
