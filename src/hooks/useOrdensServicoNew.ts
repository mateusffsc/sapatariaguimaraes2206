import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { OrdemServicoServiceNew } from '../services/ordemServicoServiceNew'
import { type OrdemServico } from '../lib/supabase'
import { type Client, type Technician, type Service, type Product } from '../types/database'
import { toast } from 'sonner'

// Query Keys
export const ordemServicoNewKeys = {
  all: ['ordens-servico-new'] as const,
  lists: () => [...ordemServicoNewKeys.all, 'list'] as const,
  details: () => [...ordemServicoNewKeys.all, 'detail'] as const,
  detail: (id: string) => [...ordemServicoNewKeys.details(), id] as const,
  statistics: () => [...ordemServicoNewKeys.all, 'statistics'] as const,
  // Recursos auxiliares
  clients: () => ['clients'] as const,
  technicians: () => ['technicians'] as const,
  services: () => ['services'] as const,
  products: () => ['products'] as const,
}

// ==================== HOOKS DE QUERY ====================
export function useOrdensServicoNew() {
  return useQuery({
    queryKey: ordemServicoNewKeys.lists(),
    queryFn: OrdemServicoServiceNew.listarOrdensServico,
    staleTime: 2 * 60 * 1000, // 2 minutos
  })
}

export function useOrdemServicoNew(id: string) {
  return useQuery({
    queryKey: ordemServicoNewKeys.detail(id),
    queryFn: () => OrdemServicoServiceNew.obterOrdemPorId(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export function useContarOrdensPorStatusNew() {
  return useQuery({
    queryKey: [...ordemServicoNewKeys.all, 'count-by-status'],
    queryFn: OrdemServicoServiceNew.contarOrdensPorStatus,
    staleTime: 5 * 60 * 1000,
  })
}

export function useTicketMedioNew() {
  return useQuery({
    queryKey: [...ordemServicoNewKeys.all, 'ticket-medio'],
    queryFn: OrdemServicoServiceNew.calcularTicketMedio,
    staleTime: 30 * 60 * 1000, // 30 minutos
  })
}

// ==================== HOOKS DE RECURSOS AUXILIARES ====================
export function useClientesAtivos() {
  return useQuery({
    queryKey: ordemServicoNewKeys.clients(),
    queryFn: OrdemServicoServiceNew.obterClientesAtivos,
    staleTime: 10 * 60 * 1000, // 10 minutos
  })
}

export function useTecnicosAtivos() {
  return useQuery({
    queryKey: ordemServicoNewKeys.technicians(),
    queryFn: OrdemServicoServiceNew.obterTecnicosAtivos,
    staleTime: 10 * 60 * 1000,
  })
}

export function useServicosAtivos() {
  return useQuery({
    queryKey: ordemServicoNewKeys.services(),
    queryFn: OrdemServicoServiceNew.obterServicosAtivos,
    staleTime: 10 * 60 * 1000,
  })
}

export function useProdutosAtivos() {
  return useQuery({
    queryKey: ordemServicoNewKeys.products(),
    queryFn: OrdemServicoServiceNew.obterProdutosAtivos,
    staleTime: 5 * 60 * 1000, // 5 minutos - produtos mudam estoque com frequência
  })
}

// ==================== HOOKS DE MUTATION ====================
export function useCriarOrdemServicoNew() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: OrdemServicoServiceNew.criarOrdemServico,
    onSuccess: (novaOrdem) => {
      // Invalidar todas as queries de ordens
      queryClient.invalidateQueries({ queryKey: ordemServicoNewKeys.all })
      
      // Adicionar a nova ordem ao cache otimisticamente
      queryClient.setQueryData<OrdemServico[]>(ordemServicoNewKeys.lists(), (old) => {
        if (!old) return [novaOrdem]
        return [novaOrdem, ...old]
      })

      toast.success(`Ordem de serviço ${novaOrdem.numero} criada com sucesso!`)
    },
    onError: (error) => {
      console.error('Erro ao criar ordem de serviço:', error)
      toast.error(`Erro ao criar ordem de serviço: ${error.message}`)
    },
  })
}

export function useAtualizarOrdemServicoNew() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, dados }: { 
      id: string; 
      dados: Partial<Omit<OrdemServico, 'id' | 'created_at' | 'updated_at'>> 
    }) => OrdemServicoServiceNew.atualizarOrdemServico(id, dados),
    onSuccess: (ordemAtualizada) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ordemServicoNewKeys.all })
      
      // Atualizar a ordem específica no cache
      queryClient.setQueryData(ordemServicoNewKeys.detail(ordemAtualizada.id), ordemAtualizada)

      toast.success(`Ordem ${ordemAtualizada.numero} atualizada com sucesso!`)
    },
    onError: (error) => {
      console.error('Erro ao atualizar ordem de serviço:', error)
      toast.error(`Erro ao atualizar ordem de serviço: ${error.message}`)
    },
  })
}

