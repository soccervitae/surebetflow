import { NextRequest, NextResponse } from "next/server"
import { stripe, STATUS_MAP } from "@/lib/stripe"
import { createAdminClient } from "@/lib/supabase/admin"
import { getResendApiKey } from "@/lib/settings"
import { emailWrapper } from "@/lib/email-template"
import { Resend } from "resend"
import type Stripe from "stripe"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.surebetflow.bet"
const FROM_EMAIL = "SurebetFlow <naoresponda@surebetflow.bet>"

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
            html: emailWrapper(`
              <p style="margin:0 0 6px;color:#f1f5f9;font-size:20px;font-weight:700;">Assinatura cancelada</p>
              <p style="margin:0 0 24px;color:#94a3b8;font-size:14px;line-height:1.7;">
                Sua assinatura do <strong style="color:#e2e8f0;">SurebetFlow</strong> foi cancelada.
                Você ainda poderá acessar os recursos do plano até o final do período já pago.
              </p>
              <p style="margin:0 0 28px;color:#94a3b8;font-size:14px;line-height:1.7;">
                Sentiremos sua falta! Caso queira reativar a qualquer momento, basta acessar o painel e escolher um plano.
              </p>
              <a href="${APP_URL}/assinatura"
                 style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#1e3a8a,#1e40af);color:#fff;text-decoration:none;border-radius:12px;font-size:14px;font-weight:700;">
                Reativar assinatura
              </a>
              <p style="margin:28px 0 0;color:#475569;font-size:12px;line-height:1.6;">
                Se tiver alguma dúvida, entre em contato respondendo este e-mail.
              </p>
            `),
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
              html: emailWrapper(`
                <p style="margin:0 0 6px;color:#f1f5f9;font-size:20px;font-weight:700;">⚠️ Problema com seu pagamento</p>
                <p style="margin:0 0 24px;color:#94a3b8;font-size:14px;line-height:1.7;">
                  Identificamos um problema ao processar o pagamento da sua assinatura do
                  <strong style="color:#e2e8f0;">SurebetFlow</strong>.
                  Para evitar a interrupção do seu acesso, atualize os dados do cartão o quanto antes.
                </p>
                <div style="background:#7f1d1d22;border-left:3px solid #ef4444;border-radius:0 8px 8px 0;padding:12px 16px;margin-bottom:28px;">
                  <p style="margin:0;color:#fca5a5;font-size:13px;line-height:1.5;">
                    Seu acesso pode ser suspenso caso o pagamento não seja regularizado em breve.
                  </p>
                </div>
                <a href="${APP_URL}/assinatura"
                   style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#991b1b,#b91c1c);color:#fff;text-decoration:none;border-radius:12px;font-size:14px;font-weight:700;">
                  Atualizar cartão agora
                </a>
                <p style="margin:28px 0 0;color:#475569;font-size:12px;line-height:1.6;">
                  Se acredita que isso é um engano ou precisar de ajuda, responda este e-mail.
                </p>
              `),
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
