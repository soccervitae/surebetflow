import type { Metadata } from "next"
import DemoClient from "./DemoClient"

export const metadata: Metadata = {
  title: "Demo — SurebetFlow",
  description: "Explore o dashboard da SurebetFlow sem precisar de cadastro. Veja como funciona a gestão de apostas de arbitragem.",
}

export default function DemoPage() {
  return <DemoClient />
}
