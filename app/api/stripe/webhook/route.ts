import { NextRequest, NextResponse } from "next/server"
import { stripe, STATUS_MAP } from "@/lib/stripe"
import { createAdminClient } from "@/lib/supabase/admin"
import { getResendApiKey } from "@/lib/settings"
import { Resend } from "resend"
import type Stripe from "stripe"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://surebetflow.com"
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "noreply@surebetflow.com"

async function getResend(): Promise<Resend> {
  const apiKey = await getResendApiKey()
  return new Resend(apiKey)
}

async function getUserEmail(adminSupabase: ReturnType<typeof createAdminClient>, userId: string): Promise<string | null> {
  try {
    const { data, error } = await adminSupabase.auth.admin.getUserById(userId)
    if (error || !data.user?.email) return null
    return data.user.email
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")
  const secret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !secret) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Invalid signature"
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const adminSupabase = createAdminClient()

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode !== "subscription") break

      const userId = session.metadata?.user_id
      const plan = session.metadata?.plan ?? "pro"
      if (!userId) break

      const subscriptionId = session.subscription as string
      const sub = await stripe.subscriptions.retrieve(subscriptionId)

      await adminSupabase.from("subscriptions").upsert({
        user_id: userId,
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: session.customer as string,
        plan,
        status: STATUS_MAP[sub.status] ?? "incomplete",
        current_period_end: new Date((sub as any).current_period_end * 1000).toISOString(),
        cancel_at_period_end: sub.cancel_at_period_end,
      }, { onConflict: "user_id" })
      break
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.user_id
      if (!userId) break

      await adminSupabase.from("subscriptions").upsert({
        user_id: userId,
        stripe_subscription_id: sub.id,
        stripe_customer_id: sub.customer as string,
        plan: sub.metadata?.plan ?? "pro",
        status: STATUS_MAP[sub.status] ?? "incomplete",
        current_period_end: new Date((sub as any).current_period_end * 1000).toISOString(),
        cancel_at_period_end: sub.cancel_at_period_end,
      }, { onConflict: "user_id" })
      break
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.user_id
      if (!userId) break

      await adminSupabase.from("subscriptions")
        .update({ status: "canceled", cancel_at_period_end: false })
        .eq("user_id", userId)

      // Send cancellation email
      const email = await getUserEmail(adminSupabase, userId)
      if (email) {
        try {
          const resend = await getResend()
          await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: "Sua assinatura foi cancelada - SurebetFlow",
            html: `
              <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
                <h2 style="color:#1e3a8a;margin-bottom:16px">Assinatura cancelada</h2>
                <p style="color:#374151;line-height:1.6">
                  Sua assinatura do <strong>SurebetFlow</strong> foi cancelada. Você ainda poderá
                  acessar os recursos do plano até o final do período já pago.
                </p>
                <p style="color:#374151;line-height:1.6">
                  Sentiremos sua falta! Caso queira reativar sua assinatura a qualquer momento,
                  basta acessar o painel e escolher um plano.
                </p>
                <a
                  href="${APP_URL}/planos"
                  style="display:inline-block;margin-top:20px;padding:12px 24px;background:#1e3a8a;color:#fff;text-decoration:none;border-radius:8px;font-weight:600"
                >
                  Reativar assinatura
                </a>
                <p style="color:#6b7280;font-size:13px;margin-top:32px">
                  Se você tiver alguma dúvida, entre em contato conosco respondendo este e-mail.
                </p>
              </div>
            `,
          })
        } catch {
          // Email failure should not block the webhook response
        }
      }
      break
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string
      const { data: sub } = await adminSupabase
        .from("subscriptions")
        .select("user_id")
        .eq("stripe_customer_id", customerId)
        .single()
      if (sub?.user_id) {
        await adminSupabase.from("subscriptions")
          .update({ status: "past_due" })
          .eq("user_id", sub.user_id)

        // Send payment failed email
        const email = await getUserEmail(adminSupabase, sub.user_id)
        if (email) {
          try {
            const resend = await getResend()
            await resend.emails.send({
              from: FROM_EMAIL,
              to: email,
              subject: "Problema com seu pagamento - SurebetFlow",
              html: `
                <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
                  <h2 style="color:#b91c1c;margin-bottom:16px">Falha no pagamento</h2>
                  <p style="color:#374151;line-height:1.6">
                    Identificamos um problema ao processar o pagamento da sua assinatura do
                    <strong>SurebetFlow</strong>. Para evitar a interrupção do seu acesso,
                    atualize os dados do seu cartão o quanto antes.
                  </p>
                  <a
                    href="${APP_URL}/portal"
                    style="display:inline-block;margin-top:20px;padding:12px 24px;background:#b91c1c;color:#fff;text-decoration:none;border-radius:8px;font-weight:600"
                  >
                    Atualizar cartão
                  </a>
                  <p style="color:#6b7280;font-size:13px;margin-top:32px">
                    Se você acredita que isso é um engano ou precisar de ajuda, entre em contato
                    conosco respondendo este e-mail.
                  </p>
                </div>
              `,
            })
          } catch {
            // Email failure should not block the webhook response
          }
        }
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
