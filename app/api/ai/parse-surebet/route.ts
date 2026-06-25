import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

export async function POST(req: NextRequest) {
  try {
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
      "evento": "Nome do evento (ex: Flamengo x Corinthians)",
      "esporte": "Futebol|Tênis|Basquete|Vôlei|Futebol Americano|Hockey no Gelo|Beisebol|Handebol|Rugby|MMA/UFC|Boxe|Ciclismo|Fórmula 1|Outros",
      "tipo": "2-way" ou "3-way",
      "roi": número percentual ou null,
      "legs": [
        {
          "bookmaker": "Nome da casa de apostas",
          "mercado": "Resultado apostado (ex: Casa, Visitante, Empate, Over 2.5, etc)",
          "odd": número decimal
        }
      ]
    }
  ]
}

Regras:
- Extraia TODAS as surebets visíveis, não apenas a primeira
- Se houver múltiplas oportunidades, inclua todas no array "surebets"
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
    console.error("parse-surebet error:", err)
    return NextResponse.json(
      { error: (err as Error)?.message ?? "Erro ao processar" },
      { status: 500 }
    )
  }
}
