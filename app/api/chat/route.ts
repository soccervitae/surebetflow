import { NextRequest } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response("Unauthorized", { status: 401 })

  const { messages } = await req.json()
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response("Bad Request", { status: 400 })
  }

  const adminClient = createAdminClient()
  const { data: config } = await adminClient
    .from("ai_agent_config")
    .select("system_prompt")
    .eq("id", "default")
    .single()

  const systemPrompt = config?.system_prompt ?? "Você é o assistente da SurebetFlow. Responda apenas dúvidas sobre a plataforma."

  const stream = await anthropic.messages.stream({
    model: "claude-opus-4-8",
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text))
        }
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
