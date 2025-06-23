import { supabase } from '../lib/supabase';
import { DatabaseMapper, type OrdemServico } from '../lib/mappers';
import type { 
  ServiceOrder, 
  ServiceOrderWithRelations,
  ServiceOrderItem,
  ServiceOrderHistory,
  CreateServiceOrder,
  UpdateServiceOrder,
  CreateServiceOrderItem,
  ServiceOrderStatus,
  Client,
  Technician,
  Service,
  Product
} from '../types/database';

export class ServiceOrderService {
  // ==================== MÉTODOS PRINCIPAIS ====================
  
  static async criarOrdemServico(dadosOS: Omit<OrdemServico, 'id' | 'created_at' | 'updated_at'>): Promise<ServiceOrder> {
    try {
      const serviceOrderData = DatabaseMapper.ordemServicoToServiceOrder(dadosOS);

      const { data, error } = await supabase
        .from('service_orders')
        .insert([serviceOrderData])
        .select('*')
        .single();

      if (error) throw error;

      // Criar histórico inicial
      await this.criarHistorico(data.id, 'created', `OS criada - Status: ${data.status}`);

      return data;
    } catch (error) {
      console.error('Erro ao criar ordem de serviço:', error);
      throw new Error(`Falha ao criar OS: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async listarOrdensServico(filtros?: {
    status?: ServiceOrderStatus;
    cliente_id?: number;
    tecnico_id?: number;
    dataInicio?: string;
    dataFim?: string;
  }): Promise<ServiceOrderWithRelations[]> {
    try {
      let query = supabase
        .from('service_orders')
        .select(`
          *,
          client:clients(*),
          technician:technicians(*),
          items:service_order_items(
            *,
            service:services(*),
            product:products(*)
          ),
          history:service_order_history(*),
          payments:payments(*)
        `)
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filtros?.status) {
        query = query.eq('status', filtros.status);
      }
      if (filtros?.cliente_id) {
        query = query.eq('client_id', filtros.cliente_id);
      }
      if (filtros?.tecnico_id) {
        query = query.eq('technician_id', filtros.tecnico_id);
      }
      if (filtros?.dataInicio) {
        query = query.gte('created_at', filtros.dataInicio);
      }
      if (filtros?.dataFim) {
        query = query.lte('created_at', filtros.dataFim);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Erro ao listar ordens de serviço:', error);
      throw new Error(`Falha ao listar OS: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async obterOrdemServicoPorId(id: number): Promise<ServiceOrderWithRelations | null> {
    try {
      const { data, error } = await supabase
        .from('service_orders')
        .select(`
          *,
          client:clients(*),
          technician:technicians(*),
          items:service_order_items(
            *,
            service:services(*),
            product:products(*)
          ),
          history:service_order_history(*),
          images:service_order_images(*),
          payments:payments(*)
        `)
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return data;
    } catch (error) {
      console.error('Erro ao obter ordem de serviço:', error);
      throw new Error(`Falha ao obter OS: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async atualizarOrdemServico(id: number, dadosOS: Partial<OrdemServico>): Promise<ServiceOrder> {
    try {
      const osAtual = await this.obterOrdemServicoPorId(id);
      if (!osAtual) throw new Error('OS não encontrada');

      const updateData: Partial<ServiceOrder> = {};
      
      if (dadosOS.status && dadosOS.status !== DatabaseMapper.mapStatusOSToPT(osAtual.status)) {
        updateData.status = DatabaseMapper.mapStatusOSToEN(dadosOS.status);
      }
      if (dadosOS.tecnico_id !== undefined) {
        updateData.technician_id = dadosOS.tecnico_id;
      }
      if (dadosOS.valor_total !== undefined) {
        updateData.total_price = dadosOS.valor_total;
      }
      if (dadosOS.artigo || dadosOS.descricao) {
        updateData.description = `${dadosOS.artigo || ''} - ${dadosOS.descricao || ''}`.trim();
      }

      updateData.updated_by_user_id = 1; // TODO: Usar ID do usuário logado

      const { data, error } = await supabase
        .from('service_orders')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;

      // Criar histórico se houve mudança de status
      if (updateData.status && updateData.status !== osAtual.status) {
        await this.criarHistorico(
          id, 
          'status_change', 
          `Status alterado de ${osAtual.status} para ${updateData.status}`
        );
      }

      return data;
    } catch (error) {
      console.error('Erro ao atualizar ordem de serviço:', error);
      throw new Error(`Falha ao atualizar OS: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async excluirOrdemServico(id: number): Promise<void> {
    try {
      const os = await this.obterOrdemServicoPorId(id);
      if (!os) throw new Error('OS não encontrada');
      
      if (os.status !== 'pending') {
        throw new Error('Apenas OS com status "Orçamento" podem ser excluídas');
      }

      const { error } = await supabase
        .from('service_orders')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao excluir ordem de serviço:', error);
      throw new Error(`Falha ao excluir OS: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // ==================== MÉTODOS DE ITENS ====================

  static async adicionarItem(ordemServicoId: number, item: {
    tipo: 'service' | 'product';
    item_id: number;
    quantidade: number;
    preco_unitario: number;
  }): Promise<ServiceOrderItem> {
    try {
      const itemData: CreateServiceOrderItem = {
        service_order_id: ordemServicoId,
        service_id: item.tipo === 'service' ? item.item_id : undefined,
        product_id: item.tipo === 'product' ? item.item_id : undefined,
        item_type: item.tipo,
        quantity: item.quantidade,
        unit_price: item.preco_unitario,
        subtotal: item.quantidade * item.preco_unitario,
      };

      const { data, error } = await supabase
        .from('service_order_items')
        .insert([itemData])
        .select(`
          *,
          service:services(*),
          product:products(*)
        `)
        .single();

      if (error) throw error;

      // Atualizar total da OS
      await this.recalcularTotalOS(ordemServicoId);

      return data;
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
      throw new Error(`Falha ao adicionar item: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async removerItem(itemId: number): Promise<void> {
    try {
      // Obter ordem de serviço do item para recalcular total
      const { data: item } = await supabase
        .from('service_order_items')
        .select('service_order_id')
        .eq('id', itemId)
        .single();

      const { error } = await supabase
        .from('service_order_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      // Recalcular total da OS
      if (item) {
        await this.recalcularTotalOS(item.service_order_id);
      }
    } catch (error) {
      console.error('Erro ao remover item:', error);
      throw new Error(`Falha ao remover item: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // ==================== MÉTODOS DE HISTÓRICO ====================

  static async criarHistorico(ordemServicoId: number, tipo: string, observacao: string): Promise<ServiceOrderHistory> {
    try {
      const historyData = {
        service_order_id: ordemServicoId,
        timestamp: new Date().toISOString(),
        status_change: tipo,
        note: observacao,
        changed_by_user_id: 1, // TODO: Usar ID do usuário logado
      };

      const { data, error } = await supabase
        .from('service_order_history')
        .insert([historyData])
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Erro ao criar histórico:', error);
      throw new Error(`Falha ao criar histórico: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async obterHistorico(ordemServicoId: number): Promise<ServiceOrderHistory[]> {
    try {
      const { data, error } = await supabase
        .from('service_order_history')
        .select('*')
        .eq('service_order_id', ordemServicoId)
        .order('timestamp', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Erro ao obter histórico:', error);
      throw new Error(`Falha ao obter histórico: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // ==================== MÉTODOS AUXILIARES ====================

  static async obterEstatisticas(): Promise<{
    total: number;
    pendentes: number;
    emAndamento: number;
    prontas: number;
    entregues: number;
    canceladas: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('service_orders')
        .select('status');

      if (error) throw error;

      const stats = {
        total: data.length,
        pendentes: 0,
        emAndamento: 0,
        prontas: 0,
        entregues: 0,
        canceladas: 0,
      };

      data.forEach(os => {
        switch (os.status) {
          case 'pending':
            stats.pendentes++;
            break;
          case 'in_progress':
            stats.emAndamento++;
            break;
          case 'completed':
            stats.prontas++;
            break;
          case 'delivered':
            stats.entregues++;
            break;
          case 'cancelled':
            stats.canceladas++;
            break;
        }
      });

      return stats;
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      throw new Error(`Falha ao obter estatísticas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  private static async recalcularTotalOS(ordemServicoId: number): Promise<void> {
    try {
      // Obter todos os itens da OS
      const { data: itens, error: itensError } = await supabase
        .from('service_order_items')
        .select('subtotal')
        .eq('service_order_id', ordemServicoId);

      if (itensError) throw itensError;

      // Calcular novo total
      const novoTotal = itens?.reduce((total, item) => total + item.subtotal, 0) || 0;

      // Atualizar total na OS
      const { error: updateError } = await supabase
        .from('service_orders')
        .update({ total_price: novoTotal })
        .eq('id', ordemServicoId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Erro ao recalcular total da OS:', error);
    }
  }

  // ==================== CONVERSÕES PARA COMPATIBILIDADE ====================

  static async listarOrdensServicoCompatibilidade(filtros?: {
    status?: string;
    cliente_id?: number;
    tecnico_id?: number;
    dataInicio?: string;
    dataFim?: string;
  }): Promise<OrdemServico[]> {
    try {
      const filtrosConvertidos = {
        ...filtros,
        status: filtros?.status ? DatabaseMapper.mapStatusOSToEN(filtros.status) : undefined,
      };

      const ordensEN = await this.listarOrdensServico(filtrosConvertidos);
      return DatabaseMapper.serviceOrdersToOrdensServico(ordensEN);
    } catch (error) {
      console.error('Erro ao listar ordens de serviço (compatibilidade):', error);
      throw new Error(`Falha ao listar OS: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }
} 