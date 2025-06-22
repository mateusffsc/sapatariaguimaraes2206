-- ============================================================================
-- SCRIPT DE MIGRAÇÃO: Alterar colunas de referência de usuário para UUID
-- ============================================================================

-- Desabilitar temporariamente as foreign keys
SET session_replication_role = 'replica';

-- Alterar a coluna created_by_user_id na tabela sales
ALTER TABLE sales 
  DROP CONSTRAINT IF EXISTS sales_created_by_user_id_fkey,
  ALTER COLUMN created_by_user_id TYPE UUID USING NULL,
  ADD CONSTRAINT sales_created_by_user_id_fkey 
    FOREIGN KEY (created_by_user_id) 
    REFERENCES auth.users(id);

-- Alterar a coluna recorded_by_user_id na tabela payments
ALTER TABLE payments 
  DROP CONSTRAINT IF EXISTS payments_recorded_by_user_id_fkey,
  ALTER COLUMN recorded_by_user_id TYPE UUID USING NULL,
  ADD CONSTRAINT payments_recorded_by_user_id_fkey 
    FOREIGN KEY (recorded_by_user_id) 
    REFERENCES auth.users(id);

-- Alterar a coluna created_by_user_id na tabela accounts_payable
ALTER TABLE accounts_payable 
  DROP CONSTRAINT IF EXISTS accounts_payable_created_by_user_id_fkey,
  ALTER COLUMN created_by_user_id TYPE UUID USING NULL,
  ADD CONSTRAINT accounts_payable_created_by_user_id_fkey 
    FOREIGN KEY (created_by_user_id) 
    REFERENCES auth.users(id);

-- Reabilitar as foreign keys
SET session_replication_role = 'origin';

-- Mensagem de confirmação
DO $$
BEGIN
    RAISE NOTICE 'Migração concluída: Colunas de referência de usuário alteradas para UUID';
END $$; 