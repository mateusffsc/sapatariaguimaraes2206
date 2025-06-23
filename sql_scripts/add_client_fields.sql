-- ========================================
-- MIGRAÇÃO: Adicionar campos de CPF e endereço detalhado à tabela clients
-- ========================================

-- Adicionar campos à tabela clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS cpf VARCHAR(14);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS cep VARCHAR(9);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS street VARCHAR(255);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS number VARCHAR(50);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS complement VARCHAR(100);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS neighborhood VARCHAR(100);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS state VARCHAR(2);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_clients_cpf ON clients(cpf);
CREATE INDEX IF NOT EXISTS idx_clients_cep ON clients(cep);
CREATE INDEX IF NOT EXISTS idx_clients_city ON clients(city);

-- Adicionar comentários às colunas
COMMENT ON COLUMN clients.cpf IS 'CPF do cliente (somente números)';
COMMENT ON COLUMN clients.cep IS 'CEP do cliente (somente números)';
COMMENT ON COLUMN clients.street IS 'Nome da rua/logradouro';
COMMENT ON COLUMN clients.number IS 'Número do endereço';
COMMENT ON COLUMN clients.complement IS 'Complemento do endereço (apto, bloco, etc.)';
COMMENT ON COLUMN clients.neighborhood IS 'Bairro';
COMMENT ON COLUMN clients.city IS 'Cidade';
COMMENT ON COLUMN clients.state IS 'Estado (sigla de 2 letras)';

-- Criar constraint para garantir formato do estado (2 letras maiúsculas)
ALTER TABLE clients ADD CONSTRAINT chk_clients_state_format 
CHECK (state IS NULL OR (state ~ '^[A-Z]{2}$'));

-- Criar constraint para garantir formato do CPF (11 dígitos)
ALTER TABLE clients ADD CONSTRAINT chk_clients_cpf_format 
CHECK (cpf IS NULL OR (cpf ~ '^[0-9]{11}$'));

-- Criar constraint para garantir formato do CEP (8 dígitos)
ALTER TABLE clients ADD CONSTRAINT chk_clients_cep_format 
CHECK (cep IS NULL OR (cep ~ '^[0-9]{8}$'));

-- Mensagem de confirmação
DO $$
BEGIN
    RAISE NOTICE 'Migração concluída: Campos CPF, CEP e endereço detalhado adicionados à tabela clients';
END $$; 