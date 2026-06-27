import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Financeiro",
  description: "Acompanhe a evolução da sua banca, total investido, lucro realizado e ROI por período. Análise financeira completa das suas apostas de arbitragem.",
}

export default function FinanceiroLayout({ children }: { children: React.ReactNode }) {
  return children
}
