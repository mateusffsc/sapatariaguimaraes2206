import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { OrdemServicoService } from '../services/ordemServicoService'
import { type OrdemServico } from '../lib/supabase'
import { toast } from 'sonner'

// Query Keys
export const ordemServicoKeys = {
  all: ['ordens-servico'] as const,
  lists: () => [...ordemServicoKeys.all, 'list'] as const,
  list: (filters: string) => [...ordemServicoKeys.lists(), { filters }] as const,
  details: () => [...ordemServicoKeys.all, 'detail'] as const,
  detail: (id: string) => [...ordemServicoKeys.details(), id] as const,
  search: (termo: string) => [...ordemServicoKeys.all, 'search', termo] as const,
  byStatus: (status: OrdemServico['status']) => [...ordemServicoKeys.all, 'status', status] as const,
  byCliente: (clienteId: string) => [...ordemServicoKeys.all, 'cliente', clienteId] as const,
  statistics: () => [...ordemServicoKeys.all, 'statistics'] as const,
}

// Hooks de Query
export function useOrdensServico() {
  return useQuery({
    queryKey: ordemServicoKeys.lists(),
    queryFn: OrdemServicoService.listarOrdens,
    staleTime: 2 * 60 * 1000, // 2 minutos
  })
}

export function useOrdemServico(id: string) {
  return useQuery({
    queryKey: ordemServicoKeys.detail(id),
    queryFn: () => OrdemServicoService.obterOrdemPorId(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export function useBuscarOrdensServico(termo: string) {
  return useQuery({
    queryKey: ordemServicoKeys.search(termo),
    queryFn: () => OrdemServicoService.buscarOrdens(termo),
    enabled: termo.trim().length >= 2,
    staleTime: 1 * 60 * 1000, // 1 minuto
  })
}

export function useOrdensPorStatus(status: OrdemServico['status']) {
  return useQuery({
    queryKey: ordemServicoKeys.byStatus(status),
    queryFn: () => OrdemServicoService.listarOrdensPorStatus(status),
    staleTime: 2 * 60 * 1000,
  })
}

export function useOrdensPorCliente(clienteId: string) {
  return useQuery({
    queryKey: ordemServicoKeys.byCliente(clienteId),
    queryFn: () => OrdemServicoService.buscarOrdensPorCliente(clienteId),
    enabled: !!clienteId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useContarOrdensPorStatus() {
  return useQuery({
    queryKey: [...ordemServicoKeys.all, 'count-by-status'],
    queryFn: OrdemServicoService.contarOrdensPorStatus,
    staleTime: 5 * 60 * 1000,
  })
}

export function useOrdensVencidas() {
  return useQuery({
    queryKey: [...ordemServicoKeys.all, 'vencidas'],
    queryFn: OrdemServicoService.obterOrdensVencidas,
    staleTime: 10 * 60 * 1000,
  })
}

export function useTicketMedio() {
  return useQuery({
    queryKey: [...ordemServicoKeys.all, 'ticket-medio'],
    queryFn: OrdemServicoService.calcularTicketMedio,
    staleTime: 30 * 60 * 1000, // 30 minutos
  })
}

// Hooks de Mutation
export function useCriarOrdemServico() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: OrdemServicoService.criarOrdem,
    onSuccess: (novaOrdem) => {
      // Invalidar todas as queries de ordens
      queryClient.invalidateQueries({ queryKey: ordemServicoKeys.all })
      
      // Adicionar a nova ordem ao cache otimisticamente
      queryClient.setQueryData<OrdemServico[]>(ordemServicoKeys.lists(), (old) => {
        if (!old) return [novaOrdem]
        return [novaOrdem, ...old]
      })

      toast.success(`Ordem de serviço ${novaOrdem.numero} criada com sucesso!`)
    },
    onError: (error) => {
      toast.error(`Erro ao criar ordem de serviço: ${error.message}`)
    },
  })
}

export function useAtualizarOrdemServico() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, dados }: { 
      id: string; 
      dados: Partial<Omit<OrdemServico, 'id' | 'created_at' | 'updated_at' | 'cliente'>> 
    }) => OrdemServicoService.atualizarOrdem(id, dados),
    onSuccess: (ordemAtualizada) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ordemServicoKeys.all })
      
      // Atualizar a ordem específica no cache
      queryClient.setQueryData(ordemServicoKeys.detail(ordemAtualizada.id), ordemAtualizada)

      toast.success(`Ordem ${ordemAtualizada.numero} atualizada com sucesso!`)
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar ordem de serviço: ${error.message}`)
    },
  })
}

export function useAtualizarStatusOrdem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrdemServico['status'] }) =>
      OrdemServicoService.atualizarStatus(id, status),
    onSuccess: (ordemAtualizada) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ordemServicoKeys.all })
      
      // Atualizar a ordem específica no cache
      queryClient.setQueryData(ordemServicoKeys.detail(ordemAtualizada.id), ordemAtualizada)

      const statusMessages = {
        'orçamento': 'movida para orçamento',
        'em-andamento': 'iniciada',
        'pronto': 'marcada como pronta',
        'entregue': 'entregue ao cliente',
        'cancelada': 'cancelada'
      }

      toast.success(`Ordem ${ordemAtualizada.numero} ${statusMessages[status]}!`)
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar status: ${error.message}`)
    },
  })
}

export function useExcluirOrdemServico() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: OrdemServicoService.excluirOrdem,
    onSuccess: (_, ordemId) => {
      // Invalidar todas as queries de ordens
      queryClient.invalidateQueries({ queryKey: ordemServicoKeys.all })
      
      // Remover a ordem específica do cache
      queryClient.removeQueries({ queryKey: ordemServicoKeys.detail(ordemId) })

      toast.success('Ordem de serviço excluída com sucesso!')
    },
    onError: (error) => {
      toast.error(`Erro ao excluir ordem de serviço: ${error.message}`)
    },
  })
}

// Hook para buscar por número da ordem
export function useBuscarOrdemPorNumero(numero: string) {
  return useQuery({
    queryKey: [...ordemServicoKeys.all, 'by-numero', numero],
    queryFn: () => OrdemServicoService.obterOrdemPorNumero(numero),
    enabled: !!numero && numero.trim().length > 0,
    staleTime: 5 * 60 * 1000,
  })
} 