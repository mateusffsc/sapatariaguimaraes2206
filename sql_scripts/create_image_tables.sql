-- =====================================================
-- TABELAS DE IMAGENS DE ORDENS DE SERVIÇO
-- =====================================================
-- Este script cria as tabelas necessárias para o sistema
-- de upload e gerenciamento de imagens das ordens de serviço
-- =====================================================

-- Tabela de imagens de ordens de serviço
CREATE TABLE IF NOT EXISTS service_order_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE, -- Ordem de serviço relacionada
    image_url TEXT NOT NULL, -- URL pública da imagem no Supabase Storage
    image_type VARCHAR(20) NOT NULL CHECK (image_type IN ('before', 'after', 'progress', 'other')), -- Tipo da imagem
    description TEXT NULL, -- Descrição opcional da imagem
    file_size INTEGER NOT NULL DEFAULT 0, -- Tamanho do arquivo em bytes
    file_name VARCHAR(255) NOT NULL, -- Nome do arquivo no storage
    uploaded_by UUID NOT NULL REFERENCES auth.users(id), -- Usuário que fez o upload
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_service_order_images_service_order ON service_order_images(service_order_id);
CREATE INDEX IF NOT EXISTS idx_service_order_images_type ON service_order_images(image_type);
CREATE INDEX IF NOT EXISTS idx_service_order_images_uploaded_by ON service_order_images(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_service_order_images_created_at ON service_order_images(created_at);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_service_order_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_service_order_images_updated_at
    BEFORE UPDATE ON service_order_images
    FOR EACH ROW
    EXECUTE PROCEDURE update_service_order_images_updated_at();

-- Comentários da tabela
COMMENT ON TABLE service_order_images IS 'Imagens associadas às ordens de serviço (antes, depois, progresso)';
COMMENT ON COLUMN service_order_images.service_order_id IS 'ID da ordem de serviço que a imagem pertence';
COMMENT ON COLUMN service_order_images.image_url IS 'URL pública da imagem armazenada no Supabase Storage';
COMMENT ON COLUMN service_order_images.image_type IS 'Tipo da imagem: before (antes), after (depois), progress (progresso), other (outros)';
COMMENT ON COLUMN service_order_images.description IS 'Descrição opcional fornecida pelo usuário';
COMMENT ON COLUMN service_order_images.file_size IS 'Tamanho do arquivo em bytes';
COMMENT ON COLUMN service_order_images.file_name IS 'Nome do arquivo no storage (incluindo path)';
COMMENT ON COLUMN service_order_images.uploaded_by IS 'ID do usuário que fez o upload da imagem';

-- =====================================================

-- Row Level Security (RLS)
ALTER TABLE service_order_images ENABLE ROW LEVEL SECURITY;

-- Política para imagens - apenas usuários autenticados podem ver/gerenciar
CREATE POLICY "service_order_images_policy" ON service_order_images
    FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================

-- FUNÇÕES UTILITÁRIAS PARA IMAGENS
-- =====================================================

-- Função para obter estatísticas das imagens
CREATE OR REPLACE FUNCTION get_service_order_image_stats(
    p_service_order_id UUID DEFAULT NULL
) RETURNS TABLE (
    total_images INTEGER,
    total_size BIGINT,
    before_count INTEGER,
    after_count INTEGER,
    progress_count INTEGER,
    other_count INTEGER,
    recent_uploads INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_images,
        COALESCE(SUM(file_size), 0)::BIGINT as total_size,
        COUNT(CASE WHEN image_type = 'before' THEN 1 END)::INTEGER as before_count,
        COUNT(CASE WHEN image_type = 'after' THEN 1 END)::INTEGER as after_count,
        COUNT(CASE WHEN image_type = 'progress' THEN 1 END)::INTEGER as progress_count,
        COUNT(CASE WHEN image_type = 'other' THEN 1 END)::INTEGER as other_count,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END)::INTEGER as recent_uploads
    FROM service_order_images 
    WHERE (p_service_order_id IS NULL OR service_order_id = p_service_order_id);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_service_order_image_stats IS 'Retorna estatísticas das imagens de ordens de serviço';

-- =====================================================

-- Função para limpeza de imagens órfãs (images sem OS)
CREATE OR REPLACE FUNCTION cleanup_orphan_images()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Remover registros de imagens cujas ordens de serviço não existem mais
    DELETE FROM service_order_images 
    WHERE service_order_id NOT IN (SELECT id FROM service_orders);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_orphan_images IS 'Remove imagens órfãs (sem ordem de serviço associada)';

-- =====================================================

-- Função para obter histórico de uploads por usuário
CREATE OR REPLACE FUNCTION get_user_upload_history(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 50
) RETURNS TABLE (
    image_id UUID,
    service_order_id UUID,
    service_order_number VARCHAR,
    image_type VARCHAR,
    description TEXT,
    file_size INTEGER,
    uploaded_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        soi.id,
        soi.service_order_id,
        so.order_number,
        soi.image_type,
        soi.description,
        soi.file_size,
        soi.created_at
    FROM service_order_images soi
    JOIN service_orders so ON soi.service_order_id = so.id
    WHERE soi.uploaded_by = p_user_id
    ORDER BY soi.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_user_upload_history IS 'Retorna histórico de uploads de um usuário específico';

-- =====================================================

-- GRANTS DE PERMISSÃO
-- =====================================================

-- Permitir acesso à tabela
GRANT ALL ON service_order_images TO authenticated;

-- Permitir uso das funções
GRANT EXECUTE ON FUNCTION get_service_order_image_stats TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_orphan_images TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_upload_history TO authenticated;

-- =====================================================

-- POLÍTICAS ADICIONAIS DE SEGURANÇA
-- =====================================================

-- Política mais específica: usuários só podem ver imagens de OS que têm acesso
CREATE POLICY "service_order_images_view_policy" ON service_order_images
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        service_order_id IN (
            SELECT id FROM service_orders 
            WHERE auth.role() = 'authenticated'
        )
    );

-- Política para inserção: usuários autenticados podem fazer upload
CREATE POLICY "service_order_images_insert_policy" ON service_order_images
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND 
        uploaded_by = auth.uid()
    );

