import { MercadoPagoConfig, PreApprovalPlan, PreApproval } from "mercadopago"

export const mp = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
})

export const PLANS = {
  starter: {
    name: "Starter",
    price: "R$ 79,90",
    amount: 79.9,
    planId: process.env.MP_PLAN_STARTER!,
  },
  pro: {
    name: "Pro",
    price: "R$ 199,90",
    amount: 199.9,
    planId: process.env.MP_PLAN_PRO!,
  },
} as const

export type PlanKey = keyof typeof PLANS
