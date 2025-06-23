import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PurchaseService } from '@/services/purchaseService';
import { toast } from 'sonner';

// ===============================
// QUERIES - Listagem e Busca
// ===============================

export const usePurchaseOrders = () => {
  return useQuery({
    queryKey: ['purchase-orders'],
    queryFn: PurchaseService.getAllPurchaseOrders,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

export const usePurchaseOrder = (id: string | undefined) => {
  return useQuery({
    queryKey: ['purchase-order', id],
    queryFn: () => (id ? PurchaseService.getPurchaseOrderById(id) : null),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
};

export const usePurchaseOrdersByStatus = (status: string) => {
  return useQuery({
    queryKey: ['purchase-orders', 'status', status],
    queryFn: () => PurchaseService.getPurchaseOrdersByStatus(status),
    enabled: !!status,
    staleTime: 1000 * 60 * 2,
  });
};

export const usePurchaseOrdersBySupplier = (supplierId: string) => {
  return useQuery({
    queryKey: ['purchase-orders', 'supplier', supplierId],
    queryFn: () => PurchaseService.getPurchaseOrdersBySupplier(supplierId),
    enabled: !!supplierId,
    staleTime: 1000 * 60 * 5,
  });
};

export const usePurchaseOrderStats = () => {
  return useQuery({
    queryKey: ['purchase-orders', 'stats'],
    queryFn: PurchaseService.getPurchaseOrderStats,
    staleTime: 1000 * 60 * 5,
  });
};

// ===============================
// MUTATIONS - Criar e Atualizar
// ===============================

export const useCreatePurchaseOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      supplierId,
      items,
      expectedDeliveryDate,
      notes
    }: {
      supplierId: number;
      items: Array<{
        product_id: number;
        quantity_ordered: number;
        unit_price: number;
      }>;
      expectedDeliveryDate?: string;
      notes?: string;
    }) => PurchaseService.createPurchaseOrder(supplierId, items, expectedDeliveryDate, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success('Pedido de compra criado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao criar pedido:', error);
      toast.error(error.message || 'Erro ao criar pedido de compra');
    },
  });
};

export const useUpdatePurchaseOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      PurchaseService.updatePurchaseOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success('Status do pedido atualizado!');
    },
    onError: (error: Error) => {
      console.error('Erro ao atualizar status:', error);
      toast.error(error.message || 'Erro ao atualizar status');
    },
  });
};

export const useReceiveItems = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      purchaseOrderId,
      receivedItems
    }: {
      purchaseOrderId: string;
      receivedItems: Array<{
        itemId: string;
        quantityReceived: number;
      }>;
    }) => PurchaseService.receiveItems(purchaseOrderId, receivedItems),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Mercadorias recebidas com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao receber mercadorias:', error);
      toast.error(error.message || 'Erro ao receber mercadorias');
    },
  });
};

export const useApproveQuality = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      purchaseOrderItemId,
      approvedQuantity
    }: {
      purchaseOrderItemId: string;
      approvedQuantity: number;
    }) => PurchaseService.approveQuality(purchaseOrderItemId, approvedQuantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      toast.success('Controle de qualidade realizado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro no controle de qualidade:', error);
      toast.error(error.message || 'Erro no controle de qualidade');
    },
  });
};

// ===============================
// HOOKS COMPOSTOS
// ===============================

export const usePendingPurchaseOrders = () => {
  return useQuery({
    queryKey: ['purchase-orders', 'pending'],
    queryFn: async () => {
      const [draft, sent, approved] = await Promise.all([
        PurchaseService.getPurchaseOrdersByStatus('draft'),
        PurchaseService.getPurchaseOrdersByStatus('sent'),
        PurchaseService.getPurchaseOrdersByStatus('approved')
      ]);
      return [...draft, ...sent, ...approved];
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useReceivedPurchaseOrders = () => {
  return usePurchaseOrdersByStatus('received');
};

// ===============================
// HOOKS UTILITÁRIOS
// ===============================

export const useCreatePurchaseOrderMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      supplierId: number;
      items: Array<{
        product_id: number;
        quantity_ordered: number;
        unit_price: number;
      }>;
      expectedDeliveryDate?: string;
      notes?: string;
    }) => {
      const result = await PurchaseService.createPurchaseOrder(
        data.supplierId,
        data.items,
        data.expectedDeliveryDate,
        data.notes
      );
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders', 'stats'] });
      toast.success(`Pedido de compra #${data.id} criado com sucesso!`);
    },
    onError: (error: Error) => {
      console.error('Erro ao criar pedido:', error);
      toast.error(error.message || 'Erro ao criar pedido de compra');
    },
  });
}; 