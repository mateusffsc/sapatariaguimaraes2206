import { supabase } from '@/lib/supabase';
import { 
  ServiceOrder, 
  ServiceOrderItem, 
  CreateServiceOrder, 
  UpdateServiceOrder, 
  CreateServiceOrderItem,
  ServiceOrderStatus,
  Client,
  Technician,
  Service,
  Product
} from '@/types/database';
import { OrdemServico } from '@/lib/supabase'; // Tipo português existente

export class OrdemServicoServiceNew {
  // ==================== ADAPTAÇÃO PT → EN ====================
  private static adaptarOrdemServicoParaServiceOrder(os: Omit<OrdemServico, 'id' | 'created_at' | 'updated_at'>): CreateServiceOrder {
    return {
      client_id: parseInt(os.cliente_id),
      technician_id: os.tecnico_id ? parseInt(os.tecnico_id) : undefined,
      status: this.mapStatusToEN(os.status),
      description: os.descricao || undefined,
      total_price: os.preco_total || 0,
      payment_status: this.mapPaymentStatusToEN(os.status_pagamento || 'pending'),
      created_by_user_id: 1 // TODO: Usar ID do usuário logado
    };
  }

  private static adaptarServiceOrderParaOrdemServico(so: ServiceOrder): OrdemServico {
    return {
      id: so.id.toString(),
      numero: `OS-${so.id.toString().padStart(6, '0')}`,
      cliente_id: so.client_id.toString(),
      tecnico_id: so.technician_id?.toString() || '',
      descricao: so.description || '',
      preco_total: so.total_price,
      status: this.mapStatusToPT(so.status),
      status_pagamento: this.mapPaymentStatusToPT(so.payment_status),
      data_abertura: so.created_at,
      data_prazo: '', // Campo não existe na nova estrutura
      data_conclusao: so.updated_at,
      observacoes: '',
      cliente: undefined, // Será preenchido separadamente se necessário
      created_at: so.created_at,
      updated_at: so.updated_at
    };
  }

  private static mapStatusToEN(status: string): ServiceOrderStatus {
    const statusMap: Record<string, ServiceOrderStatus> = {
      'orçamento': 'pending',
      'pendente': 'pending',
      'em-andamento': 'in_progress',
      'pronto': 'completed',
      'concluido': 'completed',
      'entregue': 'delivered',
      'cancelada': 'cancelled',
      'cancelado': 'cancelled'
    };
    return statusMap[status] || 'pending';
  }

  private static mapStatusToPT(status: ServiceOrderStatus): string {
    const statusMap: Record<ServiceOrderStatus, string> = {
      'pending': 'orçamento',
      'in_progress': 'em-andamento',
      'completed': 'pronto',
      'delivered': 'entregue',
      'cancelled': 'cancelada'
    };
    return statusMap[status] || 'orçamento';
  }

  private static mapPaymentStatusToEN(status: string): 'pending' | 'paid' | 'partially_paid' | 'cancelled' {
    const statusMap: Record<string, 'pending' | 'paid' | 'partially_paid' | 'cancelled'> = {
      'pendente': 'pending',
      'pago': 'paid',
      'parcial': 'partially_paid',
      'cancelado': 'cancelled'
    };
    return statusMap[status] || 'pending';
  }

  private static mapPaymentStatusToPT(status: 'pending' | 'paid' | 'partially_paid' | 'cancelled'): string {
    const statusMap: Record<'pending' | 'paid' | 'partially_paid' | 'cancelled', string> = {
      'pending': 'pendente',
      'paid': 'pago',
      'partially_paid': 'parcial',
      'cancelled': 'cancelado'
    };
    return statusMap[status] || 'pendente';
  }

