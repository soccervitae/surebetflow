import Stripe from "stripe"

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY não configurada")
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-06-24.dahlia" })
  }
  return _stripe
}

/** @deprecated use getStripe() */
export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop]
  },
})

export const PLAN_LIMITS: Record<string, { maxProfiles: number; maxApostas: number }> = {
  free:       { maxProfiles: 1, maxApostas: 10 },
  trader:     { maxProfiles: 5, maxApostas: Infinity },
  trader_pro: { maxProfiles: 20, maxApostas: Infinity },
  pro:        { maxProfiles: 5, maxApostas: Infinity },
}

export function getPlanLimits(plan: string | null | undefined, status: string | null | undefined) {
  const isActive = status === "active" || status === "trialing"
  if (!isActive || !plan) return PLAN_LIMITS.free
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.free
}

export const STRIPE_PLANS = {
  trader: {
    name: "Trader",
    price: "R$ 99,00",
    amount: 9900,
    priceId: process.env.STRIPE_PRICE_TRADER!,
    maxProfiles: 5,
    maxApostas: Infinity,
  },
  trader_pro: {
    name: "Trader Pro",
    price: "R$ 179,00",
    amount: 17900,
    priceId: process.env.STRIPE_PRICE_TRADER_PRO!,
    maxProfiles: 20,
    maxApostas: Infinity,
  },
} as const

export type StripePlanKey = keyof typeof STRIPE_PLANS

export const STATUS_MAP: Record<string, string> = {
  active:            "active",
  trialing:          "trialing",
  past_due:          "past_due",
  canceled:          "canceled",
  unpaid:            "past_due",
  incomplete:        "incomplete",
  incomplete_expired:"canceled",
  paused:            "past_due",
}
