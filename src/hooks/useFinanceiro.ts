import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FinanceiroService } from '../services/financeiroService'
import { type MovimentacaoFinanceira, type ContaBancaria } from '../lib/supabase'
import { toast } from 'sonner'

// Query Keys
export const financeiroKeys = {
  all: ['financeiro'] as const,
  movimentacoes: () => [...financeiroKeys.all, 'movimentacoes'] as const,
  movimentacoesPeriodo: (inicio: string, fim: string) => [...financeiroKeys.movimentacoes(), 'periodo', inicio, fim] as const,
  movimentacoesDia: (data: string) => [...financeiroKeys.movimentacoes(), 'dia', data] as const,
  resumo: (inicio: string, fim: string) => [...financeiroKeys.all, 'resumo', inicio, fim] as const,
  saldoCaixa: () => [...financeiroKeys.all, 'saldo-caixa'] as const,
  contas: () => [...financeiroKeys.all, 'contas'] as const,
  estatisticas: (ano: number, mes: number) => [...financeiroKeys.all, 'estatisticas', ano, mes] as const,
}

// Hooks de Query - Movimentações
export function useMovimentacoes(dataInicio?: string, dataFim?: string) {
  const queryKey = dataInicio && dataFim 
    ? financeiroKeys.movimentacoesPeriodo(dataInicio, dataFim)
    : financeiroKeys.movimentacoes()

  return useQuery({
    queryKey,
    queryFn: () => FinanceiroService.listarMovimentacoes(dataInicio, dataFim),
    staleTime: 2 * 60 * 1000, // 2 minutos
  })
}

export function useMovimentacoesDia(data?: string) {
  const dataConsulta = data || new Date().toISOString().split('T')[0]
  
  return useQuery({
    queryKey: financeiroKeys.movimentacoesDia(dataConsulta),
    queryFn: () => FinanceiroService.obterMovimentacoesDia(dataConsulta),
    staleTime: 1 * 60 * 1000, // 1 minuto
  })
}

export function useResumoFinanceiro(dataInicio: string, dataFim: string) {
  return useQuery({
    queryKey: financeiroKeys.resumo(dataInicio, dataFim),
    queryFn: () => FinanceiroService.obterResumoFinanceiro(dataInicio, dataFim),
    enabled: !!dataInicio && !!dataFim,
    staleTime: 5 * 60 * 1000,
  })
}

export function useSaldoCaixa() {
  return useQuery({
    queryKey: financeiroKeys.saldoCaixa(),
    queryFn: FinanceiroService.obterSaldoCaixa,
    staleTime: 1 * 60 * 1000, // 1 minuto
    refetchInterval: 5 * 60 * 1000, // Refetch a cada 5 minutos
  })
}

// Hooks de Query - Contas Bancárias
export function useContasBancarias() {
  return useQuery({
    queryKey: financeiroKeys.contas(),
    queryFn: FinanceiroService.listarContasBancarias,
    staleTime: 10 * 60 * 1000, // 10 minutos
  })
}

// Hooks de Query - Estatísticas
export function useEstatisticasMes(ano: number, mes: number) {
  return useQuery({
    queryKey: financeiroKeys.estatisticas(ano, mes),
    queryFn: () => FinanceiroService.obterEstatisticasMes(ano, mes),
    staleTime: 30 * 60 * 1000, // 30 minutos
  })
}

// Hook para resumo do dia atual
export function useResumoHoje() {
  const hoje = new Date().toISOString().split('T')[0]
  const amanha = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  
  return useResumoFinanceiro(hoje, amanha)
}

// Hooks de Mutation - Movimentações
export function useCriarMovimentacao() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: FinanceiroService.criarMovimentacao,
    onSuccess: (novaMovimentacao) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: financeiroKeys.all })
      
      // Atualizar cache otimisticamente para movimentações do dia
      const hoje = new Date().toISOString().split('T')[0]
      queryClient.setQueryData<MovimentacaoFinanceira[]>(
        financeiroKeys.movimentacoesDia(hoje), 
        (old) => {
          if (!old) return [novaMovimentacao]
          return [novaMovimentacao, ...old]
        }
      )

      const tipoTexto = novaMovimentacao.tipo === 'entrada' ? 'Entrada' : 'Saída'
      toast.success(`${tipoTexto} de R$ ${novaMovimentacao.valor.toFixed(2)} registrada com sucesso!`)
    },
    onError: (error) => {
      toast.error(`Erro ao registrar movimentação: ${error.message}`)
    },
  })
}

