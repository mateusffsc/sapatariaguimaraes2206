import { supabase } from '@/lib/supabase';
import { whatsappService } from './whatsappService';

export interface AutomationRule {
  id: string;
  name: string;
  type: 'lembrete_entrega' | 'cobranca_atraso' | 'pesquisa_satisfacao';
  template_id: string;
  trigger_condition: 'days_after_completion' | 'days_after_due_date' | 'overdue_payment';
  trigger_value: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AutomationExecution {
  id: string;
  rule_id: string;
  service_order_id: string;
  scheduled_at: string;
  executed_at?: string;
  status: 'scheduled' | 'executed' | 'failed' | 'cancelled';
  message_id?: string;
  error_message?: string;
  created_at: string;
}

export interface AutomationStats {
  total_rules: number;
  active_rules: number;
  scheduled_executions: number;
  executions_today: number;
  success_rate: number;
  last_execution?: string;
}

class WhatsAppAutomationService {
  async getAutomationRules(): Promise<AutomationRule[]> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_automation_rules')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar regras de automação:', error);
      return [];
    }
  }

  async getAutomationRule(id: string): Promise<AutomationRule | null> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_automation_rules')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar regra de automação:', error);
      return null;
    }
  }

  async createAutomationRule(rule: Omit<AutomationRule, 'id' | 'created_at' | 'updated_at'>): Promise<AutomationRule> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_automation_rules')
        .insert({
          ...rule,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao criar regra de automação:', error);
      throw error;
    }
  }

  async updateAutomationRule(id: string, rule: Partial<AutomationRule>): Promise<AutomationRule> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_automation_rules')
        .update({
          ...rule,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar regra de automação:', error);
      throw error;
    }
  }

  async deleteAutomationRule(id: string): Promise<void> {
    try {
      await this.cancelScheduledExecutions(id);
      
      const { error } = await supabase
        .from('whatsapp_automation_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao excluir regra de automação:', error);
      throw error;
    }
  }

  async getAutomationExecutions(limit = 50): Promise<AutomationExecution[]> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_automation_executions')
        .select('*')
        .order('scheduled_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar execuções de automação:', error);
      return [];
    }
  }

  async scheduleAutomation(
    ruleId: string, 
    serviceOrderId: string, 
    scheduledAt: Date
  ): Promise<AutomationExecution> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_automation_executions')
        .insert({
          rule_id: ruleId,
          service_order_id: serviceOrderId,
          scheduled_at: scheduledAt.toISOString(),
          status: 'scheduled',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao agendar automação:', error);
      throw error;
    }
  }

  async executeScheduledAutomation(executionId: string): Promise<void> {
    try {
      // Buscar dados da execução (simulação simplificada)
      const variables = {
        cliente_nome: 'Cliente Teste',
        numero_os: 'OS-001',
        valor_total: 'R$ 50,00',
        data_entrega: '15/12/2024',
        dias_atraso: '5',
        link_pesquisa: 'https://forms.gle/exemplo'
      };

      // Simular envio de mensagem
      console.log(`Executando automação ${executionId} com variáveis:`, variables);

      // Marcar como executado
      await supabase
        .from('whatsapp_automation_executions')
        .update({
          status: 'executed',
          executed_at: new Date().toISOString()
        })
        .eq('id', executionId);

    } catch (error) {
      console.error('Erro ao executar automação:', error);
      throw error;
    }
  }

  async cancelScheduledExecutions(ruleId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('whatsapp_automation_executions')
        .update({ status: 'cancelled' })
        .eq('rule_id', ruleId)
        .eq('status', 'scheduled');

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao cancelar execuções agendadas:', error);
      throw error;
    }
  }

  async processScheduledAutomations(): Promise<{ processed: number; errors: number }> {
    try {
      const now = new Date().toISOString();
      
      const { data: pendingExecutions, error } = await supabase
        .from('whatsapp_automation_executions')
        .select('id')
        .eq('status', 'scheduled')
        .lte('scheduled_at', now)
        .limit(10);

      if (error) throw error;

      let processed = 0;
      let errors = 0;

      for (const execution of pendingExecutions || []) {
        try {
          await this.executeScheduledAutomation(execution.id);
          processed++;
        } catch (error) {
          console.error(`Erro ao processar execução ${execution.id}:`, error);
          errors++;
        }
      }

      return { processed, errors };
    } catch (error) {
      console.error('Erro ao processar automações agendadas:', error);
      return { processed: 0, errors: 1 };
    }
  }

  async createAutomationsForServiceOrder(serviceOrderId: string, eventType: 'created' | 'completed'): Promise<void> {
    try {
      const rules = await this.getAutomationRules();
      const activeRules = rules.filter(rule => rule.active);

      for (const rule of activeRules) {
        let scheduledAt: Date | null = null;

        switch (rule.type) {
          case 'lembrete_entrega':
            if (eventType === 'completed' && rule.trigger_condition === 'days_after_completion') {
              scheduledAt = new Date();
              scheduledAt.setDate(scheduledAt.getDate() + rule.trigger_value);
            }
            break;

          case 'pesquisa_satisfacao':
            if (eventType === 'completed' && rule.trigger_condition === 'days_after_completion') {
              scheduledAt = new Date();
              scheduledAt.setDate(scheduledAt.getDate() + rule.trigger_value);
            }
            break;

          case 'cobranca_atraso':
            if (eventType === 'completed' && rule.trigger_condition === 'days_after_due_date') {
              scheduledAt = new Date();
              scheduledAt.setDate(scheduledAt.getDate() + rule.trigger_value);
            }
            break;
        }

        if (scheduledAt) {
          await this.scheduleAutomation(rule.id, serviceOrderId, scheduledAt);
        }
      }

    } catch (error) {
      console.error('Erro ao criar automações para OS:', error);
    }
  }

  async getAutomationStats(): Promise<AutomationStats> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const [totalRulesResult, activeRulesResult, scheduledExecutionsResult, executionsTodayResult] = await Promise.all([
        supabase.from('whatsapp_automation_rules').select('id', { count: 'exact', head: true }),
        supabase.from('whatsapp_automation_rules').select('id', { count: 'exact', head: true }).eq('active', true),
        supabase.from('whatsapp_automation_executions').select('id', { count: 'exact', head: true }).eq('status', 'scheduled'),
        supabase.from('whatsapp_automation_executions').select('id', { count: 'exact', head: true })
          .eq('status', 'executed')
          .gte('executed_at', `${today}T00:00:00.000Z`)
          .lt('executed_at', `${today}T23:59:59.999Z`)
      ]);

      return {
        total_rules: totalRulesResult.count || 0,
        active_rules: activeRulesResult.count || 0,
        scheduled_executions: scheduledExecutionsResult.count || 0,
        executions_today: executionsTodayResult.count || 0,
        success_rate: 95, // Simulado
        last_execution: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas de automação:', error);
      return {
        total_rules: 0,
        active_rules: 0,
        scheduled_executions: 0,
        executions_today: 0,
        success_rate: 0
      };
    }
  }

  async runAutomationBatch(): Promise<{ success: boolean; processed: number; errors: number }> {
    try {
      console.log('Iniciando processamento de automações...');
      
      const result = await this.processScheduledAutomations();
      
      console.log(`Automações processadas: ${result.processed}, erros: ${result.errors}`);
      
      return {
        success: true,
        processed: result.processed,
        errors: result.errors
      };
    } catch (error) {
      console.error('Erro no processamento em lote de automações:', error);
      return {
        success: false,
        processed: 0,
        errors: 1
      };
    }
  }
}

export const whatsappAutomationService = new WhatsAppAutomationService();
export default whatsappAutomationService; 