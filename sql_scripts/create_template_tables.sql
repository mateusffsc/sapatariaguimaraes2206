-- ===========================================================================
-- TABELA: document_templates
-- DESCRIÇÃO: Armazena templates para documentos (OS, WhatsApp, E-mail, etc)
-- ===========================================================================

CREATE TABLE IF NOT EXISTS document_templates (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('os_print', 'whatsapp', 'email', 'report')),
    category VARCHAR(100) NOT NULL,
    template_content TEXT NOT NULL,
    variables TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    description TEXT,
    paper_size VARCHAR(20) DEFAULT 'a4' CHECK (paper_size IN ('a4', 'thermal_80mm', 'thermal_58mm')),
    orientation VARCHAR(20) DEFAULT 'portrait' CHECK (orientation IN ('portrait', 'landscape')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_document_templates_type ON document_templates(type);
CREATE INDEX IF NOT EXISTS idx_document_templates_category ON document_templates(category);
CREATE INDEX IF NOT EXISTS idx_document_templates_active ON document_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_document_templates_default ON document_templates(is_default);
CREATE INDEX IF NOT EXISTS idx_document_templates_type_category ON document_templates(type, category);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_document_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_document_templates_updated_at ON document_templates;
CREATE TRIGGER trigger_update_document_templates_updated_at
    BEFORE UPDATE ON document_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_document_templates_updated_at();

-- Comentários das tabelas
COMMENT ON TABLE document_templates IS 'Templates para geração de documentos (OS, WhatsApp, E-mail, Relatórios)';
COMMENT ON COLUMN document_templates.id IS 'Identificador único do template';
COMMENT ON COLUMN document_templates.name IS 'Nome descritivo do template';
COMMENT ON COLUMN document_templates.type IS 'Tipo do template (os_print, whatsapp, email, report)';
COMMENT ON COLUMN document_templates.category IS 'Categoria do template (sapataria, cliente, entrega, etc)';
COMMENT ON COLUMN document_templates.template_content IS 'Conteúdo do template com variáveis {{variavel}}';
COMMENT ON COLUMN document_templates.variables IS 'Array com nomes das variáveis utilizadas';
COMMENT ON COLUMN document_templates.is_active IS 'Indica se o template está ativo';
COMMENT ON COLUMN document_templates.is_default IS 'Indica se é o template padrão para o tipo/categoria';
COMMENT ON COLUMN document_templates.description IS 'Descrição opcional do template';
COMMENT ON COLUMN document_templates.paper_size IS 'Tamanho do papel para impressão (apenas para os_print)';
COMMENT ON COLUMN document_templates.orientation IS 'Orientação do papel (apenas para os_print)';

-- ===========================================================================
-- INSERÇÃO DE TEMPLATES PADRÃO
-- ===========================================================================

-- Template padrão para impressão de OS
INSERT INTO document_templates (name, type, category, template_content, variables, is_active, is_default, description, paper_size, orientation)
VALUES (
    'Ordem de Serviço - Padrão',
    'os_print',
    'sapataria',
    '<!DOCTYPE html>
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
</html>',
    ARRAY['empresa_nome', 'empresa_telefone', 'empresa_endereco', 'os_numero', 'cliente_nome', 'cliente_telefone', 'data_entrada', 'data_entrega', 'servicos', 'valor_total', 'observacoes'],
    true,
    true,
    'Template padrão para impressão de Ordem de Serviço',
    'a4',
    'portrait'
) ON CONFLICT DO NOTHING;

-- Template WhatsApp - Recebimento OS
INSERT INTO document_templates (name, type, category, template_content, variables, is_active, is_default, description)
VALUES (
    'WhatsApp - Recebimento OS',
    'whatsapp',
    'cliente',
    'Olá {{cliente_nome}}! 👋

Recebemos seu calçado para reparo! 👞

🏷️ *Ordem de Serviço:* {{os_numero}}
📋 *Serviços:* {{servicos}}
📅 *Previsão de entrega:* {{data_entrega}}
💰 *Valor:* {{valor_total}}

Acompanhe o andamento através do seu número de OS.

Qualquer dúvida, estamos à disposição! 😊',
    ARRAY['cliente_nome', 'os_numero', 'servicos', 'data_entrega', 'valor_total'],
    true,
    true,
    'Mensagem de confirmação de recebimento da OS'
) ON CONFLICT DO NOTHING;

-- Template WhatsApp - Entrega
INSERT INTO document_templates (name, type, category, template_content, variables, is_active, is_default, description)
VALUES (
    'WhatsApp - Pronto para Entrega',
    'whatsapp',
    'entrega',
    '🎉 Boa notícia, {{cliente_nome}}!

Seu calçado está pronto para retirada! ✅

🏷️ *OS:* {{os_numero}}
📋 *Serviços realizados:* {{servicos}}
💰 *Valor total:* {{valor_total}}

📍 *Endereço:* {{endereco_loja}}

⏰ Horário de funcionamento: Segunda a Sexta 8h às 18h, Sábado 8h às 12h

Aguardamos sua visita! 👍',
    ARRAY['cliente_nome', 'os_numero', 'servicos', 'valor_total', 'endereco_loja'],
    true,
    true,
    'Notificação de serviço pronto para entrega'
) ON CONFLICT DO NOTHING;

-- Template E-mail - Relatório Mensal
INSERT INTO document_templates (name, type, category, template_content, variables, is_active, is_default, description)
VALUES (
    'E-mail - Relatório Mensal',
    'email',
    'relatorio',
    '<!DOCTYPE html>
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
</html>',
    ARRAY['empresa_nome', 'mes_referencia', 'total_receitas', 'total_despesas', 'saldo', 'total_os'],
    true,
    true,
    'Template para envio de relatório mensal por e-mail'
) ON CONFLICT DO NOTHING;

-- Template OS Térmica 80mm
INSERT INTO document_templates (name, type, category, template_content, variables, is_active, is_default, description, paper_size, orientation)
VALUES (
    'Ordem de Serviço - Térmica 80mm',
    'os_print',
    'sapataria_termica',
    '{{empresa_nome}}
{{empresa_endereco}}
Tel: {{empresa_telefone}}
================================
ORDEM DE SERVIÇO Nº {{os_numero}}
================================

Cliente: {{cliente_nome}}
Telefone: {{cliente_telefone}}

Data Entrada: {{data_entrada}}
Data Entrega: {{data_entrega}}

--------------------------------
SERVIÇOS:
{{servicos}}
--------------------------------

VALOR TOTAL: {{valor_total}}

Observações:
{{observacoes}}

--------------------------------
Válido mediante apresentação
deste documento.
Prazo 30 dias para retirada.
================================',
    ARRAY['empresa_nome', 'empresa_telefone', 'empresa_endereco', 'os_numero', 'cliente_nome', 'cliente_telefone', 'data_entrada', 'data_entrega', 'servicos', 'valor_total', 'observacoes'],
    true,
    false,
    'Template otimizado para impressão térmica 80mm',
    'thermal_80mm',
    'portrait'
) ON CONFLICT DO NOTHING;

-- ===========================================================================
-- VERIFICAÇÕES E TESTES
-- ===========================================================================

-- Verificar se as tabelas foram criadas
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'document_templates') THEN
        RAISE NOTICE 'Tabela document_templates criada com sucesso!';
    ELSE
        RAISE EXCEPTION 'Falha ao criar tabela document_templates';
    END IF;
END
$$;

-- Contar templates inseridos
DO $$
DECLARE
    template_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO template_count FROM document_templates;
    RAISE NOTICE 'Total de templates inseridos: %', template_count;
END
$$;

-- ===========================================================================
-- COMANDOS ÚTEIS PARA MANUTENÇÃO
-- ===========================================================================

-- Para visualizar todos os templates:
-- SELECT id, name, type, category, is_active, is_default FROM document_templates ORDER BY type, category, name;

-- Para definir um template como padrão (desativa outros padrões da mesma categoria):
-- UPDATE document_templates SET is_default = false WHERE type = 'whatsapp' AND category = 'cliente';
-- UPDATE document_templates SET is_default = true WHERE id = 1;

-- Para duplicar um template:
-- INSERT INTO document_templates (name, type, category, template_content, variables, is_active, is_default, description, paper_size, orientation)
-- SELECT 'Cópia de ' || name, type, category, template_content, variables, is_active, false, 'Cópia de ' || description, paper_size, orientation
-- FROM document_templates WHERE id = 1;

COMMIT; 