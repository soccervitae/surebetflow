import type { Metadata } from "next"
import TutorialClient from "./TutorialClient"

export const metadata: Metadata = {
  title: "Tutorial",
  description: "Aprenda a usar todas as funcionalidades do SurebetFlow: dashboard, perfis, calculadora, apostas, financeiro e mais.",
}

export default function TutorialPage() {
  return <TutorialClient />
}