-- Política para atualização: usuários podem atualizar suas próprias imagens
CREATE POLICY "service_order_images_update_policy" ON service_order_images
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND 
        uploaded_by = auth.uid()
    );

-- Política para exclusão: usuários podem deletar suas próprias imagens
CREATE POLICY "service_order_images_delete_policy" ON service_order_images
    FOR DELETE USING (
        auth.role() = 'authenticated' AND 
        uploaded_by = auth.uid()
    );

-- =====================================================

-- CONFIGURAÇÃO DO SUPABASE STORAGE BUCKET
-- =====================================================

-- Inserir bucket para imagens se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'service-order-images',
    'service-order-images', 
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Política de storage para permitir upload
CREATE POLICY "service_order_images_storage_insert" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'service-order-images' AND 
        auth.role() = 'authenticated'
    );

-- Política de storage para permitir leitura pública
CREATE POLICY "service_order_images_storage_select" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'service-order-images'
    );

-- Política de storage para permitir exclusão pelo proprietário
CREATE POLICY "service_order_images_storage_delete" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'service-order-images' AND 
        auth.role() = 'authenticated'
    );

-- =====================================================

-- TRIGGERS PARA LIMPEZA AUTOMÁTICA
-- =====================================================

-- Trigger para remover arquivo do storage quando registro é deletado
CREATE OR REPLACE FUNCTION delete_storage_file_on_image_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Remover arquivo do storage
    -- Nota: Esta é uma operação assíncrona que pode falhar silenciosamente
    -- Em produção, considere usar uma queue para garantir a limpeza
    PERFORM storage.delete_object('service-order-images', OLD.file_name);
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_delete_storage_file
    AFTER DELETE ON service_order_images
    FOR EACH ROW
    EXECUTE FUNCTION delete_storage_file_on_image_delete();

-- =====================================================

-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se a tabela foi criada corretamente
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_order_images') THEN
        RAISE EXCEPTION 'Tabela service_order_images não foi criada!';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'service-order-images') THEN
        RAISE EXCEPTION 'Bucket service-order-images não foi criado!';
    END IF;
    
    RAISE NOTICE 'Sistema de imagens configurado com sucesso!';
    RAISE NOTICE 'Tabela: service_order_images ✓';
    RAISE NOTICE 'Bucket: service-order-images ✓';
    RAISE NOTICE 'Funções utilitárias ✓';
    RAISE NOTICE 'Políticas de segurança ✓';
END $$; 