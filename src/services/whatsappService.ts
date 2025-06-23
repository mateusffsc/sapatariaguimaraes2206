import { supabase } from '@/lib/supabase';

export interface WhatsAppTemplate {
  id: string;
  name: string;
  category: 'ordem_criada' | 'ordem_concluida' | 'lembrete_entrega' | 'cobranca' | 'pesquisa_satisfacao';
  template: string;
  active: boolean;
  variables: string[];
  created_at: string;
  updated_at: string;
}

export interface WhatsAppMessage {
  id: string;
  phone: string;
  message: string;
  template_id?: string;
  service_order_id?: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  sent_at?: string;
  error_message?: string;
  created_at: string;
}

export interface WhatsAppConfig {
  id: string;
  api_url: string;
  api_token: string;
  webhook_url: string;
  session_active: boolean;
  auto_send_enabled: boolean;
  created_at: string;
  updated_at: string;
}

class WhatsAppService {
  private apiConfig: WhatsAppConfig | null = null;

  // Configuração da API
  async getConfig(): Promise<WhatsAppConfig | null> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_config')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      this.apiConfig = data;
      return data;
    } catch (error) {
      console.error('Erro ao buscar configuração do WhatsApp:', error);
      return null;
    }
  }

  async updateConfig(config: Partial<WhatsAppConfig>): Promise<WhatsAppConfig> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_config')
        .upsert({
          ...config,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      this.apiConfig = data;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar configuração do WhatsApp:', error);
      throw error;
    }
  }

  // Templates de mensagens
  async getTemplates(): Promise<WhatsAppTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar templates:', error);
      return [];
    }
  }

  async getTemplate(id: string): Promise<WhatsAppTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar template:', error);
      return null;
    }
  }

  async createTemplate(template: Omit<WhatsAppTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<WhatsAppTemplate> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .insert({
          ...template,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao criar template:', error);
      throw error;
    }
  }

  async updateTemplate(id: string, template: Partial<WhatsAppTemplate>): Promise<WhatsAppTemplate> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .update({
          ...template,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar template:', error);
      throw error;
    }
  }

  async deleteTemplate(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('whatsapp_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao deletar template:', error);
      throw error;
    }
  }

  // Mensagens
  async getMessages(limit = 50): Promise<WhatsAppMessage[]> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      return [];
    }
  }

  async createMessage(message: Omit<WhatsAppMessage, 'id' | 'created_at'>): Promise<WhatsAppMessage> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .insert({
          ...message,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao criar mensagem:', error);
      throw error;
    }
  }

  async updateMessageStatus(id: string, status: WhatsAppMessage['status'], errorMessage?: string): Promise<void> {
    try {
      const updateData: any = {
        status,
        ...(status === 'sent' && { sent_at: new Date().toISOString() }),
        ...(errorMessage && { error_message: errorMessage })
      };

      const { error } = await supabase
        .from('whatsapp_messages')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao atualizar status da mensagem:', error);
      throw error;
    }
  }

  // Processamento de templates
  private processTemplate(template: string, variables: Record<string, any>): string {
    let processedMessage = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      processedMessage = processedMessage.replace(new RegExp(placeholder, 'g'), String(value));
    });

    return processedMessage;
  }

  // Envio de mensagens
  async sendMessage(phone: string, message: string, templateId?: string, serviceOrderId?: string): Promise<WhatsAppMessage> {
    try {
      // Criar registro da mensagem no banco
      const messageRecord = await this.createMessage({
        phone,
        message,
        template_id: templateId,
        service_order_id: serviceOrderId,
        status: 'pending'
      });

      // Se não há configuração da API, marcar como falha
      if (!this.apiConfig) {
        await this.updateMessageStatus(messageRecord.id, 'failed', 'WhatsApp não configurado');
        throw new Error('WhatsApp não configurado');
      }

      try {
        // Simular envio via API WhatsApp
        const response = await this.sendWhatsAppMessage(phone, message);
        
        if (response.success) {
          await this.updateMessageStatus(messageRecord.id, 'sent');
        } else {
          await this.updateMessageStatus(messageRecord.id, 'failed', response.error);
        }

        return messageRecord;
      } catch (apiError: any) {
        await this.updateMessageStatus(messageRecord.id, 'failed', apiError.message);
        throw apiError;
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  }

  async sendTemplateMessage(
    phone: string, 
    templateId: string, 
    variables: Record<string, any>, 
    serviceOrderId?: string
  ): Promise<WhatsAppMessage> {
    try {
      const template = await this.getTemplate(templateId);
      if (!template) {
        throw new Error('Template não encontrado');
      }

      if (!template.active) {
        throw new Error('Template não está ativo');
      }

      const processedMessage = this.processTemplate(template.template, variables);
      return await this.sendMessage(phone, processedMessage, templateId, serviceOrderId);
    } catch (error) {
      console.error('Erro ao enviar mensagem template:', error);
      throw error;
    }
  }

  // Automações para ordens de serviço
  async sendOrderCreatedMessage(serviceOrderId: string): Promise<void> {
    try {
      const templates = await this.getTemplates();
      const template = templates.find(t => t.category === 'ordem_criada' && t.active);
      
      if (!template) {
        console.log('Template para ordem criada não encontrado ou não ativo');
        return;
      }

      // Buscar dados da ordem de serviço (simulação simplificada)
      const variables = {
        cliente_nome: 'Cliente Teste',
        numero_os: 'OS-001',
        servicos: 'Conserto de sapato',
        tecnico: 'João Silva',
        valor_total: 'R$ 50,00',
        prazo_estimado: '3 dias úteis'
      };

      await this.sendTemplateMessage('11999999999', template.id, variables, serviceOrderId);
    } catch (error) {
      console.error('Erro ao enviar mensagem de ordem criada:', error);
    }
  }

  // Simulação da API WhatsApp
  private async sendWhatsAppMessage(phone: string, message: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.apiConfig) {
        return { success: false, error: 'WhatsApp não configurado' };
      }

      // Simular latência de rede
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simular sucesso/falha baseado em validações básicas
      if (!phone || phone.length < 10) {
        return { success: false, error: 'Número de telefone inválido' };
      }

      if (!message || message.trim().length === 0) {
        return { success: false, error: 'Mensagem vazia' };
      }

      console.log(`[WhatsApp Simulado] Enviando para ${phone}: ${message}`);
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Status e health check
  async checkConnection(): Promise<{ connected: boolean; error?: string }> {
    try {
      const config = await this.getConfig();
      if (!config) {
        return { connected: false, error: 'WhatsApp não configurado' };
      }

      // Simular verificação de conexão
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return { connected: true };
    } catch (error: any) {
      return { connected: false, error: error.message };
    }
  }

  // Estatísticas
  async getStats(): Promise<{
    total_messages: number;
    sent_today: number;
    failed_today: number;
    pending_messages: number;
  }> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const [totalResult, sentTodayResult, failedTodayResult, pendingResult] = await Promise.all([
        supabase.from('whatsapp_messages').select('id', { count: 'exact', head: true }),
        supabase.from('whatsapp_messages').select('id', { count: 'exact', head: true })
          .eq('status', 'sent')
          .gte('sent_at', `${today}T00:00:00.000Z`)
          .lt('sent_at', `${today}T23:59:59.999Z`),
        supabase.from('whatsapp_messages').select('id', { count: 'exact', head: true })
          .eq('status', 'failed')
          .gte('created_at', `${today}T00:00:00.000Z`)
          .lt('created_at', `${today}T23:59:59.999Z`),
        supabase.from('whatsapp_messages').select('id', { count: 'exact', head: true })
          .eq('status', 'pending')
      ]);

      return {
        total_messages: totalResult.count || 0,
        sent_today: sentTodayResult.count || 0,
        failed_today: failedTodayResult.count || 0,
        pending_messages: pendingResult.count || 0
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return {
        total_messages: 0,
        sent_today: 0,
        failed_today: 0,
        pending_messages: 0
      };
    }
  }
}

export const whatsappService = new WhatsAppService();
export default whatsappService; 