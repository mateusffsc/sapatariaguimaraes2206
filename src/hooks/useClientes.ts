import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ClienteService } from '../services/clienteService'
import { type Cliente } from '../lib/supabase'
import { toast } from 'sonner'

// Query Keys
export const clienteKeys = {
  all: ['clientes'] as const,
  lists: () => [...clienteKeys.all, 'list'] as const,
  list: (filters: string) => [...clienteKeys.lists(), { filters }] as const,
  details: () => [...clienteKeys.all, 'detail'] as const,
  detail: (id: string) => [...clienteKeys.details(), id] as const,
  search: (termo: string) => [...clienteKeys.all, 'search', termo] as const,
}

// Hooks de Query
export function useClientes() {
  return useQuery({
    queryKey: clienteKeys.lists(),
    queryFn: ClienteService.listarClientes,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

export function useClientesAtivos() {
  return useQuery({
    queryKey: clienteKeys.list('ativos'),
    queryFn: ClienteService.listarClientesAtivos,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCliente(id: string) {
  return useQuery({
    queryKey: clienteKeys.detail(id),
    queryFn: () => ClienteService.obterClientePorId(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutos
  })
}

export function useBuscarClientes(termo: string) {
  return useQuery({
    queryKey: clienteKeys.search(termo),
    queryFn: () => ClienteService.buscarClientes(termo),
    enabled: termo.trim().length >= 2,
    staleTime: 2 * 60 * 1000, // 2 minutos
  })
}

export function useContarClientesAtivos() {
  return useQuery({
    queryKey: [...clienteKeys.all, 'count', 'ativos'],
    queryFn: ClienteService.contarClientesAtivos,
    staleTime: 10 * 60 * 1000,
  })
}

// Hooks de Mutation
export function useCriarCliente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ClienteService.criarCliente,
    onSuccess: (novoCliente) => {
      // Invalidar todas as queries de clientes
      queryClient.invalidateQueries({ queryKey: clienteKeys.all })
      
      // Adicionar o novo cliente ao cache otimisticamente
      queryClient.setQueryData<Cliente[]>(clienteKeys.lists(), (old) => {
        if (!old) return [novoCliente]
        return [novoCliente, ...old]
      })

      toast.success('Cliente criado com sucesso!')
    },
    onError: (error) => {
      toast.error(`Erro ao criar cliente: ${error.message}`)
    },
  })
}

export function useAtualizarCliente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: Partial<Omit<Cliente, 'id' | 'created_at' | 'updated_at'>> }) =>
      ClienteService.atualizarCliente(id, dados),
    onSuccess: (clienteAtualizado) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: clienteKeys.all })
      
      // Atualizar o cliente específico no cache
      queryClient.setQueryData(clienteKeys.detail(clienteAtualizado.id), clienteAtualizado)

      toast.success('Cliente atualizado com sucesso!')
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar cliente: ${error.message}`)
    },
  })
}

export function useExcluirCliente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ClienteService.excluirCliente,
    onSuccess: (_, clienteId) => {
      // Invalidar todas as queries de clientes
      queryClient.invalidateQueries({ queryKey: clienteKeys.all })
      
      // Remover o cliente específico do cache
      queryClient.removeQueries({ queryKey: clienteKeys.detail(clienteId) })

      toast.success('Cliente excluído com sucesso!')
    },
    onError: (error) => {
      toast.error(`Erro ao excluir cliente: ${error.message}`)
    },
  })
}

// Hook utilitário para verificar se um CPF já existe
export function useVerificarCPF(cpf: string) {
  return useQuery({
    queryKey: [...clienteKeys.all, 'verificar-cpf', cpf],
    queryFn: () => ClienteService.obterClientePorCPF(cpf),
    enabled: cpf.length === 14, // CPF formatado: 000.000.000-00
    staleTime: 5 * 60 * 1000,
  })
} 