import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-05-27.dahlia",
})

export const PLANS = {
  starter: {
    name: "Starter",
    price: "R$ 79,90",
    priceId: process.env.STRIPE_PRICE_STARTER!,
  },
  pro: {
    name: "Pro",
    price: "R$ 199,90",
    priceId: process.env.STRIPE_PRICE_PRO!,
  },
} as const

export type PlanKey = keyof typeof PLANS
