import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClienteServiceNew } from '@/services/clienteServiceNew';
import { type Cliente } from '@/lib/supabase';
import { toast } from 'sonner';

// Query Keys adaptadas
export const clienteKeysNew = {
  all: ['clientes-new'] as const,
  lists: () => [...clienteKeysNew.all, 'list'] as const,
  list: (filters: string) => [...clienteKeysNew.lists(), { filters }] as const,
  details: () => [...clienteKeysNew.all, 'detail'] as const,
  detail: (id: string) => [...clienteKeysNew.details(), id] as const,
  search: (termo: string) => [...clienteKeysNew.all, 'search', termo] as const,
  validation: (type: string, value: string) => [...clienteKeysNew.all, 'validation', type, value] as const,
}

// ==================== HOOKS DE QUERY ====================
export function useClientesNew() {
  return useQuery({
    queryKey: clienteKeysNew.lists(),
    queryFn: ClienteServiceNew.listarClientes,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useClientesAtivosNew() {
  return useQuery({
    queryKey: clienteKeysNew.list('ativos'),
    queryFn: ClienteServiceNew.listarClientesAtivos,
    staleTime: 5 * 60 * 1000,
  });
}

export function useClienteNew(id: string) {
  return useQuery({
    queryKey: clienteKeysNew.detail(id),
    queryFn: () => ClienteServiceNew.obterClientePorId(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

export function useBuscarClientesNew(termo: string) {
  return useQuery({
    queryKey: clienteKeysNew.search(termo),
    queryFn: () => ClienteServiceNew.buscarClientes(termo),
    enabled: termo.trim().length >= 2,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

export function useContarClientesAtivosNew() {
  return useQuery({
    queryKey: [...clienteKeysNew.all, 'count', 'ativos'],
    queryFn: ClienteServiceNew.contarClientesAtivos,
    staleTime: 10 * 60 * 1000,
  });
}

// ==================== HOOKS DE VALIDAÇÃO ====================
export function useVerificarTelefoneUnico(telefone: string, excludeId?: string) {
  return useQuery({
    queryKey: clienteKeysNew.validation('telefone', telefone),
    queryFn: () => ClienteServiceNew.verificarTelefoneUnico(telefone, excludeId),
    enabled: telefone.length >= 10,
    staleTime: 30 * 1000, // 30 segundos
    retry: false,
  });
}

export function useVerificarEmailUnico(email: string, excludeId?: string) {
  return useQuery({
    queryKey: clienteKeysNew.validation('email', email),
    queryFn: () => ClienteServiceNew.verificarEmailUnico(email, excludeId),
    enabled: !!email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    staleTime: 30 * 1000, // 30 segundos
    retry: false,
  });
}

// ==================== HOOKS DE MUTATION ====================
export function useCriarClienteNew() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ClienteServiceNew.criarCliente,
    onSuccess: (novoCliente) => {
      // Invalidar todas as queries de clientes
      queryClient.invalidateQueries({ queryKey: clienteKeysNew.all });
      
      // Também invalidar as queries antigas para manter sincronização
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      
      // Adicionar o novo cliente ao cache otimisticamente
      queryClient.setQueryData<Cliente[]>(clienteKeysNew.lists(), (old) => {
        if (!old) return [novoCliente];
        return [novoCliente, ...old];
      });

      toast.success('Cliente criado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar cliente:', error);
      toast.error(`Erro ao criar cliente: ${error.message}`);
    },
  });
}

export function useAtualizarClienteNew() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: Partial<Omit<Cliente, 'id' | 'created_at' | 'updated_at'>> }) =>
      ClienteServiceNew.atualizarCliente(id, dados),
    onSuccess: (clienteAtualizado) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: clienteKeysNew.all });
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      
      // Atualizar o cliente específico no cache
      queryClient.setQueryData(clienteKeysNew.detail(clienteAtualizado.id), clienteAtualizado);

      toast.success('Cliente atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar cliente:', error);
      toast.error(`Erro ao atualizar cliente: ${error.message}`);
    },
  });
}

export function useExcluirClienteNew() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ClienteServiceNew.excluirCliente,
    onSuccess: (_, clienteId) => {
      // Invalidar todas as queries de clientes
      queryClient.invalidateQueries({ queryKey: clienteKeysNew.all });
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      
      // Remover o cliente específico do cache
      queryClient.removeQueries({ queryKey: clienteKeysNew.detail(clienteId) });

      toast.success('Cliente excluído com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao excluir cliente:', error);
      toast.error(`Erro ao excluir cliente: ${error.message}`);
    },
  });
}

// ==================== HOOKS DE MIGRAÇÃO ====================
export function useMigrarDadosClientes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ClienteServiceNew.migrarDadosAntigos,
    onSuccess: () => {
      // Invalidar todas as queries para forçar reload
      queryClient.invalidateQueries({ queryKey: clienteKeysNew.all });
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      
      toast.success('Dados migrados com sucesso!');
    },
    onError: (error) => {
      console.error('Erro na migração:', error);
      toast.error(`Erro na migração: ${error.message}`);
    },
  });
}

// ==================== HOOKS UTILITÁRIOS ====================
export function useClientesPorTelefone(telefone: string) {
  return useQuery({
    queryKey: [...clienteKeysNew.all, 'busca-telefone', telefone],
    queryFn: () => ClienteServiceNew.obterClientePorTelefone(telefone),
    enabled: telefone.length >= 10,
    staleTime: 5 * 60 * 1000,
  });
}

export function useClientesPorEmail(email: string) {
  return useQuery({
    queryKey: [...clienteKeysNew.all, 'busca-email', email],
    queryFn: () => ClienteServiceNew.obterClientePorEmail(email),
    enabled: !!email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    staleTime: 5 * 60 * 1000,
  });
}

// ==================== HOOKS DE COMPATIBILIDADE ====================
// Estes hooks mantêm a mesma interface dos hooks antigos para facilitar migração

export function useCriarCliente() {
  return useCriarClienteNew();
}

export function useClientes() {
  return useClientesNew();
}

export function useClientesAtivos() {
  return useClientesAtivosNew();
}

export function useCliente(id: string) {
  return useClienteNew(id);
}

export function useBuscarClientes(termo: string) {
  return useBuscarClientesNew(termo);
}

export function useContarClientesAtivos() {
  return useContarClientesAtivosNew();
}

export function useAtualizarCliente() {
  return useAtualizarClienteNew();
}

export function useExcluirCliente() {
  return useExcluirClienteNew();
}

// Hook de verificação de CPF mantido para compatibilidade, mas retorna vazio
export function useVerificarCPF(cpf: string) {
  return useQuery({
    queryKey: [...clienteKeysNew.all, 'verificar-cpf', cpf],
    queryFn: () => ClienteServiceNew.obterClientePorCPF(cpf),
    enabled: false, // Desabilitado pois CPF não existe na nova estrutura
    staleTime: 5 * 60 * 1000,
  });
} 