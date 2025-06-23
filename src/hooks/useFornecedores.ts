import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SupplierService } from '@/services/supplierService';
import { Supplier, CreateSupplier, UpdateSupplier } from '@/types/database';
import { toast } from 'sonner';

// ===============================
// QUERIES - Listagem e Busca
// ===============================

export const useFornecedores = () => {
  return useQuery({
    queryKey: ['fornecedores'],
    queryFn: SupplierService.getAllSuppliers,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

export const useFornecedoresAtivos = () => {
  return useQuery({
    queryKey: ['fornecedores', 'ativos'],
    queryFn: SupplierService.getActiveSuppliers,
    staleTime: 1000 * 60 * 5,
  });
};

export const useFornecedor = (id: string | undefined) => {
  return useQuery({
    queryKey: ['fornecedor', id],
    queryFn: () => (id ? SupplierService.getSupplierById(id) : null),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
};

export const useBuscarFornecedores = (searchTerm: string) => {
  return useQuery({
    queryKey: ['fornecedores', 'busca', searchTerm],
    queryFn: () => SupplierService.searchSuppliers(searchTerm),
    enabled: searchTerm.length > 2,
    staleTime: 1000 * 60 * 2,
  });
};

// ===============================
// ESTATÍSTICAS E RELATÓRIOS
// ===============================

export const useEstatisticasFornecedores = () => {
  return useQuery({
    queryKey: ['fornecedores', 'estatisticas'],
    queryFn: SupplierService.getSupplierStats,
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
};

export const useRelatorioPerformanceFornecedores = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: ['fornecedores', 'performance', startDate, endDate],
    queryFn: () => SupplierService.getSupplierPerformanceReport(startDate, endDate),
    enabled: !!startDate && !!endDate,
    staleTime: 1000 * 60 * 15, // 15 minutos
  });
};

// ===============================
// MUTATIONS - Operações CRUD
// ===============================

export const useCriarFornecedor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSupplier) => SupplierService.createSupplier(data),
    onSuccess: (novoFornecedor) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      queryClient.invalidateQueries({ queryKey: ['fornecedores', 'estatisticas'] });
      
      toast.success(`Fornecedor "${novoFornecedor.name}" criado com sucesso!`);
    },
    onError: (error: Error) => {
      console.error('Erro ao criar fornecedor:', error);
      toast.error(`Erro ao criar fornecedor: ${error.message}`);
    },
  });
};

export const useAtualizarFornecedor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSupplier }) =>
      SupplierService.updateSupplier(id, data),
    onSuccess: (fornecedorAtualizado) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      queryClient.invalidateQueries({ queryKey: ['fornecedor', fornecedorAtualizado.id] });
      queryClient.invalidateQueries({ queryKey: ['fornecedores', 'estatisticas'] });
      
      toast.success(`Fornecedor "${fornecedorAtualizado.name}" atualizado com sucesso!`);
    },
    onError: (error: Error) => {
      console.error('Erro ao atualizar fornecedor:', error);
      toast.error(`Erro ao atualizar fornecedor: ${error.message}`);
    },
  });
};

export const useExcluirFornecedor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => SupplierService.deleteSupplier(id),
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      queryClient.invalidateQueries({ queryKey: ['fornecedores', 'estatisticas'] });
      
      toast.success('Fornecedor excluído com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao excluir fornecedor:', error);
      toast.error(`Erro ao excluir fornecedor: ${error.message}`);
    },
  });
};

export const useAlternarStatusFornecedor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => SupplierService.toggleSupplierStatus(id),
    onSuccess: (fornecedor) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      queryClient.invalidateQueries({ queryKey: ['fornecedor', fornecedor.id] });
      queryClient.invalidateQueries({ queryKey: ['fornecedores', 'estatisticas'] });
      
      const status = (fornecedor.active ?? true) ? 'ativado' : 'desativado';
      toast.success(`Fornecedor "${fornecedor.name}" ${status} com sucesso!`);
    },
    onError: (error: Error) => {
      console.error('Erro ao alterar status do fornecedor:', error);
      toast.error(`Erro ao alterar status: ${error.message}`);
    },
  });
};

// ===============================
// HOOKS DERIVADOS - Utilitários
// ===============================

export const useFornecedoresOptions = () => {
  const { data: fornecedores } = useFornecedoresAtivos();
  
  return fornecedores?.map(fornecedor => ({
    value: fornecedor.id.toString(),
    label: fornecedor.name,
    contactInfo: fornecedor.contact_info
  })) || [];
};

export const useFornecedoresComPendencias = () => {
  return useQuery({
    queryKey: ['fornecedores', 'pendencias'],
    queryFn: async () => {
      const contas = await SupplierService.getPendingAccountsPayable();
      const fornecedoresComPendencias = new Map();
      
      contas.forEach(conta => {
        if (conta.suppliers) {
          const fornecedorId = conta.suppliers.id;
          if (!fornecedoresComPendencias.has(fornecedorId)) {
            fornecedoresComPendencias.set(fornecedorId, {
              fornecedor: conta.suppliers,
              totalPendente: 0,
              quantidadeContas: 0
            });
          }
          
          const item = fornecedoresComPendencias.get(fornecedorId);
          item.totalPendente += conta.balance_due;
          item.quantidadeContas += 1;
        }
      });
      
      return Array.from(fornecedoresComPendencias.values());
    },
    staleTime: 1000 * 60 * 5,
  });
}; 