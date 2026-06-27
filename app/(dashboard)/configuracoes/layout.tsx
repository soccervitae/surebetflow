import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Minha Conta",
  description: "Gerencie seus dados pessoais, segurança, aparência e preferências da sua conta SurebetFlow.",
}

export default function ConfiguracoesLayout({ children }: { children: React.ReactNode }) {
  return children
}
