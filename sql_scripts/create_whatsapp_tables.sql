-- Criação das tabelas para o sistema WhatsApp

-- Tabela de configuração do WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    api_url TEXT NOT NULL DEFAULT '',
    api_token TEXT NOT NULL DEFAULT '',
    webhook_url TEXT DEFAULT '',
    session_active BOOLEAN DEFAULT FALSE,
    auto_send_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de templates de mensagem
CREATE TABLE IF NOT EXISTS whatsapp_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('ordem_criada', 'ordem_concluida', 'lembrete_entrega', 'cobranca', 'pesquisa_satisfacao')),
    template TEXT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    variables TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint para garantir unicidade por categoria ativa
    CONSTRAINT unique_active_template_per_category UNIQUE (category) DEFERRABLE INITIALLY DEFERRED
);

-- Remover constraint se ela já existir e recriar sem a limitação de um template ativo por categoria
DO $$ 
BEGIN
    ALTER TABLE whatsapp_templates DROP CONSTRAINT IF EXISTS unique_active_template_per_category;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Tabela de mensagens enviadas
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    template_id UUID REFERENCES whatsapp_templates(id) ON DELETE SET NULL,
    service_order_id UUID REFERENCES service_orders(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_phone ON whatsapp_messages(phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status ON whatsapp_messages(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created_at ON whatsapp_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_template_id ON whatsapp_messages(template_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_service_order_id ON whatsapp_messages(service_order_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_category ON whatsapp_templates(category);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_active ON whatsapp_templates(active);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_whatsapp_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at na tabela whatsapp_config
DROP TRIGGER IF EXISTS update_whatsapp_config_updated_at ON whatsapp_config;
CREATE TRIGGER update_whatsapp_config_updated_at
    BEFORE UPDATE ON whatsapp_config
    FOR EACH ROW
    EXECUTE FUNCTION update_whatsapp_updated_at_column();

-- Trigger para atualizar updated_at na tabela whatsapp_templates
DROP TRIGGER IF EXISTS update_whatsapp_templates_updated_at ON whatsapp_templates;
CREATE TRIGGER update_whatsapp_templates_updated_at
    BEFORE UPDATE ON whatsapp_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_whatsapp_updated_at_column();

-- Inserir configuração padrão se não existir
INSERT INTO whatsapp_config (api_url, api_token, webhook_url, session_active, auto_send_enabled)
SELECT '', '', '', FALSE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM whatsapp_config);

-- Inserir templates padrão se não existirem
INSERT INTO whatsapp_templates (name, category, template, active, variables) VALUES
-- Template para ordem criada
('Confirmação de Ordem', 'ordem_criada', 
'Olá {{cliente_nome}}! 🔧

Sua ordem de serviço foi criada com sucesso!

📋 **Detalhes:**
• OS: {{numero_os}}
• Serviços: {{servicos}}
• Técnico: {{tecnico}}
• Valor: {{valor_total}}
• Prazo: {{prazo_estimado}}

Em breve entraremos em contato. Obrigado! 😊', 
TRUE, 
'{"cliente_nome", "numero_os", "servicos", "tecnico", "valor_total", "prazo_estimado"}'::TEXT[]),

-- Template para ordem concluída
('Ordem Concluída', 'ordem_concluida',
'Olá {{cliente_nome}}! ✅

Sua ordem de serviço {{numero_os}} foi concluída!

💰 **Valor total:** {{valor_total}}

Você pode retirar seu calçado na nossa loja.

Obrigado pela confiança! 🙏',
TRUE,
'{"cliente_nome", "numero_os", "valor_total"}'::TEXT[]),

-- Template para lembrete de entrega
('Lembrete de Entrega', 'lembrete_entrega',
'Olá {{cliente_nome}}! ⏰

Lembramos que sua ordem {{numero_os}} está pronta para retirada desde {{data_entrega}}.

Nosso horário de funcionamento:
Segunda a Sexta: 8h às 18h
Sábado: 8h às 12h

Aguardamos você! 😊',
TRUE,
'{"cliente_nome", "numero_os", "data_entrega"}'::TEXT[]),

-- Template para cobrança
('Cobrança Pendente', 'cobranca',
'Olá {{cliente_nome}}! 💰

Identificamos que a OS {{numero_os}} no valor de {{valor_total}} está em atraso há {{dias_atraso}} dias.

Por favor, entre em contato conosco para regularizar a situação.

Obrigado! 🙏',
TRUE,
'{"cliente_nome", "numero_os", "valor_total", "dias_atraso"}'::TEXT[]),

-- Template para pesquisa de satisfação
('Pesquisa de Satisfação', 'pesquisa_satisfacao',
'Olá {{cliente_nome}}! ⭐

Esperamos que tenha ficado satisfeito com nosso serviço na OS {{numero_os}}.

Sua opinião é muito importante! Por favor, avalie nosso atendimento: {{link_pesquisa}}

Obrigado! 😊',
TRUE,
'{"cliente_nome", "numero_os", "link_pesquisa"}'::TEXT[])

-- Inserir apenas se não existirem templates
ON CONFLICT DO NOTHING;

-- Habilitar RLS (Row Level Security) se necessário
ALTER TABLE whatsapp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas (podem ser ajustadas conforme necessário)
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON whatsapp_config;
CREATE POLICY "Enable all operations for authenticated users" ON whatsapp_config
    FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON whatsapp_templates;
CREATE POLICY "Enable all operations for authenticated users" ON whatsapp_templates
    FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON whatsapp_messages;
CREATE POLICY "Enable all operations for authenticated users" ON whatsapp_messages
    FOR ALL USING (auth.role() = 'authenticated');

-- Comentários nas tabelas
COMMENT ON TABLE whatsapp_config IS 'Configurações do sistema WhatsApp Business';
COMMENT ON TABLE whatsapp_templates IS 'Templates de mensagens para automações';
COMMENT ON TABLE whatsapp_messages IS 'Histórico de mensagens enviadas';

COMMENT ON COLUMN whatsapp_config.api_url IS 'URL da API do WhatsApp Business';
COMMENT ON COLUMN whatsapp_config.api_token IS 'Token de autenticação da API';
COMMENT ON COLUMN whatsapp_config.webhook_url IS 'URL para receber webhooks';
COMMENT ON COLUMN whatsapp_config.session_active IS 'Status da sessão do WhatsApp';
COMMENT ON COLUMN whatsapp_config.auto_send_enabled IS 'Envio automático habilitado';

COMMENT ON COLUMN whatsapp_templates.category IS 'Categoria do template: ordem_criada, ordem_concluida, lembrete_entrega, cobranca, pesquisa_satisfacao';
COMMENT ON COLUMN whatsapp_templates.template IS 'Texto do template com variáveis {{variavel}}';
COMMENT ON COLUMN whatsapp_templates.variables IS 'Array com nomes das variáveis disponíveis';

COMMENT ON COLUMN whatsapp_messages.status IS 'Status da mensagem: pending, sent, delivered, failed';
COMMENT ON COLUMN whatsapp_messages.service_order_id IS 'Referência à ordem de serviço relacionada';
COMMENT ON COLUMN whatsapp_messages.error_message IS 'Mensagem de erro em caso de falha no envio'; 