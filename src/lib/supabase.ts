import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para as tabelas do banco de dados
export interface Cliente {
  id: string
  nome: string
  cpf: string
  telefone: string
  email?: string
  endereco?: string
  cidade?: string
  cep?: string
  observacoes?: string
  status: 'ativo' | 'inativo'
  created_at: string
  updated_at: string
}

export interface OrdemServico {
  id: string
  numero: string
  cliente_id: string
  cliente?: Cliente
  artigo: string
  descricao: string
  servico_id?: string
  tecnico_id?: string
  status: 'orçamento' | 'em-andamento' | 'pronto' | 'entregue' | 'cancelada'
  valor_total: number
  valor_entrada: number
  valor_restante: number
  data_entrada: string
  data_entrega_prevista?: string
  data_entrega_real?: string
  observacoes?: string
  created_at: string
  updated_at: string
}

export interface Servico {
  id: string
  nome: string
  descricao?: string
  preco_base: number
  tempo_estimado?: number
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface Tecnico {
  id: string
  nome: string
  telefone?: string
  email?: string
  especialidades?: string[]
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface Produto {
  id: string
  nome: string
  descricao?: string
  preco_venda: number
  preco_custo?: number
  categoria_id?: string
  estoque_atual: number
  estoque_minimo: number
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface Venda {
  id: string
  cliente_id?: string
  cliente?: Cliente
  produtos: VendaProduto[]
  valor_total: number
  forma_pagamento: string
  status: 'concluida' | 'cancelada'
  observacoes?: string
  created_at: string
  updated_at: string
}

export interface VendaProduto {
  id: string
  venda_id: string
  produto_id: string
  produto?: Produto
  quantidade: number
  preco_unitario: number
  subtotal: number
}

export interface MovimentacaoFinanceira {
  id: string
  tipo: 'entrada' | 'saida'
  categoria: string
  descricao: string
  valor: number
  forma_pagamento: string
  conta_bancaria_id?: string
  ordem_servico_id?: string
  venda_id?: string
  data_vencimento?: string
  data_pagamento?: string
  status: 'pendente' | 'pago' | 'cancelado'
  created_at: string
  updated_at: string
}

export interface ContaBancaria {
  id: string
  nome: string
  banco: string
  agencia?: string
  conta: string
  saldo_atual: number
  ativa: boolean
  created_at: string
  updated_at: string
}

export interface FormaPagamento {
  id: string
  nome: string
  taxa: number
  prazo_liquidacao: number
  ativa: boolean
  created_at: string
  updated_at: string
}

export interface Usuario {
  id: string
  nome: string
  email: string
  telefone?: string
  nivel_acesso: 'funcionario' | 'gerente' | 'administrador'
  permissoes: string[]
  ativo: boolean
  created_at: string
  updated_at: string
} 