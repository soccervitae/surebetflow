import { MercadoPagoConfig } from "mercadopago"

export const mp = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
})

export const PLANS = {
  pro: {
    name: "Pro",
    price: "R$ 99,00",
    amount: 99.0,
    planId: process.env.MP_PLAN_PRO!,
  },
} as const

export type PlanKey = keyof typeof PLANS
