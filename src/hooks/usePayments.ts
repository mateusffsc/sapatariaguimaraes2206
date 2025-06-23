import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PaymentService } from '../services/paymentService';
import type { MovimentacaoFinanceira } from '../lib/mappers';
import type { PaymentMethod, BankAccount, PaymentWithRelations, UpdatePaymentMethod } from '../types/database';
import { useToast } from './use-toast';

// Hook para listar pagamentos
export function useListarPagamentos(dataInicio?: string, dataFim?: string) {
  return useQuery({
    queryKey: ['payments', dataInicio, dataFim],
    queryFn: () => PaymentService.listarPagamentos(dataInicio, dataFim),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para criar pagamento
export function useCriarPagamento() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (movimentacao: Omit<MovimentacaoFinanceira, 'id' | 'created_at' | 'updated_at'>) =>
      PaymentService.criarPagamento(movimentacao),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['bank_accounts'] });
      queryClient.invalidateQueries({ queryKey: ['resumo_financeiro'] });
      toast({
        title: 'Sucesso',
        description: 'Movimentação financeira criada com sucesso',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Hook para atualizar pagamento
export function useAtualizarPagamento() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, dados }: { id: number; dados: Partial<MovimentacaoFinanceira> }) =>
      PaymentService.atualizarPagamento(id, dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['bank_accounts'] });
      queryClient.invalidateQueries({ queryKey: ['resumo_financeiro'] });
      toast({
        title: 'Sucesso',
        description: 'Movimentação financeira atualizada com sucesso',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Hook para excluir pagamento
export function useExcluirPagamento() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => PaymentService.excluirPagamento(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['bank_accounts'] });
      queryClient.invalidateQueries({ queryKey: ['resumo_financeiro'] });
      toast({
        title: 'Sucesso',
        description: 'Movimentação financeira excluída com sucesso',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Hook para listar formas de pagamento
export function useListarFormasPagamento() {
  return useQuery({
    queryKey: ['payment_methods'],
    queryFn: () => PaymentService.listarFormasPagamento(),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

// Hook para criar forma de pagamento
export function useCriarFormaPagamento() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: PaymentService.criarFormaPagamento,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment_methods'] });
      toast({
        title: 'Sucesso!',
        description: 'Forma de pagamento criada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro!',
        description: error.message || 'Erro ao criar forma de pagamento.',
        variant: 'destructive',
      });
    },
  });
}

// Hook para obter forma de pagamento
export function useObterFormaPagamento(id: number) {
  return useQuery({
    queryKey: ['payment_method', id],
    queryFn: () => PaymentService.obterFormaPagamento(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para atualizar forma de pagamento
export function useAtualizarFormaPagamento() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, dados }: { id: number; dados: UpdatePaymentMethod }) =>
      PaymentService.atualizarFormaPagamento(id, dados),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payment_methods'] });
      queryClient.invalidateQueries({ queryKey: ['payment_method', data.id] });
      toast({
        title: 'Sucesso!',
        description: 'Forma de pagamento atualizada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro!',
        description: error.message || 'Erro ao atualizar forma de pagamento.',
        variant: 'destructive',
      });
    },
  });
}

// Hook para excluir forma de pagamento
export function useExcluirFormaPagamento() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: PaymentService.excluirFormaPagamento,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment_methods'] });
      toast({
        title: 'Sucesso!',
        description: 'Forma de pagamento excluída com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro!',
        description: error.message || 'Erro ao excluir forma de pagamento.',
        variant: 'destructive',
      });
    },
  });
}

// Hook para listar contas bancárias
export function useListarContasBancarias() {
  return useQuery({
    queryKey: ['bank_accounts'],
    queryFn: () => PaymentService.listarContasBancarias(),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

// Hook para obter resumo financeiro
export function useResumoFinanceiro(dataInicio: string, dataFim: string) {
  return useQuery({
    queryKey: ['resumo_financeiro', dataInicio, dataFim],
    queryFn: () => PaymentService.obterResumoFinanceiro(dataInicio, dataFim),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para obter pagamento por ID
export function useObterPagamento(id: number) {
  return useQuery({
    queryKey: ['payment', id],
    queryFn: () => PaymentService.obterPagamentoPorId(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para listar movimentações (compatibilidade)
export function useListarMovimentacoes(dataInicio?: string, dataFim?: string) {
  return useQuery({
    queryKey: ['movimentacoes', dataInicio, dataFim],
    queryFn: () => PaymentService.listarMovimentacoes(dataInicio, dataFim),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
} 