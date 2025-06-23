-- ================================
-- TABELAS DE CONFIGURAÇÃO
-- ================================

-- Tabela para configurações da empresa
CREATE TABLE IF NOT EXISTS company_settings (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255),
    cnpj VARCHAR(18),
    cpf VARCHAR(14),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(10),
    logo_url TEXT,
    website VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela para configurações do sistema
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    setting_type VARCHAR(20) NOT NULL DEFAULT 'string',
    description TEXT,
    category VARCHAR(50) DEFAULT 'geral',
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    CONSTRAINT valid_setting_type CHECK (setting_type IN ('string', 'number', 'boolean', 'json'))
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_system_settings_public ON system_settings(is_public);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger nas tabelas
DROP TRIGGER IF EXISTS update_company_settings_updated_at ON company_settings;
CREATE TRIGGER update_company_settings_updated_at
    BEFORE UPDATE ON company_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;
CREATE TRIGGER update_system_settings_updated_at
    BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir configurações padrão do sistema
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, category, is_public) 
VALUES 
    ('sistema.nome', 'SapatariaPro', 'string', 'Nome do sistema', 'sistema', true),
    ('sistema.versao', '1.0.0', 'string', 'Versão do sistema', 'sistema', true),
    ('backup.automatico', 'true', 'boolean', 'Backup automático habilitado', 'backup', true),
    ('backup.frequencia', 'diario', 'string', 'Frequência do backup automático', 'backup', true),
    ('notificacoes.email', 'true', 'boolean', 'Notificações por email habilitadas', 'notificacoes', true),
    ('estoque.alerta_minimo', '10', 'number', 'Quantidade mínima para alerta de estoque', 'estoque', true),
    ('os.prazo_padrao', '7', 'number', 'Prazo padrão para entrega de OS (dias)', 'os', true),
    ('financeiro.moeda', 'BRL', 'string', 'Moeda padrão do sistema', 'financeiro', true),
    ('relatorios.formato_padrao', 'PDF', 'string', 'Formato padrão para relatórios', 'relatorios', true),
    ('interface.tema', 'claro', 'string', 'Tema da interface', 'interface', true)
ON CONFLICT (setting_key) DO NOTHING;

-- Comentários nas tabelas
COMMENT ON TABLE company_settings IS 'Configurações da empresa - dados cadastrais e informações gerais';
COMMENT ON TABLE system_settings IS 'Configurações do sistema - parâmetros operacionais e preferências';

COMMENT ON COLUMN company_settings.company_name IS 'Razão social da empresa';
COMMENT ON COLUMN company_settings.trade_name IS 'Nome fantasia';
COMMENT ON COLUMN company_settings.cnpj IS 'CNPJ da empresa (apenas números ou formatado)';
COMMENT ON COLUMN company_settings.cpf IS 'CPF do proprietário (para MEI)';

COMMENT ON COLUMN system_settings.setting_key IS 'Chave única da configuração (formato: categoria.nome)';
COMMENT ON COLUMN system_settings.setting_value IS 'Valor da configuração (sempre string, convertido na aplicação)';
COMMENT ON COLUMN system_settings.setting_type IS 'Tipo de dado: string, number, boolean, json';
COMMENT ON COLUMN system_settings.is_public IS 'Se a configuração pode ser visualizada por usuários não-admin';

-- Políticas RLS (Row Level Security) - se necessário
-- Descomente as linhas abaixo se estiver usando RLS
-- ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Enable read access for all users" ON company_settings FOR SELECT USING (true);
-- CREATE POLICY "Enable write access for authenticated users" ON company_settings FOR ALL USING (auth.role() = 'authenticated');

-- CREATE POLICY "Enable read access for public settings" ON system_settings FOR SELECT USING (is_public = true OR auth.role() = 'service_role');
-- CREATE POLICY "Enable write access for service role" ON system_settings FOR ALL USING (auth.role() = 'service_role'); 