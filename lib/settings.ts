import { createAdminClient } from "./supabase/admin"
import { MercadoPagoConfig } from "mercadopago"

let _cache: Record<string, string> = {}
let _cacheAt = 0
const CACHE_TTL = 60_000 // 1 min

async function getSettings(): Promise<Record<string, string>> {
  if (Date.now() - _cacheAt < CACHE_TTL) return _cache

  const supabase = createAdminClient()
  const { data } = await supabase
    .from("admin_settings")
    .select("key, value")

  _cache = {}
  for (const row of data ?? []) _cache[row.key] = row.value
  _cacheAt = Date.now()
  return _cache
}

export async function getMpClient() {
  const settings = await getSettings()
  const token = settings["mp_access_token"] ?? process.env.MP_ACCESS_TOKEN ?? ""
  return new MercadoPagoConfig({ accessToken: token })
}

export async function getMpPlanId(): Promise<string> {
  const settings = await getSettings()
  return settings["mp_plan_pro"] ?? process.env.MP_PLAN_PRO ?? ""
}

export async function getMpPublicKey(): Promise<string> {
  const settings = await getSettings()
  return settings["mp_public_key"] ?? process.env.NEXT_PUBLIC_MP_PUBLIC_KEY ?? ""
}

export async function getMpWebhookSecret(): Promise<string> {
  const settings = await getSettings()
  return settings["mp_webhook_secret"] ?? ""
}
