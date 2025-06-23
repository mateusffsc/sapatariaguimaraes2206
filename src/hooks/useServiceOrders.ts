import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ServiceOrderService } from '../services/serviceOrderService';
import type { OrdemServico } from '../lib/mappers';
import type { ServiceOrderStatus, ServiceOrderWithRelations } from '../types/database';
import { useToast } from './use-toast';

// Hook para listar ordens de serviço
export function useListarOrdensServico(filtros?: {
  status?: ServiceOrderStatus;
  cliente_id?: number;
  tecnico_id?: number;
  dataInicio?: string;
  dataFim?: string;
}) {
  return useQuery({
    queryKey: ['service_orders', filtros],
    queryFn: () => ServiceOrderService.listarOrdensServico(filtros),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

// Hook para listar ordens de serviço (compatibilidade)
export function useListarOrdensServicoCompatibilidade(filtros?: {
  status?: string;
  cliente_id?: number;
  tecnico_id?: number;
  dataInicio?: string;
  dataFim?: string;
}) {
  return useQuery({
    queryKey: ['service_orders_compat', filtros],
    queryFn: () => ServiceOrderService.listarOrdensServicoCompatibilidade(filtros),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

// Hook para obter ordem de serviço por ID
export function useObterOrdemServico(id: number) {
  return useQuery({
    queryKey: ['service_order', id],
    queryFn: () => ServiceOrderService.obterOrdemServicoPorId(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para criar ordem de serviço
export function useCriarOrdemServico() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (dadosOS: Omit<OrdemServico, 'id' | 'created_at' | 'updated_at'>) =>
      ServiceOrderService.criarOrdemServico(dadosOS),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service_orders'] });
      queryClient.invalidateQueries({ queryKey: ['service_orders_compat'] });
      queryClient.invalidateQueries({ queryKey: ['service_orders_stats'] });
      toast({
        title: 'Sucesso',
        description: 'Ordem de serviço criada com sucesso',
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

// Hook para atualizar ordem de serviço
export function useAtualizarOrdemServico() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, dados }: { id: number; dados: Partial<OrdemServico> }) =>
      ServiceOrderService.atualizarOrdemServico(id, dados),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['service_orders'] });
      queryClient.invalidateQueries({ queryKey: ['service_orders_compat'] });
      queryClient.invalidateQueries({ queryKey: ['service_order', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['service_orders_stats'] });
      queryClient.invalidateQueries({ queryKey: ['service_order_history', variables.id] });
      toast({
        title: 'Sucesso',
        description: 'Ordem de serviço atualizada com sucesso',
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

// Hook para excluir ordem de serviço
export function useExcluirOrdemServico() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => ServiceOrderService.excluirOrdemServico(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service_orders'] });
      queryClient.invalidateQueries({ queryKey: ['service_orders_compat'] });
      queryClient.invalidateQueries({ queryKey: ['service_orders_stats'] });
      toast({
        title: 'Sucesso',
        description: 'Ordem de serviço excluída com sucesso',
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

// Hook para obter estatísticas das ordens de serviço
export function useEstatisticasOrdensServico() {
  return useQuery({
    queryKey: ['service_orders_stats'],
    queryFn: () => ServiceOrderService.obterEstatisticas(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para obter histórico de uma ordem de serviço
export function useHistoricoOrdemServico(ordemServicoId: number) {
  return useQuery({
    queryKey: ['service_order_history', ordemServicoId],
    queryFn: () => ServiceOrderService.obterHistorico(ordemServicoId),
    enabled: !!ordemServicoId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

// Hook para criar entrada no histórico
export function useCriarHistoricoOS() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ ordemServicoId, tipo, observacao }: {
      ordemServicoId: number;
      tipo: string;
      observacao: string;
    }) => ServiceOrderService.criarHistorico(ordemServicoId, tipo, observacao),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['service_order_history', variables.ordemServicoId] });
      queryClient.invalidateQueries({ queryKey: ['service_order', variables.ordemServicoId] });
      toast({
        title: 'Sucesso',
        description: 'Histórico adicionado com sucesso',
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

// Hook customizado para mudança de status
export function useMudarStatusOS() {
  const atualizarOS = useAtualizarOrdemServico();
  
  return {
    ...atualizarOS,
    mudarStatus: (id: number, novoStatus: string, observacao?: string) => {
      return atualizarOS.mutate({
        id,
        dados: { status: novoStatus as any }
      });
    }
  };
}

// Hook para buscar ordens de serviço por texto
export function useBuscarOrdensServico(termoBusca: string) {
  return useQuery({
    queryKey: ['service_orders_search', termoBusca],
    queryFn: async () => {
      // Por enquanto, buscar em todas e filtrar no cliente
      // TODO: Implementar busca no servidor
      const todasOrdens = await ServiceOrderService.listarOrdensServicoCompatibilidade();
      
      if (!termoBusca.trim()) {
        return todasOrdens;
      }

      const termo = termoBusca.toLowerCase();
      return todasOrdens.filter(os => 
        os.numero.toLowerCase().includes(termo) ||
        os.artigo?.toLowerCase().includes(termo) ||
        os.descricao?.toLowerCase().includes(termo)
      );
    },
    enabled: termoBusca.length >= 2,
    staleTime: 1 * 60 * 1000, // 1 minuto
  });
} 