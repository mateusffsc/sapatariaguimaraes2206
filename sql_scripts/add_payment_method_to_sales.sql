-- Script para adicionar o campo payment_method à tabela sales
-- Execute este script no Supabase para adicionar suporte a formas de pagamento

-- Adicionar coluna payment_method à tabela sales
ALTER TABLE sales 
ADD COLUMN payment_method VARCHAR(50) DEFAULT 'dinheiro';

-- Adicionar comentário explicativo
COMMENT ON COLUMN sales.payment_method IS 'Forma de pagamento utilizada: dinheiro, pix, debito, credito, transferencia';

-- Atualizar registros existentes para terem uma forma de pagamento padrão
UPDATE sales 
SET payment_method = 'dinheiro' 
WHERE payment_method IS NULL;

-- Criar índice para melhorar performance em consultas por forma de pagamento
CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON sales(payment_method);

-- Verificar a estrutura atualizada da tabela
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'sales' 
-- ORDER BY ordinal_position; 