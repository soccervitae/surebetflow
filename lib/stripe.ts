import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-06-24.dahlia",
})

export const STRIPE_PLANS = {
  pro: {
    name: "Pro",
    price: "R$ 99,00",
    amount: 9900, // centavos
    priceId: process.env.STRIPE_PRICE_PRO!,
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
