export interface Profile {
  id: string
  user_id: string
  nome: string
  sobrenome: string
  apelido?: string | null
  cpf: string
  telefone?: string | null
  whatsapp?: string | null
  email?: string | null
  foto_url?: string | null
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface Bet {
  id: string
  nome: string
  logo_url?: string | null
  created_at: string
}

export interface ProfileBet {
  id: string
  profile_id: string
  bet_id: string
  email: string
  senha_encrypted?: Uint8Array | null
  senha_nonce?: Uint8Array | null
  saldo: number
  created_at: string
  updated_at: string
  bet?: Bet
}

export interface ApostaLeg {
  id: string
  aposta_id: string
  profile_bet_id: string
  resultado_apostado: string
  odd: number
  stake: number
  created_at: string
  profile_bet?: ProfileBet & { bet?: Bet }
}

export type ApostaStatus = 'pendente' | 'finalizada' | 'cancelada'
export type ApostaTipo = '2-way' | '3-way'

export interface Aposta {
  id: string
  profile_id: string
  evento: string
  esporte?: string | null
  competicao?: string | null
  tipo: ApostaTipo
  investimento_total: number
  lucro_garantido: number
  roi_percentual: number
  status: ApostaStatus
  resultado_real?: number | null
  finalizada_at?: string | null
  data_evento?: string | null
  created_at: string
  updated_at: string
  legs?: ApostaLeg[]
  profile?: Profile
}

export interface MovimentacaoFinanceira {
  id: string
  profile_id: string
  profile_bet_id?: string | null
  tipo: 'deposito' | 'saque' | 'lucro' | 'perda' | 'bonus'
  valor: number
  descricao?: string | null
  created_at: string
  profile?: Profile
  profile_bet?: ProfileBet & { bet?: Bet }
}

export interface ProfileDashboard {
  profile_id: string
  user_id: string
  nome: string
  sobrenome: string
  apelido?: string | null
  foto_url?: string | null
  saldo_total: number
  lucro_realizado: number
  lucro_pendente: number
  total_investido: number
  total_apostas: number
  apostas_finalizadas: number
  roi_percentual: number
  bonus_total: number
}

export interface DashboardGeral {
  user_id: string
  saldo_total: number
  lucro_realizado: number
  lucro_pendente: number
  total_investido: number
  total_apostas: number
  apostas_finalizadas: number
  roi_percentual: number
}
