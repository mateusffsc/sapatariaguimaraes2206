import { supabase } from '@/lib/supabase';
import { 
  PurchaseOrder, 
  PurchaseOrderWithRelations, 
  PurchaseOrderItem,
  PurchaseOrderItemWithRelations,
  QualityControl,
  QualityControlWithRelations,
  CreatePurchaseOrder, 
  UpdatePurchaseOrder,
  CreatePurchaseOrderItem,
  UpdatePurchaseOrderItem,
  CreateQualityControl,
  UpdateQualityControl,
  PurchaseOrderStatus,
  QualityControlStatus
} from '@/types/database';
import { ProductService } from './productService';

export class PurchaseOrderService {
  // ==================== CRUD PEDIDOS DE COMPRA ====================
  
  static async createPurchaseOrder(orderData: CreatePurchaseOrder): Promise<PurchaseOrder> {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .insert([orderData])
        .select('*')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao criar pedido de compra:', error);
      throw new Error(`Falha ao criar pedido: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async getAllPurchaseOrders(): Promise<PurchaseOrderWithRelations[]> {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          supplier:suppliers!purchase_orders_supplier_id_fkey (
            id,
            name,
            contact_info,
            active
          ),
          items:purchase_order_items (
            *,
            product:products!purchase_order_items_product_id_fkey (
              id,
              name,
              description,
              price,
              stock_quantity
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar pedidos de compra:', error);
      throw new Error(`Falha ao buscar pedidos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async getPurchaseOrderById(id: string): Promise<PurchaseOrderWithRelations | null> {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          supplier:suppliers!purchase_orders_supplier_id_fkey (
            id,
            name,
            contact_info,
            active
          ),
          items:purchase_order_items (
            *,
            product:products!purchase_order_items_product_id_fkey (
              id,
              name,
              description,
              price,
              stock_quantity
            ),
            quality_controls (
              *
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar pedido de compra:', error);
      throw new Error(`Falha ao buscar pedido: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async updatePurchaseOrder(id: string, updates: UpdatePurchaseOrder): Promise<PurchaseOrder> {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar pedido de compra:', error);
      throw new Error(`Falha ao atualizar pedido: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async deletePurchaseOrder(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('purchase_orders')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao excluir pedido de compra:', error);
      throw new Error(`Falha ao excluir pedido: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // ==================== ITENS DO PEDIDO ====================

  static async addItemToPurchaseOrder(itemData: CreatePurchaseOrderItem): Promise<PurchaseOrderItem> {
    try {
      const { data, error } = await supabase
        .from('purchase_order_items')
        .insert([itemData])
        .select('*')
        .single();

      if (error) throw error;

      // Atualizar total do pedido
      await this.updatePurchaseOrderTotal(itemData.purchase_order_id.toString());
      
      return data;
    } catch (error) {
      console.error('Erro ao adicionar item ao pedido:', error);
      throw new Error(`Falha ao adicionar item: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async updatePurchaseOrderItem(id: string, updates: UpdatePurchaseOrderItem): Promise<PurchaseOrderItem> {
    try {
      const { data, error } = await supabase
        .from('purchase_order_items')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;

      // Atualizar total do pedido
      await this.updatePurchaseOrderTotal(data.purchase_order_id.toString());
      
      return data;
    } catch (error) {
      console.error('Erro ao atualizar item do pedido:', error);
      throw new Error(`Falha ao atualizar item: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async removePurchaseOrderItem(id: string): Promise<void> {
    try {
      // Primeiro buscar o item para pegar o purchase_order_id
      const { data: item, error: fetchError } = await supabase
        .from('purchase_order_items')
        .select('purchase_order_id')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('purchase_order_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Atualizar total do pedido
      if (item) {
        await this.updatePurchaseOrderTotal(item.purchase_order_id.toString());
      }
    } catch (error) {
      console.error('Erro ao remover item do pedido:', error);
      throw new Error(`Falha ao remover item: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // ==================== PEDIDO COMPLETO ====================

  static async createCompletePurchaseOrder(
    orderData: CreatePurchaseOrder,
    items: CreatePurchaseOrderItem[]
  ): Promise<PurchaseOrderWithRelations> {
    try {
      // 1. Criar o pedido
      const purchaseOrder = await this.createPurchaseOrder(orderData);

      // 2. Adicionar os itens
      const orderItems = [];
      for (const itemData of items) {
        const item = await this.addItemToPurchaseOrder({
          ...itemData,
          purchase_order_id: purchaseOrder.id
        });
        orderItems.push(item);
      }

      // 3. Buscar o pedido completo
      const completePurchaseOrder = await this.getPurchaseOrderById(purchaseOrder.id.toString());
      
      if (!completePurchaseOrder) {
        throw new Error('Erro ao buscar pedido criado');
      }

      return completePurchaseOrder;
    } catch (error) {
      console.error('Erro ao criar pedido completo:', error);
      throw new Error(`Falha ao criar pedido completo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // ==================== RECEBIMENTO DE MERCADORIAS ====================

  static async receiveItems(
    purchaseOrderId: string,
    receivedItems: Array<{
      itemId: string;
      quantityReceived: number;
      notes?: string;
    }>
  ): Promise<void> {
    try {
      // Atualizar cada item com a quantidade recebida
      for (const received of receivedItems) {
        await supabase
          .from('purchase_order_items')
          .update({
            quantity_received: received.quantityReceived,
            updated_at: new Date().toISOString()
          })
          .eq('id', received.itemId);
      }

      // Verificar se todos os itens foram recebidos
      const { data: items, error } = await supabase
        .from('purchase_order_items')
        .select('quantity_ordered, quantity_received')
        .eq('purchase_order_id', purchaseOrderId);

      if (error) throw error;

      const allReceived = items?.every(item => 
        item.quantity_received >= item.quantity_ordered
      );

      // Atualizar status do pedido se tudo foi recebido
      if (allReceived) {
        await this.updatePurchaseOrder(purchaseOrderId, {
          status: 'received'
        });
      }

    } catch (error) {
      console.error('Erro ao receber mercadorias:', error);
      throw new Error(`Falha ao receber mercadorias: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // ==================== CONTROLE DE QUALIDADE ====================

  static async createQualityControl(controlData: CreateQualityControl): Promise<QualityControl> {
    try {
      const { data, error } = await supabase
        .from('quality_controls')
        .insert([controlData])
        .select('*')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao criar controle de qualidade:', error);
      throw new Error(`Falha ao criar controle: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async performQualityControl(
    purchaseOrderItemId: string,
    inspectorUserId: number,
    approvedQuantity: number,
    rejectedQuantity: number,
    notes?: string,
    defectsFound?: string
  ): Promise<void> {
    try {
      // 1. Criar registro de controle de qualidade
      const status: QualityControlStatus = rejectedQuantity > 0 ? 
        (approvedQuantity > 0 ? 'partial' : 'rejected') : 'approved';

      await this.createQualityControl({
        purchase_order_item_id: parseInt(purchaseOrderItemId),
        inspector_user_id: inspectorUserId,
        inspection_date: new Date().toISOString(),
        status,
        notes,
        defects_found: defectsFound,
        approved_quantity: approvedQuantity,
        rejected_quantity: rejectedQuantity
      });

      // 2. Atualizar item do pedido com quantidade aprovada
      await supabase
        .from('purchase_order_items')
        .update({
          quantity_approved: approvedQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', purchaseOrderItemId);

      // 3. Se aprovado, adicionar ao estoque
      if (approvedQuantity > 0) {
        const { data: item, error } = await supabase
          .from('purchase_order_items')
          .select('product_id')
          .eq('id', purchaseOrderItemId)
          .single();

        if (error) throw error;

        await ProductService.entradaMercadoria(
          item.product_id.toString(),
          approvedQuantity,
          `Recebimento aprovado - Pedido de Compra`
        );
      }

    } catch (error) {
      console.error('Erro ao realizar controle de qualidade:', error);
      throw new Error(`Falha no controle de qualidade: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // ==================== MÉTODOS AUXILIARES ====================

  private static async updatePurchaseOrderTotal(purchaseOrderId: string): Promise<void> {
    try {
      const { data: items, error } = await supabase
        .from('purchase_order_items')
        .select('subtotal')
        .eq('purchase_order_id', purchaseOrderId);

      if (error) throw error;

      const total = items?.reduce((sum, item) => sum + item.subtotal, 0) || 0;

      await supabase
        .from('purchase_orders')
        .update({ 
          total_amount: total,
          updated_at: new Date().toISOString()
        })
        .eq('id', purchaseOrderId);

    } catch (error) {
      console.error('Erro ao atualizar total do pedido:', error);
    }
  }

  // ==================== FILTROS E BUSCAS ====================

  static async getPurchaseOrdersByStatus(status: PurchaseOrderStatus): Promise<PurchaseOrderWithRelations[]> {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          supplier:suppliers!purchase_orders_supplier_id_fkey (
            id,
            name,
            contact_info
          ),
          items:purchase_order_items (
            *,
            product:products!purchase_order_items_product_id_fkey (
              id,
              name,
              description
            )
          )
        `)
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar pedidos por status:', error);
      throw new Error(`Falha ao buscar pedidos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async getPurchaseOrdersBySupplier(supplierId: string): Promise<PurchaseOrderWithRelations[]> {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          supplier:suppliers!purchase_orders_supplier_id_fkey (
            id,
            name,
            contact_info
          ),
          items:purchase_order_items (
            *,
            product:products!purchase_order_items_product_id_fkey (
              id,
              name,
              description
            )
          )
        `)
        .eq('supplier_id', supplierId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar pedidos por fornecedor:', error);
      throw new Error(`Falha ao buscar pedidos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async getOverduePurchaseOrders(): Promise<PurchaseOrderWithRelations[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          supplier:suppliers!purchase_orders_supplier_id_fkey (
            id,
            name,
            contact_info
          ),
          items:purchase_order_items (
            *,
            product:products!purchase_order_items_product_id_fkey (
              id,
              name,
              description
            )
          )
        `)
        .in('status', ['sent', 'approved'])
        .lt('expected_delivery_date', today)
        .order('expected_delivery_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar pedidos em atraso:', error);
      throw new Error(`Falha ao buscar pedidos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // ==================== ESTATÍSTICAS ====================

  static async getPurchaseOrderStats(): Promise<{
    totalOrders: number;
    pendingOrders: number;
    receivedOrders: number;
    overdueOrders: number;
    totalAmount: number;
    pendingAmount: number;
  }> {
    try {
      const { data: orders, error } = await supabase
        .from('purchase_orders')
        .select('status, total_amount, expected_delivery_date');

      if (error) throw error;

      const today = new Date().toISOString().split('T')[0];
      const stats = {
        totalOrders: orders?.length || 0,
        pendingOrders: 0,
        receivedOrders: 0,
        overdueOrders: 0,
        totalAmount: 0,
        pendingAmount: 0
      };

      orders?.forEach(order => {
        stats.totalAmount += order.total_amount;
        
        switch (order.status) {
          case 'draft':
          case 'sent':
          case 'approved':
            stats.pendingOrders++;
            stats.pendingAmount += order.total_amount;
            
            // Verificar se está em atraso
            if (order.expected_delivery_date && order.expected_delivery_date < today) {
              stats.overdueOrders++;
            }
            break;
          case 'received':
            stats.receivedOrders++;
            break;
        }
      });

      return stats;
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      throw new Error(`Falha ao buscar estatísticas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }
} 