import { supabase } from '../lib/supabase';
import type { ServiceOrderHistory } from '../types/database';

export class ServiceOrderHistoryService {
  // ==================== CRIAR ENTRADA NO HISTÓRICO ====================
  static async criarHistorico(
    serviceOrderId: number,
    statusChange: string,
    note?: string,
    userId?: string
  ): Promise<ServiceOrderHistory> {
    try {
      const { data, error } = await supabase
        .from('service_order_history')
        .insert([{
          service_order_id: serviceOrderId,
          timestamp: new Date().toISOString(),
          status_change: statusChange,
          note: note || null,
          user_id: userId || null // Para rastreamento futuro do usuário
        }])
        .select('*')
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Erro ao criar histórico:', error);
      throw new Error(`Falha ao criar histórico: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // ==================== LISTAR HISTÓRICO DE UMA OS ====================
  static async obterHistoricoOS(serviceOrderId: number): Promise<ServiceOrderHistory[]> {
    try {
      const { data, error } = await supabase
        .from('service_order_history')
        .select('*')
        .eq('service_order_id', serviceOrderId)
        .order('timestamp', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Erro ao obter histórico:', error);
      throw new Error(`Falha ao obter histórico: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // ==================== MUDAR STATUS COM HISTÓRICO ====================
  static async mudarStatusComHistorico(
    serviceOrderId: number,
    novoStatus: string,
    statusAnterior: string,
    observacao?: string
  ): Promise<void> {
    try {
      // 1. Atualizar status na tabela service_orders
      const { error: updateError } = await supabase
        .from('service_orders')
        .update({ 
          status: novoStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', serviceOrderId);

      if (updateError) throw updateError;

      // 2. Criar entrada no histórico
      const statusChangeText = `Status alterado de "${this.getStatusLabel(statusAnterior)}" para "${this.getStatusLabel(novoStatus)}"`;
      
      await this.criarHistorico(
        serviceOrderId,
        statusChangeText,
        observacao
      );

      console.log(`Status da OS ${serviceOrderId} alterado para ${novoStatus}`);
    } catch (error) {
      console.error('Erro ao mudar status:', error);
      throw new Error(`Falha ao mudar status: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // ==================== HELPER FUNCTIONS ====================
  static getStatusLabel(status: string): string {
    const labels = {
      'budget': 'Orçamento',
      'approved': 'Aprovado',
      'in_progress': 'Em Andamento',
      'completed': 'Pronto',
      'delivered': 'Entregue',
      'cancelled': 'Cancelado'
    };
    
    return labels[status as keyof typeof labels] || status;
  }

  // ==================== ADICIONAR OBSERVAÇÃO ====================
  static async adicionarObservacao(
    serviceOrderId: number,
    observacao: string,
    userId?: string
  ): Promise<ServiceOrderHistory> {
    try {
      return await this.criarHistorico(
        serviceOrderId,
        'Observação adicionada',
        observacao,
        userId
      );
    } catch (error) {
      console.error('Erro ao adicionar observação:', error);
      throw new Error(`Falha ao adicionar observação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // ==================== REGISTRAR AÇÃO PERSONALIZADA ====================
  static async registrarAcao(
    serviceOrderId: number,
    acao: string,
    detalhes?: string,
    userId?: string
  ): Promise<ServiceOrderHistory> {
    try {
      return await this.criarHistorico(
        serviceOrderId,
        acao,
        detalhes,
        userId
      );
    } catch (error) {
      console.error('Erro ao registrar ação:', error);
      throw new Error(`Falha ao registrar ação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // ==================== ESTATÍSTICAS DO HISTÓRICO ====================
  static async obterEstatisticasHistorico(): Promise<{
    totalMudancas: number;
    mudancasHoje: number;
    mudancasUltimos7Dias: number;
  }> {
    try {
      const hoje = new Date();
      const ontem = new Date(hoje);
      ontem.setDate(hoje.getDate() - 1);
      
      const semanaPassada = new Date(hoje);
      semanaPassada.setDate(hoje.getDate() - 7);

      // Total de mudanças
      const { count: totalMudancas, error: totalError } = await supabase
        .from('service_order_history')
        .select('*', { count: 'exact', head: true });

      if (totalError) throw totalError;

      // Mudanças hoje
      const { count: mudancasHoje, error: hojeError } = await supabase
        .from('service_order_history')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', ontem.toISOString());

      if (hojeError) throw hojeError;

      // Mudanças últimos 7 dias
      const { count: mudancasUltimos7Dias, error: semanaError } = await supabase
        .from('service_order_history')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', semanaPassada.toISOString());

      if (semanaError) throw semanaError;

      return {
        totalMudancas: totalMudancas || 0,
        mudancasHoje: mudancasHoje || 0,
        mudancasUltimos7Dias: mudancasUltimos7Dias || 0
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      throw new Error(`Falha ao obter estatísticas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }
} 