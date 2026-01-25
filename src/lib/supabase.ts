import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis de ambiente do Supabase não configuradas')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ============================================
// TIPOS TYPESCRIPT
// ============================================

export interface Setor {
  id: string
  nome: string
  descricao?: string
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface Equipe {
  id: string
  nome: string
  setor_id: string
  descricao?: string
  link_comprovantes?: string
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface Usuario {
  id: string
  auth_user_id?: string
  nome: string
  email: string
  tipo: 'admin' | 'lancamento' | 'visualizacao'
  status_aprovacao: 'pendente' | 'aprovado' | 'reprovado'
  data_aprovacao?: string
  aprovado_por?: string
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface PermissaoUsuario {
  id: string
  usuario_id: string
  setor_id?: string
  equipe_id?: string
  tipo_acesso: 'setor' | 'equipe'
  concedido_por?: string
  data_concessao: string
  ativo: boolean
  created_at: string
}

export interface Periodo {
  id: string
  nome: string
  data_inicio: string
  data_fim: string
  tipo_acompanhamento: 'mensal' | 'bimestral' | 'trimestral' | 'quadrimestral' | 'semestral' | 'anual'
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface PeriodoLancamento {
  id: string
  periodo_id: string
  mes_referencia: string
  descricao?: string
  ordem: number
  created_at: string
}

export interface Meta {
  id: string
  nome: string
  descricao?: string
  equipe_id: string
  periodo_id: string
  tipo_acompanhamento: string
  status: 'ativa' | 'inativa'
  created_by: string
  created_at: string
  updated_at: string
}

export interface Lancamento {
  id: string
  meta_id: string
  periodo_lancamento_id: string
  resultado: string
  observacao?: string
  comprovante_anexado: boolean
  lancado_por: string
  editado_por?: string
  data_lancamento: string
  data_edicao?: string
  created_at: string
  updated_at: string
}

// ============================================
// TIPOS PARA VIEWS
// ============================================

export interface MetaCompleta {
  id: string
  meta_nome: string
  meta_descricao?: string
  meta_status: string
  equipe_nome: string
  setor_nome: string
  periodo_nome: string
  data_inicio: string
  data_fim: string
  tipo_acompanhamento: string
  criado_por_nome: string
  created_at: string
}

export interface DashboardLancamento {
  meta_id: string
  meta_nome: string
  equipe_nome: string
  setor_nome: string
  mes_referencia: string
  periodo_descricao: string
  status_lancamento: 'Lançado' | 'Pendente'
  resultado?: string
  data_lancamento?: string
  lancado_por_nome?: string
}
