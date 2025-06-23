-- Tabela para logs de auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    resource_id TEXT,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'low'
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id ON audit_logs(resource_id);

-- RLS (Row Level Security)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas seus próprios logs (funcionários)
CREATE POLICY "Users can view their own audit logs" ON audit_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Política para permitir que managers vejam todos os logs
CREATE POLICY "Managers can view all audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('manager', 'admin')
        )
    );

-- Política para permitir que admins tenham acesso total
CREATE POLICY "Admins have full access to audit logs" ON audit_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Política para inserção de logs - todos podem inserir seus próprios logs
CREATE POLICY "Users can insert their own audit logs" ON audit_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Função para limpar logs antigos automaticamente (executar via cron job)
CREATE OR REPLACE FUNCTION clean_old_audit_logs(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM audit_logs 
    WHERE timestamp < NOW() - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para log automático de mudanças em tabelas críticas
CREATE OR REPLACE FUNCTION log_table_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Log para mudanças em usuários (apenas admins podem fazer)
    IF TG_TABLE_NAME = 'users' THEN
        INSERT INTO audit_logs (
            user_id, 
            user_name, 
            action, 
            resource, 
            resource_id, 
            details, 
            severity
        ) VALUES (
            auth.uid(),
            COALESCE((SELECT username FROM users WHERE id = auth.uid()), 'Sistema'),
            CASE 
                WHEN TG_OP = 'INSERT' THEN 'create_user'
                WHEN TG_OP = 'UPDATE' THEN 'update_user'
                WHEN TG_OP = 'DELETE' THEN 'delete_user'
            END,
            'users',
            COALESCE(NEW.id::text, OLD.id::text),
            CASE 
                WHEN TG_OP = 'INSERT' THEN to_jsonb(NEW)
                WHEN TG_OP = 'UPDATE' THEN jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
                WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
            END,
            'high'
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger na tabela users
DROP TRIGGER IF EXISTS audit_users_changes ON users;
CREATE TRIGGER audit_users_changes
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION log_table_changes();

-- Comentários para documentação
COMMENT ON TABLE audit_logs IS 'Tabela para armazenar logs de auditoria de todas as ações do sistema';
COMMENT ON COLUMN audit_logs.user_id IS 'ID do usuário que realizou a ação';
COMMENT ON COLUMN audit_logs.user_name IS 'Nome do usuário (para histórico mesmo se usuário for deletado)';
COMMENT ON COLUMN audit_logs.action IS 'Tipo de ação realizada (create, update, delete, view, login, etc.)';
COMMENT ON COLUMN audit_logs.resource IS 'Recurso/tabela afetado(a)';
COMMENT ON COLUMN audit_logs.resource_id IS 'ID específico do recurso afetado';
COMMENT ON COLUMN audit_logs.details IS 'Detalhes adicionais da ação em formato JSON';
COMMENT ON COLUMN audit_logs.severity IS 'Nível de severidade da ação (low, medium, high, critical)'; 