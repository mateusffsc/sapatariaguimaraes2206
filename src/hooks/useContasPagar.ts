import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ContasPagarService } from '../services/contasPagarService';
import { CreateAccountsPayable, UpdateAccountsPayable, AccountsPayableStatus } from '../types/database';
import { toast } from 'sonner';

// Query Keys
export const contasPagarKeys = {
  all: ['contas-pagar'] as const,
  lists: () => [...contasPagarKeys.all, 'list'] as const,
  list: (filtros?: any) => [...contasPagarKeys.lists(), filtros] as const,
  details: () => [...contasPagarKeys.all, 'detail'] as const,
  detail: (id: number) => [...contasPagarKeys.details(), id] as const,
  resumo: () => [...contasPagarKeys.all, 'resumo'] as const,
  lembretes: () => [...contasPagarKeys.all, 'lembretes'] as const,
  fornecedores: () => [...contasPagarKeys.all, 'fornecedores'] as const,
};

interface FiltrosContasPagar {
  status?: AccountsPayableStatus;
  vencimentoAte?: string;
  vencimentoDe?: string;
  fornecedorId?: number;
  limit?: number;
  offset?: number;
}

// ============================================================================
// HOOKS DE QUERY
// ============================================================================

export function useContasPagar(filtros?: FiltrosContasPagar) {
  return useQuery({
    queryKey: contasPagarKeys.list(filtros),
    queryFn: () => ContasPagarService.listarContasPagar(filtros),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

export function useContaPagar(id: number) {
  return useQuery({
    queryKey: contasPagarKeys.detail(id),
    queryFn: () => ContasPagarService.obterContaPagar(id),
    enabled: !!id,
    staleTime: 30 * 1000, // 30 segundos
  });
}

export function useContasVencidas() {
  return useQuery({
    queryKey: contasPagarKeys.list({ status: 'open', vencimentoAte: new Date().toISOString().split('T')[0] }),
    queryFn: () => ContasPagarService.listarContasVencidas(),
    staleTime: 1 * 60 * 1000, // 1 minuto
    refetchInterval: 5 * 60 * 1000, // Refetch a cada 5 minutos
  });
}

export function useContasVencendoEm(dias: number) {
  return useQuery({
    queryKey: [...contasPagarKeys.lists(), 'vencendo', dias],
    queryFn: () => ContasPagarService.listarContasVencendoEm(dias),
    staleTime: 1 * 60 * 1000, // 1 minuto
  });
}

export function useResumoContasPagar(dataInicio?: string, dataFim?: string) {
  return useQuery({
    queryKey: [...contasPagarKeys.resumo(), dataInicio, dataFim],
    queryFn: () => ContasPagarService.obterResumoContasPagar(dataInicio, dataFim),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

export function useLembretesContasPagar() {
  return useQuery({
    queryKey: contasPagarKeys.lembretes(),
    queryFn: () => ContasPagarService.obterLembretes(),
    staleTime: 30 * 1000, // 30 segundos
    refetchInterval: 2 * 60 * 1000, // Refetch a cada 2 minutos
  });
}

export function useContasPorFornecedor() {
  return useQuery({
    queryKey: [...contasPagarKeys.all, 'por-fornecedor'],
    queryFn: () => ContasPagarService.obterContasPorFornecedor(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useFornecedores() {
  return useQuery({
    queryKey: contasPagarKeys.fornecedores(),
    queryFn: () => ContasPagarService.listarFornecedores(),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

// ============================================================================
// HOOKS DE MUTATION
// ============================================================================

export function useCriarContaPagar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conta: CreateAccountsPayable) => ContasPagarService.criarContaPagar(conta),
    onSuccess: (novaConta) => {
      // Invalidar todas as queries de contas a pagar
      queryClient.invalidateQueries({ queryKey: contasPagarKeys.all });
      
      toast.success(`Conta "${novaConta.description}" criada com sucesso!`);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar conta: ${error.message}`);
    },
  });
}

export function useAtualizarContaPagar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dados }: { id: number; dados: UpdateAccountsPayable }) => 
      ContasPagarService.atualizarContaPagar(id, dados),
    onSuccess: (contaAtualizada) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: contasPagarKeys.all });
      
      // Atualizar cache específico
      queryClient.setQueryData(
        contasPagarKeys.detail(contaAtualizada.id),
        contaAtualizada
      );

      toast.success(`Conta "${contaAtualizada.description}" atualizada com sucesso!`);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar conta: ${error.message}`);
    },
  });
}

export function useExcluirContaPagar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => ContasPagarService.excluirContaPagar(id),
    onSuccess: () => {
      // Invalidar todas as queries
      queryClient.invalidateQueries({ queryKey: contasPagarKeys.all });
      
      toast.success('Conta excluída com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir conta: ${error.message}`);
    },
  });
}

export function useRegistrarPagamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ contaId, valorPago, dataPagamento }: { 
      contaId: number; 
      valorPago: number; 
      dataPagamento?: string;
    }) => ContasPagarService.registrarPagamento(contaId, valorPago, dataPagamento),
    onSuccess: (contaAtualizada) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: contasPagarKeys.all });
      
      // Invalidar também queries financeiras se existirem
      queryClient.invalidateQueries({ queryKey: ['financeiro'] });

      const valorFormatado = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(contaAtualizada.amount_paid);

      toast.success(`Pagamento registrado! Total pago: ${valorFormatado}`);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao registrar pagamento: ${error.message}`);
    },
  });
}

export function useEstornarPagamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ contaId, valorEstorno }: { contaId: number; valorEstorno: number }) => 
      ContasPagarService.estornarPagamento(contaId, valorEstorno),
    onSuccess: (contaAtualizada) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: contasPagarKeys.all });
      queryClient.invalidateQueries({ queryKey: ['financeiro'] });

      const valorFormatado = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(contaAtualizada.amount_paid);

      toast.success(`Pagamento estornado! Total pago atual: ${valorFormatado}`);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao estornar pagamento: ${error.message}`);
    },
  });
}

