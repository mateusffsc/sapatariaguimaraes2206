-- ============================================================================
-- SCRIPT DE CRIAÇÃO DAS TABELAS DE VENDAS E CREDIÁRIO
-- ============================================================================

-- Tabela de Vendas
CREATE TABLE IF NOT EXISTS sales (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT REFERENCES clients(id),
    total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partially_paid', 'cancelled')),
    is_credit_sale BOOLEAN NOT NULL DEFAULT false,
    created_by_user_id BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Itens de Venda
CREATE TABLE IF NOT EXISTS sale_items (
    id BIGSERIAL PRIMARY KEY,
    sale_id BIGINT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Crediário (Vendas a Prazo)
CREATE TABLE IF NOT EXISTS credit_sales (
    id BIGSERIAL PRIMARY KEY,
    sale_id BIGINT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    client_id BIGINT NOT NULL REFERENCES clients(id),
    total_amount_due DECIMAL(10,2) NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
    balance_due DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'paid', 'overdue')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Formas de Pagamento
CREATE TABLE IF NOT EXISTS payment_methods (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    fee_percentage DECIMAL(5,2) DEFAULT 0,
    fee_fixed DECIMAL(10,2) DEFAULT 0,
    liquidation_days INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Contas Bancárias
CREATE TABLE IF NOT EXISTS bank_accounts (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    bank_name VARCHAR(100),
    account_number VARCHAR(50),
    initial_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
    current_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Pagamentos/Movimentações Financeiras
CREATE TABLE IF NOT EXISTS payments (
    id BIGSERIAL PRIMARY KEY,
    amount DECIMAL(12,2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('revenue', 'expense', 'transfer')),
    payment_method_id BIGINT REFERENCES payment_methods(id),
    source_bank_account_id BIGINT REFERENCES bank_accounts(id),
    destination_bank_account_id BIGINT REFERENCES bank_accounts(id),
    sale_id BIGINT REFERENCES sales(id),
    service_order_id BIGINT REFERENCES service_orders(id),
    credit_sale_id BIGINT REFERENCES credit_sales(id),
    accounts_payable_id BIGINT REFERENCES accounts_payable(id),
    stock_movement_id BIGINT REFERENCES stock_movements(id),
    description TEXT,
    recorded_by_user_id BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Contas a Pagar
CREATE TABLE IF NOT EXISTS accounts_payable (
    id BIGSERIAL PRIMARY KEY,
    description TEXT NOT NULL,
    supplier_id BIGINT REFERENCES suppliers(id),
    total_amount_due DECIMAL(10,2) NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
    balance_due DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'paid', 'overdue')),
    created_by_user_id BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA DOS CAMPOS updated_at
-- ============================================================================

-- Função para atualizar o campo updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para as tabelas
DROP TRIGGER IF EXISTS update_sales_updated_at ON sales;
CREATE TRIGGER update_sales_updated_at
    BEFORE UPDATE ON sales
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sale_items_updated_at ON sale_items;
CREATE TRIGGER update_sale_items_updated_at
    BEFORE UPDATE ON sale_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_credit_sales_updated_at ON credit_sales;
CREATE TRIGGER update_credit_sales_updated_at
    BEFORE UPDATE ON credit_sales
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON payment_methods;
CREATE TRIGGER update_payment_methods_updated_at
    BEFORE UPDATE ON payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bank_accounts_updated_at ON bank_accounts;
CREATE TRIGGER update_bank_accounts_updated_at
    BEFORE UPDATE ON bank_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_accounts_payable_updated_at ON accounts_payable;
CREATE TRIGGER update_accounts_payable_updated_at
    BEFORE UPDATE ON accounts_payable
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ÍNDICES PARA MELHOR PERFORMANCE
-- ============================================================================

-- Índices para vendas
CREATE INDEX IF NOT EXISTS idx_sales_client_id ON sales(client_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_payment_status ON sales(payment_status);
CREATE INDEX IF NOT EXISTS idx_sales_is_credit_sale ON sales(is_credit_sale);

-- Índices para itens de venda
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);

-- Índices para crediário
CREATE INDEX IF NOT EXISTS idx_credit_sales_sale_id ON credit_sales(sale_id);
CREATE INDEX IF NOT EXISTS idx_credit_sales_client_id ON credit_sales(client_id);
CREATE INDEX IF NOT EXISTS idx_credit_sales_due_date ON credit_sales(due_date);
CREATE INDEX IF NOT EXISTS idx_credit_sales_status ON credit_sales(status);

-- Índices para pagamentos
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_payment_type ON payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_payments_sale_id ON payments(sale_id);
CREATE INDEX IF NOT EXISTS idx_payments_credit_sale_id ON payments(credit_sale_id);

-- ============================================================================
-- DADOS INICIAIS (SEED)
-- ============================================================================

-- Formas de pagamento padrão
INSERT INTO payment_methods (name, fee_percentage, fee_fixed, liquidation_days) 
VALUES 
    ('Dinheiro', 0, 0, 0),
    ('Cartão de Débito', 2.5, 0, 1),
    ('Cartão de Crédito', 3.5, 0, 30),
    ('PIX', 0, 0, 0),
    ('Transferência Bancária', 0, 0, 1)
ON CONFLICT DO NOTHING;

-- Conta bancária padrão
INSERT INTO bank_accounts (name, bank_name, initial_balance, current_balance) 
VALUES 
    ('Conta Principal', 'Caixa da Empresa', 0, 0)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMENTÁRIOS EXPLICATIVOS
-- ============================================================================

COMMENT ON TABLE sales IS 'Tabela principal de vendas';
COMMENT ON TABLE sale_items IS 'Itens individuais de cada venda';
COMMENT ON TABLE credit_sales IS 'Vendas a prazo (crediário)';
COMMENT ON TABLE payment_methods IS 'Formas de pagamento disponíveis';
COMMENT ON TABLE bank_accounts IS 'Contas bancárias da empresa';
COMMENT ON TABLE payments IS 'Movimentações financeiras (entradas e saídas)';
COMMENT ON TABLE accounts_payable IS 'Contas a pagar da empresa';

COMMENT ON COLUMN sales.is_credit_sale IS 'Indica se a venda é a prazo (true) ou à vista (false)';
COMMENT ON COLUMN credit_sales.status IS 'Status do crediário: open (em aberto), paid (quitado), overdue (vencido)';
COMMENT ON COLUMN payments.payment_type IS 'Tipo de movimentação: revenue (receita), expense (despesa), transfer (transferência)'; 