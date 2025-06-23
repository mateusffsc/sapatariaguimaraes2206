import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ServiceOrderHistoryService } from '../services/serviceOrderHistoryService';
import { toast } from 'sonner';

// ==================== QUERY KEYS ====================
export const serviceOrderHistoryKeys = {
  all: ['service_order_history'] as const,
  byOS: (osId: number) => [...serviceOrderHistoryKeys.all, 'os', osId] as const,
  stats: () => [...serviceOrderHistoryKeys.all, 'stats'] as const,
};

// ==================== QUERIES ====================

// Hook para obter histórico de uma OS específica
export function useHistoricoOS(serviceOrderId: number) {
  return useQuery({
    queryKey: serviceOrderHistoryKeys.byOS(serviceOrderId),
    queryFn: () => ServiceOrderHistoryService.obterHistoricoOS(serviceOrderId),
    enabled: !!serviceOrderId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para obter estatísticas do histórico
export function useEstatisticasHistorico() {
  return useQuery({
    queryKey: serviceOrderHistoryKeys.stats(),
    queryFn: () => ServiceOrderHistoryService.obterEstatisticasHistorico(),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

// ==================== MUTATIONS ====================

// Hook para mudar status com histórico
export function useMudarStatusComHistorico() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      serviceOrderId,
      novoStatus,
      statusAnterior,
      observacao
    }: {
      serviceOrderId: number;
      novoStatus: string;
      statusAnterior: string;
      observacao?: string;
    }) => {
      return ServiceOrderHistoryService.mudarStatusComHistorico(
        serviceOrderId,
        novoStatus,
        statusAnterior,
        observacao
      );
    },
    onSuccess: (_, { serviceOrderId, novoStatus }) => {
      // Invalidar cache do histórico da OS
      queryClient.invalidateQueries({ 
        queryKey: serviceOrderHistoryKeys.byOS(serviceOrderId) 
      });
      
      // Invalidar cache das estatísticas
      queryClient.invalidateQueries({ 
        queryKey: serviceOrderHistoryKeys.stats() 
      });
      
      // Invalidar cache das ordens de serviço
      queryClient.invalidateQueries({ queryKey: ['service_orders'] });
      queryClient.invalidateQueries({ queryKey: ['service_orders_compat'] });
      queryClient.invalidateQueries({ queryKey: ['service_orders_stats'] });
      
      const statusLabel = ServiceOrderHistoryService.getStatusLabel(novoStatus);
      toast.success(`Status alterado para "${statusLabel}" com sucesso!`);
    },
    onError: (error) => {
      console.error('Erro ao mudar status:', error);
      toast.error(`Erro ao alterar status: ${error.message}`);
    },
  });
}

// Hook para adicionar observação
export function useAdicionarObservacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      serviceOrderId,
      observacao,
      userId
    }: {
      serviceOrderId: number;
      observacao: string;
      userId?: string;
    }) => {
      return ServiceOrderHistoryService.adicionarObservacao(
        serviceOrderId,
        observacao,
        userId
      );
    },
    onSuccess: (_, { serviceOrderId }) => {
      // Invalidar cache do histórico da OS
      queryClient.invalidateQueries({ 
        queryKey: serviceOrderHistoryKeys.byOS(serviceOrderId) 
      });
      
      // Invalidar cache das estatísticas
      queryClient.invalidateQueries({ 
        queryKey: serviceOrderHistoryKeys.stats() 
      });
      
      toast.success('Observação adicionada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao adicionar observação:', error);
      toast.error(`Erro ao adicionar observação: ${error.message}`);
    },
  });
}

// Hook para registrar ação personalizada
export function useRegistrarAcao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      serviceOrderId,
      acao,
      detalhes,
      userId
    }: {
      serviceOrderId: number;
      acao: string;
      detalhes?: string;
      userId?: string;
    }) => {
      return ServiceOrderHistoryService.registrarAcao(
        serviceOrderId,
        acao,
        detalhes,
        userId
      );
    },
    onSuccess: (_, { serviceOrderId }) => {
      // Invalidar cache do histórico da OS
      queryClient.invalidateQueries({ 
        queryKey: serviceOrderHistoryKeys.byOS(serviceOrderId) 
      });
      
      // Invalidar cache das estatísticas
      queryClient.invalidateQueries({ 
        queryKey: serviceOrderHistoryKeys.stats() 
      });
      
      toast.success('Ação registrada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao registrar ação:', error);
      toast.error(`Erro ao registrar ação: ${error.message}`);
    },
  });
} 