export function useAtualizarStatusOrdemNew() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      OrdemServicoServiceNew.atualizarStatus(id, status),
    onSuccess: (ordemAtualizada) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ordemServicoNewKeys.all })
      
      // Atualizar a ordem específica no cache
      queryClient.setQueryData(ordemServicoNewKeys.detail(ordemAtualizada.id), ordemAtualizada)

      const statusMessages = {
        'orçamento': 'movida para orçamento',
        'em-andamento': 'iniciada',
        'pronto': 'marcada como pronta',
        'entregue': 'entregue ao cliente',
        'cancelada': 'cancelada'
      }

      toast.success(`Ordem ${ordemAtualizada.numero} ${statusMessages[ordemAtualizada.status]}!`)
    },
    onError: (error) => {
      console.error('Erro ao atualizar status:', error)
      toast.error(`Erro ao atualizar status: ${error.message}`)
    },
  })
}

export function useExcluirOrdemServicoNew() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: OrdemServicoServiceNew.excluirOrdemServico,
    onSuccess: (_, ordemId) => {
      // Invalidar todas as queries de ordens
      queryClient.invalidateQueries({ queryKey: ordemServicoNewKeys.all })
      
      // Remover a ordem específica do cache
      queryClient.removeQueries({ queryKey: ordemServicoNewKeys.detail(ordemId) })

      toast.success('Ordem de serviço excluída com sucesso!')
    },
    onError: (error) => {
      console.error('Erro ao excluir ordem de serviço:', error)
      toast.error(`Erro ao excluir ordem de serviço: ${error.message}`)
    },
  })
}

// ==================== HOOKS DE ITENS ====================
export function useAdicionarItemOrdem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ 
      ordemId, 
      item 
    }: { 
      ordemId: string; 
      item: {
        service_id?: string;
        product_id?: string;
        item_type: 'service' | 'product';
        quantity: number;
        unit_price: number;
      } 
    }) => OrdemServicoServiceNew.adicionarItem(ordemId, item),
    onSuccess: (_, { ordemId }) => {
      // Invalidar as queries da ordem específica
      queryClient.invalidateQueries({ queryKey: ordemServicoNewKeys.detail(ordemId) })
      queryClient.invalidateQueries({ queryKey: ordemServicoNewKeys.all })
      
      toast.success('Item adicionado à ordem com sucesso!')
    },
    onError: (error) => {
      console.error('Erro ao adicionar item:', error)
      toast.error(`Erro ao adicionar item: ${error.message}`)
    },
  })
}

export function useRemoverItemOrdem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: OrdemServicoServiceNew.removerItem,
    onSuccess: () => {
      // Invalidar todas as queries de ordens (não sabemos qual ordem foi afetada)
      queryClient.invalidateQueries({ queryKey: ordemServicoNewKeys.all })
      
      toast.success('Item removido da ordem com sucesso!')
    },
    onError: (error) => {
      console.error('Erro ao remover item:', error)
      toast.error(`Erro ao remover item: ${error.message}`)
    },
  })
}

// ==================== HOOKS DE VALIDAÇÃO ====================
export function useValidarCliente(clienteId: string) {
  return useQuery({
    queryKey: ['validate-client', clienteId],
    queryFn: async () => {
      if (!clienteId) return null
      const clientes = await OrdemServicoServiceNew.obterClientesAtivos()
      return clientes.find(c => c.id.toString() === clienteId) || null
    },
    enabled: !!clienteId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useValidarTecnico(tecnicoId: string) {
  return useQuery({
    queryKey: ['validate-technician', tecnicoId],
    queryFn: async () => {
      if (!tecnicoId) return null
      const tecnicos = await OrdemServicoServiceNew.obterTecnicosAtivos()
      return tecnicos.find(t => t.id.toString() === tecnicoId) || null
    },
    enabled: !!tecnicoId,
    staleTime: 5 * 60 * 1000,
  })
}

// ==================== HOOKS UTILITÁRIOS ====================
export function useStatusOSOptions() {
  return [
    { value: 'orçamento', label: 'Orçamento', color: 'blue' },
    { value: 'em-andamento', label: 'Em Andamento', color: 'yellow' },
    { value: 'pronto', label: 'Pronto', color: 'green' },
    { value: 'entregue', label: 'Entregue', color: 'purple' },
    { value: 'cancelada', label: 'Cancelada', color: 'red' },
  ]
}

export function useCalcularTotal(items: { quantity: number; unit_price: number }[]) {
  return items.reduce((total, item) => total + (item.quantity * item.unit_price), 0)
} 