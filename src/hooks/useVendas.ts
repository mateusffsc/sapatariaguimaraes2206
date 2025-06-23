import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SaleService } from '@/services/saleService';
import { Sale, SaleItem, CreditSale, CreateSaleData, UpdateSaleData } from '@/types/database';
import { toast } from 'sonner';

// ==================== QUERIES ====================
export function useVendas() {
  return useQuery({
    queryKey: ['vendas'],
    queryFn: SaleService.getAllSales,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

export function useVenda(id: string) {
  return useQuery({
    queryKey: ['venda', id],
    queryFn: () => SaleService.getSaleById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCrediario() {
  return useQuery({
    queryKey: ['crediario'],
    queryFn: SaleService.getCreditSales,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

export function useCrediarioVencido() {
  return useQuery({
    queryKey: ['crediario', 'vencido'],
    queryFn: SaleService.getOverdueCreditSales,
    staleTime: 1000 * 60 * 1, // 1 minuto
  });
}

export function useVendasStats() {
  return useQuery({
    queryKey: ['vendas', 'stats'],
    queryFn: SaleService.getSalesStats,
    staleTime: 1000 * 60 * 5,
  });
}

// ==================== MUTATIONS ====================
export function useCreateVenda() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSaleData) => SaleService.createSale(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      queryClient.invalidateQueries({ queryKey: ['vendas', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['produtos'] }); // Atualizar estoque
      toast.success('Venda criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar venda: ${error.message}`);
    },
  });
}

export function useCreateVendaCompleta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      vendaData, 
      items, 
      dueDate 
    }: { 
      vendaData: CreateSaleData; 
      items: Array<{
        product_id: number;
        quantity: number;
        unit_price: number;
      }>;
      dueDate?: string;
    }) => SaleService.createSaleWithItemsAndDueDate(vendaData, items, dueDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      queryClient.invalidateQueries({ queryKey: ['vendas', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['produtos'] }); // Atualizar estoque
      queryClient.invalidateQueries({ queryKey: ['crediario'] }); // Atualizar crediário
      toast.success('Venda criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar venda: ${error.message}`);
    },
  });
}

export function useUpdateVenda() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSaleData }) =>
      SaleService.updateSale(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      queryClient.invalidateQueries({ queryKey: ['venda', data.id] });
      queryClient.invalidateQueries({ queryKey: ['vendas', 'stats'] });
      toast.success('Venda atualizada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar venda: ${error.message}`);
    },
  });
}

export function useDeleteVenda() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => SaleService.deleteSale(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      queryClient.invalidateQueries({ queryKey: ['vendas', 'stats'] });
      toast.success('Venda deletada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao deletar venda: ${error.message}`);
    },
  });
}

// ==================== MUTATIONS ITENS DE VENDA ====================
export function useAddItemVenda() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      saleId, 
      item 
    }: { 
      saleId: string; 
      item: Omit<SaleItem, 'id' | 'sale_id'> 
    }) => SaleService.addSaleItem(saleId, item),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['venda', data.sale_id] });
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      queryClient.invalidateQueries({ queryKey: ['produtos'] }); // Atualizar estoque
      toast.success('Item adicionado à venda!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao adicionar item: ${error.message}`);
    },
  });
}

export function useUpdateItemVenda() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<SaleItem> }) =>
      SaleService.updateSaleItem(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['venda', data.sale_id] });
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast.success('Item atualizado!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar item: ${error.message}`);
    },
  });
}

export function useRemoveItemVenda() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => SaleService.removeSaleItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast.success('Item removido da venda!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover item: ${error.message}`);
    },
  });
}

// ==================== MUTATIONS CREDIÁRIO ====================
export function useCreateCrediario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<CreditSale, 'id'>) => SaleService.createCreditSale(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crediario'] });
      queryClient.invalidateQueries({ queryKey: ['vendas', 'stats'] });
      toast.success('Crediário criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar crediário: ${error.message}`);
    },
  });
}

export function usePagarCrediario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      creditSaleId, 
      paymentAmount 
    }: { 
      creditSaleId: string; 
      paymentAmount: number 
    }) => SaleService.makePayment(creditSaleId, paymentAmount),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['crediario'] });
      queryClient.invalidateQueries({ queryKey: ['crediario', 'vencido'] });
      queryClient.invalidateQueries({ queryKey: ['vendas', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['financeiro'] }); // Atualizar movimentações
      
      if (data.status === 'paid') {
        toast.success('Crediário quitado com sucesso!');
      } else {
        toast.success(`Pagamento registrado! Restante: R$ ${data.balance_due.toFixed(2)}`);
      }
    },
    onError: (error: Error) => {
      toast.error(`Erro ao registrar pagamento: ${error.message}`);
    },
  });
}

// Alias para compatibilidade
export const useMakePayment = usePagarCrediario;

// ==================== HOOKS UTILITÁRIOS ====================
export function useVendasPorPeriodo(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['vendas', 'periodo', startDate, endDate],
    queryFn: async () => {
      const vendas = await SaleService.getAllSales();
      return vendas.filter(venda => {
        const vendaDate = new Date(venda.created_at);
        return vendaDate >= new Date(startDate) && vendaDate <= new Date(endDate);
      });
    },
    enabled: !!startDate && !!endDate,
    staleTime: 1000 * 60 * 5,
  });
}

export function useVendasPorCliente(clientId: string) {
  return useQuery({
    queryKey: ['vendas', 'cliente', clientId],
    queryFn: async () => {
      const vendas = await SaleService.getAllSales();
      return vendas.filter(venda => venda.client_id === parseInt(clientId));
    },
    enabled: !!clientId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCrediarioPorCliente(clientId: string) {
  return useQuery({
    queryKey: ['crediario', 'cliente', clientId],
    queryFn: async () => {
      const crediario = await SaleService.getCreditSales();
      return crediario.filter(credit => credit.client_id === parseInt(clientId));
    },
    enabled: !!clientId,
    staleTime: 1000 * 60 * 2,
  });
}

// ==================== HOOKS DE VALIDAÇÃO ====================
export function useCanCreateVenda() {
  // Hook para validar se é possível criar uma venda
  // Pode incluir verificações de estoque, cliente, etc.
  return {
    canCreate: true, // Implementar lógica de validação
    errors: [] as string[]
  };
}

export function useValidateVendaItems(items: Omit<SaleItem, 'id' | 'sale_id'>[]) {
  // Hook para validar itens da venda
  return useQuery({
    queryKey: ['validate', 'venda-items', items],
    queryFn: async () => {
      // Implementar validação de estoque disponível
      return {
        valid: true,
        errors: [] as string[]
      };
    },
    enabled: items.length > 0,
  });
} 