  // ==================== CRUD BÁSICO ====================
  static async criarOrdemServico(osData: Omit<OrdemServico, 'id' | 'created_at' | 'updated_at'>): Promise<OrdemServico> {
    try {
      const serviceOrderData = this.adaptarOrdemServicoParaServiceOrder(osData);
      
      const { data, error } = await supabase
        .from('service_orders')
        .insert([serviceOrderData])
        .select(`
          *,
          clients (id, name, phone, email),
          technicians (id, name, contact_info)
        `)
        .single();

      if (error) throw error;
      
      return this.adaptarServiceOrderParaOrdemServico(data);
    } catch (error) {
      console.error('Erro ao criar ordem de serviço:', error);
      throw new Error(`Falha ao criar ordem de serviço: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async listarOrdensServico(): Promise<OrdemServico[]> {
    try {
      const { data, error } = await supabase
        .from('service_orders')
        .select(`
          *,
          clients (id, name, phone, email),
          technicians (id, name, contact_info)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(so => this.adaptarServiceOrderParaOrdemServico(so));
    } catch (error) {
      console.error('Erro ao listar ordens de serviço:', error);
      throw new Error(`Falha ao listar ordens: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async obterOrdemPorId(id: string): Promise<OrdemServico | null> {
    try {
      const { data, error } = await supabase
        .from('service_orders')
        .select(`
          *,
          clients (id, name, phone, email, address),
          technicians (id, name, contact_info),
          service_order_items (
            id,
            service_id,
            product_id,
            item_type,
            quantity,
            unit_price,
            subtotal,
            services (id, name, description, price),
            products (id, name, description, price)
          )
        `)
        .eq('id', parseInt(id))
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return this.adaptarServiceOrderParaOrdemServico(data);
    } catch (error) {
      console.error('Erro ao obter ordem de serviço:', error);
      throw new Error(`Falha ao obter ordem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async atualizarOrdemServico(id: string, updates: Partial<Omit<OrdemServico, 'id' | 'created_at' | 'updated_at'>>): Promise<OrdemServico> {
    try {
      const updateData: Partial<ServiceOrder> = {};
      
      if (updates.cliente_id) updateData.client_id = parseInt(updates.cliente_id);
      if (updates.tecnico_id) updateData.technician_id = parseInt(updates.tecnico_id);
      if (updates.status) updateData.status = this.mapStatusToEN(updates.status);
      if (updates.descricao !== undefined) updateData.description = updates.descricao || undefined;
      if (updates.preco_total !== undefined) updateData.total_price = updates.preco_total;
      if (updates.status_pagamento) updateData.payment_status = this.mapPaymentStatusToEN(updates.status_pagamento);

      const { data, error } = await supabase
        .from('service_orders')
        .update(updateData)
        .eq('id', parseInt(id))
        .select(`
          *,
          clients (id, name, phone, email),
          technicians (id, name, contact_info)
        `)
        .single();

      if (error) throw error;
      
      return this.adaptarServiceOrderParaOrdemServico(data);
    } catch (error) {
      console.error('Erro ao atualizar ordem de serviço:', error);
      throw new Error(`Falha ao atualizar ordem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async atualizarStatus(id: string, status: string): Promise<OrdemServico> {
    try {
      const { data, error } = await supabase
        .from('service_orders')
        .update({ 
          status: this.mapStatusToEN(status),
          updated_at: new Date().toISOString()
        })
        .eq('id', parseInt(id))
        .select(`
          *,
          clients (id, name, phone, email),
          technicians (id, name, contact_info)
        `)
        .single();

      if (error) throw error;
      
      return this.adaptarServiceOrderParaOrdemServico(data);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      throw new Error(`Falha ao atualizar status: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async excluirOrdemServico(id: string): Promise<void> {
    try {
      // Primeiro, deletar itens da ordem
      await supabase
        .from('service_order_items')
        .delete()
        .eq('service_order_id', parseInt(id));

      // Deletar a ordem
      const { error } = await supabase
        .from('service_orders')
        .delete()
        .eq('id', parseInt(id));

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao excluir ordem de serviço:', error);
      throw new Error(`Falha ao excluir ordem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // ==================== ITENS DA ORDEM ====================
  static async adicionarItem(
    ordemId: string, 
    item: {
      service_id?: string;
      product_id?: string;
      item_type: 'service' | 'product';
      quantity: number;
      unit_price: number;
    }
  ): Promise<ServiceOrderItem> {
    try {
      const itemData: CreateServiceOrderItem = {
        service_order_id: parseInt(ordemId),
        service_id: item.service_id ? parseInt(item.service_id) : undefined,
        product_id: item.product_id ? parseInt(item.product_id) : undefined,
        item_type: item.item_type,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.quantity * item.unit_price
      };

      const { data, error } = await supabase
        .from('service_order_items')
        .insert([itemData])
        .select(`
          *,
          services (id, name, description, price),
          products (id, name, description, price)
        `)
        .single();

      if (error) throw error;

      // Atualizar total da ordem
      await this.atualizarTotalOrdem(ordemId);

      return data;
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
      throw new Error(`Falha ao adicionar item: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async removerItem(itemId: string): Promise<void> {
    try {
      // Buscar o service_order_id antes de deletar
      const { data: item } = await supabase
        .from('service_order_items')
        .select('service_order_id')
        .eq('id', parseInt(itemId))
        .single();

      const { error } = await supabase
        .from('service_order_items')
        .delete()
        .eq('id', parseInt(itemId));

      if (error) throw error;

      // Atualizar total da ordem
      if (item?.service_order_id) {
        await this.atualizarTotalOrdem(item.service_order_id.toString());
      }
    } catch (error) {
      console.error('Erro ao remover item:', error);
      throw new Error(`Falha ao remover item: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // ==================== BUSCA E FILTROS ====================
  static async buscarOrdens(termo: string): Promise<OrdemServico[]> {
    try {
      const { data, error } = await supabase
        .from('service_orders')
        .select(`
          *,
          clients (id, name, phone, email),
          technicians (id, name, contact_info)
        `)
        .or(`description.ilike.%${termo}%,clients.name.ilike.%${termo}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(so => this.adaptarServiceOrderParaOrdemServico(so));
    } catch (error) {
      console.error('Erro ao buscar ordens:', error);
      throw new Error(`Falha ao buscar ordens: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async listarOrdensPorStatus(status: string): Promise<OrdemServico[]> {
    try {
      const { data, error } = await supabase
        .from('service_orders')
        .select(`
          *,
          clients (id, name, phone, email),
          technicians (id, name, contact_info)
        `)
        .eq('status', this.mapStatusToEN(status))
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(so => this.adaptarServiceOrderParaOrdemServico(so));
    } catch (error) {
      console.error('Erro ao listar ordens por status:', error);
      throw new Error(`Falha ao listar ordens: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async buscarOrdensPorCliente(clienteId: string): Promise<OrdemServico[]> {
    try {
      const { data, error } = await supabase
        .from('service_orders')
        .select(`
          *,
          clients (id, name, phone, email),
          technicians (id, name, contact_info)
        `)
        .eq('client_id', parseInt(clienteId))
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(so => this.adaptarServiceOrderParaOrdemServico(so));
    } catch (error) {
      console.error('Erro ao buscar ordens por cliente:', error);
      throw new Error(`Falha ao buscar ordens: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // ==================== ESTATÍSTICAS ====================
  static async contarOrdensPorStatus(): Promise<Record<string, number>> {
    try {
      const { data, error } = await supabase
        .from('service_orders')
        .select('status');

      if (error) throw error;

      const counts = {
        'orçamento': 0,
        'em-andamento': 0,
        'pronto': 0,
        'entregue': 0,
        'cancelada': 0
      };

      data?.forEach(order => {
        const statusPT = this.mapStatusToPT(order.status);
        if (statusPT in counts) {
          counts[statusPT as keyof typeof counts]++;
        }
      });

      return counts;
    } catch (error) {
      console.error('Erro ao contar ordens por status:', error);
      throw new Error(`Falha ao contar ordens: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async calcularTicketMedio(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('service_orders')
        .select('total_price')
        .gt('total_price', 0);

      if (error) throw error;

      if (!data || data.length === 0) return 0;

      const total = data.reduce((sum, order) => sum + order.total_price, 0);
      return total / data.length;
    } catch (error) {
      console.error('Erro ao calcular ticket médio:', error);
      throw new Error(`Falha ao calcular ticket médio: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // ==================== MÉTODOS AUXILIARES ====================
  private static async atualizarTotalOrdem(ordemId: string): Promise<void> {
    try {
      // Buscar todos os itens da ordem
      const { data: items } = await supabase
        .from('service_order_items')
        .select('subtotal')
        .eq('service_order_id', parseInt(ordemId));

      if (!items) return;

      const totalPrice = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);

      // Atualizar o total da ordem
      await supabase
        .from('service_orders')
        .update({ total_price: totalPrice })
        .eq('id', parseInt(ordemId));
    } catch (error) {
      console.error('Erro ao atualizar total da ordem:', error);
    }
  }

  // ==================== MÉTODOS ESPECÍFICOS PARA NOVA TABELA ====================
  static async obterClientesAtivos(): Promise<Client[]> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao obter clientes:', error);
      return [];
    }
  }

  static async obterTecnicosAtivos(): Promise<Technician[]> {
    try {
      const { data, error } = await supabase
        .from('technicians')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao obter técnicos:', error);
      return [];
    }
  }

  static async obterServicosAtivos(): Promise<Service[]> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao obter serviços:', error);
      return [];
    }
  }

  static async obterProdutosAtivos(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .gt('stock_quantity', 0)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao obter produtos:', error);
      return [];
    }
  }
}