export function useMarcarStatusVencidas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => ContasPagarService.marcarStatusVencidas(),
    onSuccess: (quantidade) => {
      // Invalidar queries de contas
      queryClient.invalidateQueries({ queryKey: contasPagarKeys.all });
      
      if (quantidade > 0) {
        toast.info(`${quantidade} conta(s) marcada(s) como vencida(s)`);
      }
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar status: ${error.message}`);
    },
  });
}

// ============================================================================
// HOOKS CUSTOMIZADOS PARA CASOS ESPECÍFICOS
// ============================================================================

// Hook para dashboard de contas a pagar
export function useDashboardContasPagar() {
  const lembretes = useLembretesContasPagar();
  const resumo = useResumoContasPagar();
  const contasPorFornecedor = useContasPorFornecedor();

  return {
    lembretes: lembretes.data,
    resumo: resumo.data,
    contasPorFornecedor: contasPorFornecedor.data,
    isLoading: lembretes.isLoading || resumo.isLoading || contasPorFornecedor.isLoading,
    error: lembretes.error || resumo.error || contasPorFornecedor.error,
    refetch: () => {
      lembretes.refetch();
      resumo.refetch();
      contasPorFornecedor.refetch();
    }
  };
}

// Hook para verificar alertas críticos
export function useAlertasContasPagar() {
  const { data: lembretes } = useLembretesContasPagar();

  const alertasCriticos = {
    vencidas: lembretes?.vencidas?.length || 0,
    vencendoHoje: lembretes?.vencendoHoje?.length || 0,
    vencendoAmanha: lembretes?.vencendoAmanha?.length || 0,
    total: (lembretes?.vencidas?.length || 0) + (lembretes?.vencendoHoje?.length || 0)
  };

  return alertasCriticos;
} 