"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CreditCard, CheckCircle, QrCode } from "lucide-react"

export default function AssinaturaPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 bg-[#16A34A]/10 rounded-xl flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-[#16A34A]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assinatura</h1>
          <p className="text-sm text-gray-500">Gerencie sua assinatura do SureBetFlow</p>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold text-gray-900 text-lg">Plano Profissional</p>
              <p className="text-gray-500 text-sm">R$ 49,90/mês</p>
            </div>
            <Badge className="bg-[#16A34A]/10 text-[#16A34A] border-0 text-sm px-3 py-1">Ativa</Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <CheckCircle className="w-4 h-4 text-[#16A34A]" />
            <span>Próxima cobrança em <strong className="text-gray-900">21/07/2026</strong></span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Cartão de Crédito
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-3">Cobrança automática mensal. Cartão cadastrado: <span className="font-medium text-gray-900">•••• •••• •••• 4242</span></p>
            <Button variant="outline" size="sm">Trocar cartão</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <QrCode className="w-4 h-4" /> PIX Manual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-3">Pague via PIX manualmente. Um lembrete será enviado por e-mail próximo ao vencimento.</p>
            <Button variant="outline" size="sm">Gerar QR Code PIX</Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 border-[#E5E1D8]">
        <CardHeader><CardTitle className="text-base">Recursos do Plano</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600">
            {[
              "Perfis ilimitados de apostador",
              "Casas de apostas ilimitadas por perfil",
              "Calculadora de surebet 2-way e 3-way",
              "Dashboard financeiro completo",
              "Histórico completo de apostas",
              "Senha criptografada com AES-256-GCM",
              "Suporte por e-mail",
            ].map(f => (
              <li key={f} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
