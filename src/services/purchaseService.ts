import { supabase } from '@/lib/supabase';

export class PurchaseService {
  static async createPurchaseOrder(
    supplierId: number,
    items: Array<{
      product_id: number;
      quantity_ordered: number;
      unit_price: number;
    }>,
    expectedDeliveryDate?: string,
    notes?: string
  ) {
    try {
      // Calcular total
      const totalAmount = items.reduce((sum, item) => sum + (item.quantity_ordered * item.unit_price), 0);
      
      // Criar pedido
      const { data: order, error: orderError } = await supabase
        .from('purchase_orders')
        .insert([{
          supplier_id: supplierId,
          status: 'draft',
          order_date: new Date().toISOString(),
          expected_delivery_date: expectedDeliveryDate,
          total_amount: totalAmount,
          notes,
          created_by_user_id: 1
        }])
        .select('*')
        .single();

      if (orderError) throw orderError;

      // Criar itens
      for (const itemData of items) {
        const subtotal = itemData.quantity_ordered * itemData.unit_price;
        
        await supabase
          .from('purchase_order_items')
          .insert([{
            purchase_order_id: order.id,
            product_id: itemData.product_id,
            quantity_ordered: itemData.quantity_ordered,
            unit_price: itemData.unit_price,
            subtotal: subtotal,
            quantity_received: 0,
            quantity_approved: 0
          }]);
      }

      return order;
    } catch (error) {
      console.error('Erro ao criar pedido de compra:', error);
      throw new Error(`Falha ao criar pedido: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async getAllPurchaseOrders() {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          supplier:suppliers (
            id,
            name,
            contact_info
          ),
          items:purchase_order_items (
            *,
            product:products (
              id,
              name,
              description,
              price
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      throw new Error(`Falha ao buscar pedidos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async getPurchaseOrderById(id: string) {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          supplier:suppliers (
            id,
            name,
            contact_info
          ),
          items:purchase_order_items (
            *,
            product:products (
              id,
              name,
              description,
              price,
              stock_quantity
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
      console.error('Erro ao buscar pedido:', error);
      throw new Error(`Falha ao buscar pedido: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async updatePurchaseOrderStatus(id: string, status: string) {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      throw new Error(`Falha ao atualizar status: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async receiveItems(
    purchaseOrderId: string,
    receivedItems: Array<{
      itemId: string;
      quantityReceived: number;
    }>
  ) {
    try {
      // Atualizar cada item
      for (const received of receivedItems) {
        await supabase
          .from('purchase_order_items')
          .update({
            quantity_received: received.quantityReceived,
            updated_at: new Date().toISOString()
          })
          .eq('id', received.itemId);
      }

      // Verificar se tudo foi recebido
      const { data: items, error } = await supabase
        .from('purchase_order_items')
        .select('quantity_ordered, quantity_received')
        .eq('purchase_order_id', purchaseOrderId);

      if (error) throw error;

      const allReceived = items?.every(item => 
        item.quantity_received >= item.quantity_ordered
      );

      if (allReceived) {
        await this.updatePurchaseOrderStatus(purchaseOrderId, 'received');
      }

    } catch (error) {
      console.error('Erro ao receber mercadorias:', error);
      throw new Error(`Falha ao receber mercadorias: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async approveQuality(
    purchaseOrderItemId: string,
    approvedQuantity: number
  ) {
    try {
      // Atualizar quantidade aprovada
      await supabase
        .from('purchase_order_items')
        .update({
          quantity_approved: approvedQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', purchaseOrderItemId);

      // Buscar dados do item
      const { data: item, error } = await supabase
        .from('purchase_order_items')
        .select('product_id')
        .eq('id', purchaseOrderItemId)
        .single();

      if (error) throw error;

      // Atualizar estoque
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', item.product_id)
        .single();

      if (productError) throw productError;

      const newStock = product.stock_quantity + approvedQuantity;

      await supabase
        .from('products')
        .update({ 
          stock_quantity: newStock,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.product_id);

      // Registrar movimentação
      await supabase
        .from('stock_movements')
        .insert([{
          product_id: item.product_id,
          movement_type: 'purchase',
          quantity_change: approvedQuantity,
          description: 'Recebimento aprovado - Pedido de Compra',
          timestamp: new Date().toISOString(),
          created_by_user_id: 1
        }]);

    } catch (error) {
      console.error('Erro no controle de qualidade:', error);
      throw new Error(`Falha no controle de qualidade: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async getPurchaseOrdersByStatus(status: string) {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          supplier:suppliers (
            id,
            name,
            contact_info
          ),
          items:purchase_order_items (
            *,
            product:products (
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

  static async getPurchaseOrdersBySupplier(supplierId: string) {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          supplier:suppliers (
            id,
            name,
            contact_info
          ),
          items:purchase_order_items (
            *,
            product:products (
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

  static async getPurchaseOrderStats() {
    try {
      const { data: orders, error } = await supabase
        .from('purchase_orders')
        .select('status, total_amount');

      if (error) throw error;

      const stats = {
        totalOrders: orders?.length || 0,
        pendingOrders: 0,
        receivedOrders: 0,
        totalAmount: 0,
        pendingAmount: 0
      };

      orders?.forEach(order => {
        stats.totalAmount += order.total_amount;
        
        if (['draft', 'sent', 'approved'].includes(order.status)) {
          stats.pendingOrders++;
          stats.pendingAmount += order.total_amount;
        } else if (order.status === 'received') {
          stats.receivedOrders++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      throw new Error(`Falha ao buscar estatísticas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }
} 