export function useAtualizarMovimentacao() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, dados }: { 
      id: string; 
      dados: Partial<Omit<MovimentacaoFinanceira, 'id' | 'created_at' | 'updated_at'>> 
    }) => FinanceiroService.atualizarMovimentacao(id, dados),
    onSuccess: () => {
      // Invalidar todas as queries financeiras
      queryClient.invalidateQueries({ queryKey: financeiroKeys.all })
      
      toast.success('Movimentação atualizada com sucesso!')
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar movimentação: ${error.message}`)
    },
  })
}

export function useExcluirMovimentacao() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: FinanceiroService.excluirMovimentacao,
    onSuccess: () => {
      // Invalidar todas as queries financeiras
      queryClient.invalidateQueries({ queryKey: financeiroKeys.all })
      
      toast.success('Movimentação excluída com sucesso!')
    },
    onError: (error) => {
      toast.error(`Erro ao excluir movimentação: ${error.message}`)
    },
  })
}

// Hooks de Mutation - Contas Bancárias
export function useCriarContaBancaria() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: FinanceiroService.criarContaBancaria,
    onSuccess: (novaConta) => {
      // Invalidar queries de contas
      queryClient.invalidateQueries({ queryKey: financeiroKeys.contas() })
      
      // Adicionar nova conta ao cache otimisticamente
      queryClient.setQueryData<ContaBancaria[]>(financeiroKeys.contas(), (old) => {
        if (!old) return [novaConta]
        return [...old, novaConta].sort((a, b) => a.nome.localeCompare(b.nome))
      })

      toast.success(`Conta ${novaConta.nome} criada com sucesso!`)
    },
    onError: (error) => {
      toast.error(`Erro ao criar conta bancária: ${error.message}`)
    },
  })
}

export function useAtualizarContaBancaria() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, dados }: { 
      id: string; 
      dados: Partial<Omit<ContaBancaria, 'id' | 'created_at' | 'updated_at'>> 
    }) => FinanceiroService.atualizarContaBancaria(id, dados),
    onSuccess: (contaAtualizada) => {
      // Invalidar queries de contas
      queryClient.invalidateQueries({ queryKey: financeiroKeys.contas() })
      
      toast.success(`Conta ${contaAtualizada.nome} atualizada com sucesso!`)
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar conta bancária: ${error.message}`)
    },
  })
}

// Hook customizado para registrar transação de OS
export function useRegistrarTransacaoOS() {
  const criarMovimentacao = useCriarMovimentacao()
  
  return {
    ...criarMovimentacao,
    registrarPagamentoOS: (dados: {
      ordemServicoId: string
      valor: number
      formaPagamento: string
      descricao: string
      contaBancariaId?: string
    }) => {
      return criarMovimentacao.mutate({
        tipo: 'entrada',
        categoria: 'Serviços',
        descricao: dados.descricao,
        valor: dados.valor,
        forma_pagamento: dados.formaPagamento,
        ordem_servico_id: dados.ordemServicoId,
        conta_bancaria_id: dados.contaBancariaId,
        status: 'pago',
        data_pagamento: new Date().toISOString(),
      })
    }
  }
}

// Hook customizado para obter estatísticas do dashboard
export function useEstatisticasDashboard() {
  const hoje = new Date()
  const mesAtual = hoje.getMonth() + 1
  const anoAtual = hoje.getFullYear()
  
  const saldoCaixa = useSaldoCaixa()
  const movimentacoesHoje = useMovimentacoesDia()
  const estatisticasMes = useEstatisticasMes(anoAtual, mesAtual)
  
  return {
    saldoCaixa: saldoCaixa.data || 0,
    movimentacoesHoje: movimentacoesHoje.data || [],
    estatisticasMes: estatisticasMes.data,
    isLoading: saldoCaixa.isLoading || movimentacoesHoje.isLoading || estatisticasMes.isLoading,
    error: saldoCaixa.error || movimentacoesHoje.error || estatisticasMes.error,
  }
} 