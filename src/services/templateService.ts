import { supabase } from '../lib/supabase';
import type { 
  DocumentTemplate, 
  TemplateVariable,
  CreateDocumentTemplate, 
  UpdateDocumentTemplate
} from '../types/database';

export class TemplateService {
  // ==================== GERENCIAMENTO DE TEMPLATES ====================
  
  static async listarTemplates(tipo?: string): Promise<DocumentTemplate[]> {
    try {
      let query = supabase
        .from('document_templates')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (tipo) {
        query = query.eq('type', tipo);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Erro ao listar templates:', error);
      throw new Error(`Falha ao listar templates: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async obterTemplate(id: number): Promise<DocumentTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return data;
    } catch (error) {
      console.error('Erro ao obter template:', error);
      throw new Error(`Falha ao obter template: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async obterTemplatePadrao(tipo: string, categoria?: string): Promise<DocumentTemplate | null> {
    try {
      let query = supabase
        .from('document_templates')
        .select('*')
        .eq('type', tipo)
        .eq('is_default', true)
        .eq('is_active', true);

      if (categoria) {
        query = query.eq('category', categoria);
      }

      const { data, error } = await query.single();

      if (error && error.code !== 'PGRST116') throw error;

      return data;
    } catch (error) {
      console.error('Erro ao obter template padrão:', error);
      throw new Error(`Falha ao obter template padrão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async criarTemplate(dados: CreateDocumentTemplate): Promise<DocumentTemplate> {
    try {
      // Se é padrão, desativar outros padrões do mesmo tipo/categoria
      if (dados.is_default) {
        await this.removerPadrao(dados.type, dados.category);
      }

      const { data, error } = await supabase
        .from('document_templates')
        .insert([dados])
        .select('*')
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Erro ao criar template:', error);
      throw new Error(`Falha ao criar template: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async atualizarTemplate(id: number, dados: UpdateDocumentTemplate): Promise<DocumentTemplate> {
    try {
      // Se está marcando como padrão, desativar outros padrões
      if (dados.is_default) {
        const templateExistente = await this.obterTemplate(id);
        if (templateExistente) {
          await this.removerPadrao(templateExistente.type, templateExistente.category);
        }
      }

      const { data, error } = await supabase
        .from('document_templates')
        .update(dados)
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Erro ao atualizar template:', error);
      throw new Error(`Falha ao atualizar template: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async excluirTemplate(id: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('document_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao excluir template:', error);
      throw new Error(`Falha ao excluir template: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async duplicarTemplate(id: number, novoNome: string): Promise<DocumentTemplate> {
    try {
      const templateOriginal = await this.obterTemplate(id);
      if (!templateOriginal) {
        throw new Error('Template não encontrado');
      }

      const novoTemplate: CreateDocumentTemplate = {
        name: novoNome,
        type: templateOriginal.type,
        category: templateOriginal.category,
        template_content: templateOriginal.template_content,
        variables: templateOriginal.variables,
        is_active: true,
        is_default: false, // Duplicatas nunca são padrão
        description: `Cópia de ${templateOriginal.name}`,
        paper_size: templateOriginal.paper_size,
        orientation: templateOriginal.orientation,
      };

      return await this.criarTemplate(novoTemplate);
    } catch (error) {
      console.error('Erro ao duplicar template:', error);
      throw new Error(`Falha ao duplicar template: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  private static async removerPadrao(tipo: string, categoria: string): Promise<void> {
    await supabase
      .from('document_templates')
      .update({ is_default: false })
      .eq('type', tipo)
      .eq('category', categoria)
      .eq('is_default', true);
  }

  // ==================== PROCESSAMENTO DE TEMPLATES ====================

  static processarTemplate(templateContent: string, dados: Record<string, any>): string {
    let conteudoProcessado = templateContent;

    // Substituir variáveis do tipo {{variavel}}
    Object.entries(dados).forEach(([chave, valor]) => {
      const regex = new RegExp(`{{\\s*${chave}\\s*}}`, 'g');
      const valorFormatado = this.formatarVariavel(valor, chave);
      conteudoProcessado = conteudoProcessado.replace(regex, valorFormatado);
    });

    // Remover variáveis não substituídas
    conteudoProcessado = conteudoProcessado.replace(/{{[^}]+}}/g, '');

    return conteudoProcessado;
  }

  private static formatarVariavel(valor: any, chave: string): string {
    if (valor === null || valor === undefined) return '';

    // Formatações específicas por tipo de dados
    if (chave.includes('data') || chave.includes('date')) {
      try {
        return new Date(valor).toLocaleDateString('pt-BR');
      } catch {
        return String(valor);
      }
    }

    if (chave.includes('valor') || chave.includes('preco') || chave.includes('total')) {
      try {
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(Number(valor));
      } catch {
        return String(valor);
      }
    }

    return String(valor);
  }

  // ==================== TEMPLATES PADRÃO ====================

  static async inicializarTemplatesPadrao(): Promise<void> {
    try {
      const templatesPadrao = [
        // Template OS para impressão
        {
          name: 'Ordem de Serviço - Padrão',
          type: 'os_print',
          category: 'sapataria',
          template_content: this.getTemplateOSPadrao(),
          variables: ['empresa_nome', 'empresa_telefone', 'empresa_endereco', 'os_numero', 'cliente_nome', 'cliente_telefone', 'data_entrada', 'data_entrega', 'servicos', 'valor_total', 'observacoes'],
          is_active: true,
          is_default: true,
          description: 'Template padrão para impressão de Ordem de Serviço',
          paper_size: 'a4',
          orientation: 'portrait',
        },
        // Template WhatsApp - Cliente
        {
          name: 'WhatsApp - Recebimento OS',
          type: 'whatsapp',
          category: 'cliente',
          template_content: this.getTemplateWhatsAppRecebimento(),
          variables: ['cliente_nome', 'os_numero', 'servicos', 'data_entrega', 'valor_total'],
          is_active: true,
          is_default: true,
          description: 'Mensagem de confirmação de recebimento da OS',
        },
        // Template WhatsApp - Entrega
        {
          name: 'WhatsApp - Pronto para Entrega',
          type: 'whatsapp',
          category: 'entrega',
          template_content: this.getTemplateWhatsAppEntrega(),
          variables: ['cliente_nome', 'os_numero', 'servicos', 'valor_total', 'endereco_loja'],
          is_active: true,
          is_default: true,
          description: 'Notificação de serviço pronto para entrega',
        },
        // Template E-mail
        {
          name: 'E-mail - Relatório Mensal',
          type: 'email',
          category: 'relatorio',
          template_content: this.getTemplateEmailRelatorio(),
          variables: ['empresa_nome', 'mes_referencia', 'total_receitas', 'total_despesas', 'saldo', 'total_os'],
          is_active: true,
          is_default: true,
          description: 'Template para envio de relatório mensal por e-mail',
        },
      ];

      for (const template of templatesPadrao) {
        const existe = await supabase
          .from('document_templates')
          .select('id')
          .eq('name', template.name)
          .single();

        if (!existe.data) {
          await this.criarTemplate(template as CreateDocumentTemplate);
        }
      }
    } catch (error) {
      console.error('Erro ao inicializar templates padrão:', error);
      throw new Error(`Falha ao inicializar templates padrão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // ==================== TEMPLATES DE CONTEÚDO ====================

  private static getTemplateOSPadrao(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Ordem de Serviço - {{os_numero}}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .info-section { margin-bottom: 15px; }
        .label { font-weight: bold; }
        .services-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        .services-table th, .services-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .services-table th { background-color: #f2f2f2; }
        .total { text-align: right; font-weight: bold; font-size: 18px; margin-top: 20px; }
        .footer { margin-top: 30px; padding-top: 10px; border-top: 1px solid #ddd; text-align: center; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{empresa_nome}}</h1>
        <p>{{empresa_endereco}}</p>
        <p>Telefone: {{empresa_telefone}}</p>
    </div>

    <h2>ORDEM DE SERVIÇO Nº {{os_numero}}</h2>

    <div class="info-section">
        <p><span class="label">Cliente:</span> {{cliente_nome}}</p>
        <p><span class="label">Telefone:</span> {{cliente_telefone}}</p>
        <p><span class="label">Data de Entrada:</span> {{data_entrada}}</p>
        <p><span class="label">Data de Entrega:</span> {{data_entrega}}</p>
    </div>

    <h3>Serviços Solicitados:</h3>
    {{servicos}}

    <div class="total">
        <p>VALOR TOTAL: {{valor_total}}</p>
    </div>

    <div class="info-section">
        <p><span class="label">Observações:</span></p>
        <p>{{observacoes}}</p>
    </div>

    <div class="footer">
        <p>Esta ordem de serviço é válida mediante apresentação deste documento.</p>
        <p>Prazo de 30 dias para retirada após a data de entrega.</p>
    </div>
</body>
</html>`.trim();
  }

  private static getTemplateWhatsAppRecebimento(): string {
    return `Olá {{cliente_nome}}! 👋

Recebemos seu calçado para reparo! 👞

🏷️ *Ordem de Serviço:* {{os_numero}}
📋 *Serviços:* {{servicos}}
📅 *Previsão de entrega:* {{data_entrega}}
💰 *Valor:* {{valor_total}}

Acompanhe o andamento através do seu número de OS.

Qualquer dúvida, estamos à disposição! 😊`.trim();
  }

  private static getTemplateWhatsAppEntrega(): string {
    return `🎉 Boa notícia, {{cliente_nome}}!

Seu calçado está pronto para retirada! ✅

🏷️ *OS:* {{os_numero}}
📋 *Serviços realizados:* {{servicos}}
💰 *Valor total:* {{valor_total}}

📍 *Endereço:* {{endereco_loja}}

⏰ Horário de funcionamento: Segunda a Sexta 8h às 18h, Sábado 8h às 12h

Aguardamos sua visita! 👍`.trim();
  }

  private static getTemplateEmailRelatorio(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Relatório Mensal - {{mes_referencia}}</title>
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px;">
        <h1 style="color: #333; text-align: center;">{{empresa_nome}}</h1>
        <h2 style="color: #666; text-align: center;">Relatório Mensal - {{mes_referencia}}</h2>

        <div style="margin: 30px 0;">
            <table style="width: 100%; border-collapse: collapse;">
                <tr style="background-color: #f8f9fa;">
                    <td style="padding: 15px; border: 1px solid #ddd; font-weight: bold;">Total de Receitas</td>
                    <td style="padding: 15px; border: 1px solid #ddd; color: #28a745; font-weight: bold;">{{total_receitas}}</td>
                </tr>
                <tr>
                    <td style="padding: 15px; border: 1px solid #ddd; font-weight: bold;">Total de Despesas</td>
                    <td style="padding: 15px; border: 1px solid #ddd; color: #dc3545; font-weight: bold;">{{total_despesas}}</td>
                </tr>
                <tr style="background-color: #f8f9fa;">
                    <td style="padding: 15px; border: 1px solid #ddd; font-weight: bold;">Saldo do Período</td>
                    <td style="padding: 15px; border: 1px solid #ddd; font-weight: bold; font-size: 18px;">{{saldo}}</td>
                </tr>
                <tr>
                    <td style="padding: 15px; border: 1px solid #ddd; font-weight: bold;">Ordens de Serviço</td>
                    <td style="padding: 15px; border: 1px solid #ddd;">{{total_os}} ordens processadas</td>
                </tr>
            </table>
        </div>

        <p style="text-align: center; color: #666; margin-top: 30px;">
            Relatório gerado automaticamente pelo sistema de gestão.
        </p>
    </div>
</body>
</html>`.trim();
  }

  // ==================== VARIÁVEIS DISPONÍVEIS ====================

  static obterVariaveisDisponiveis(): Record<string, TemplateVariable[]> {
    return {
      empresa: [
        { key: 'empresa_nome', description: 'Nome da empresa', example: 'Sapataria do João', required: true, type: 'text' },
        { key: 'empresa_telefone', description: 'Telefone da empresa', example: '(11) 99999-9999', required: false, type: 'text' },
        { key: 'empresa_endereco', description: 'Endereço da empresa', example: 'Rua das Flores, 123', required: false, type: 'text' },
        { key: 'empresa_email', description: 'E-mail da empresa', example: 'contato@sapataria.com', required: false, type: 'text' },
      ],
      cliente: [
        { key: 'cliente_nome', description: 'Nome do cliente', example: 'Maria Silva', required: true, type: 'text' },
        { key: 'cliente_telefone', description: 'Telefone do cliente', example: '(11) 88888-8888', required: false, type: 'text' },
        { key: 'cliente_email', description: 'E-mail do cliente', example: 'maria@email.com', required: false, type: 'text' },
        { key: 'cliente_endereco', description: 'Endereço do cliente', example: 'Rua A, 456', required: false, type: 'text' },
      ],
      ordem_servico: [
        { key: 'os_numero', description: 'Número da OS', example: 'OS001', required: true, type: 'text' },
        { key: 'data_entrada', description: 'Data de entrada', example: '15/01/2024', required: true, type: 'date' },
        { key: 'data_entrega', description: 'Data de entrega', example: '22/01/2024', required: true, type: 'date' },
        { key: 'servicos', description: 'Lista de serviços', example: 'Solagem, Costura', required: true, type: 'text' },
        { key: 'valor_total', description: 'Valor total', example: 'R$ 45,00', required: true, type: 'currency' },
        { key: 'observacoes', description: 'Observações', example: 'Urgente', required: false, type: 'text' },
      ],
      financeiro: [
        { key: 'total_receitas', description: 'Total de receitas', example: 'R$ 5.000,00', required: false, type: 'currency' },
        { key: 'total_despesas', description: 'Total de despesas', example: 'R$ 2.000,00', required: false, type: 'currency' },
        { key: 'saldo', description: 'Saldo do período', example: 'R$ 3.000,00', required: false, type: 'currency' },
        { key: 'total_os', description: 'Total de OS', example: '25', required: false, type: 'number' },
        { key: 'mes_referencia', description: 'Mês de referência', example: 'Janeiro 2024', required: false, type: 'text' },
      ],
    };
  }
} 