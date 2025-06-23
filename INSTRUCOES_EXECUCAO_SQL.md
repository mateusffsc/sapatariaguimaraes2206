# Instruções para Executar o Script SQL - Tabelas de Vendas e Crediário

## Problema Identificado

A aba de crediário estava ficando em branco porque as tabelas necessárias não existiam no banco de dados Supabase.

## Correções Realizadas

1. **Correção de Tipos**: Ajustei a inconsistência entre os tipos de status do crediário (`'pending'` → `'open'`)
2. **Criação do Script SQL**: Criei o arquivo `sql_scripts/create_sales_tables.sql` com todas as tabelas necessárias

## Como Executar o SQL no Supabase

### Opção 1: Via Interface Web do Supabase

1. Acesse o painel do Supabase: https://supabase.com/dashboard
2. Entre no seu projeto
3. Vá para **SQL Editor** no menu lateral
4. Clique em **New Query**
5. Copie todo o conteúdo do arquivo `sql_scripts/create_sales_tables.sql`
6. Cole no editor SQL
7. Clique em **Run** para executar

### Opção 2: Via Terminal (se você tem psql instalado)

```bash
# Substitua pelos seus dados de conexão do Supabase
psql "postgresql://postgres:[SUA_SENHA]@[SEU_HOST]:5432/postgres" -f sql_scripts/create_sales_tables.sql
```

## Tabelas que Serão Criadas

- ✅ `sales` - Vendas principais
- ✅ `sale_items` - Itens de cada venda
- ✅ `credit_sales` - Crediário (vendas a prazo)
- ✅ `payment_methods` - Formas de pagamento
- ✅ `bank_accounts` - Contas bancárias
- ✅ `payments` - Movimentações financeiras
- ✅ `accounts_payable` - Contas a pagar

## Dados Iniciais Incluídos

O script também vai inserir:
- Formas de pagamento padrão (Dinheiro, PIX, Cartões, etc.)
- Uma conta bancária padrão

## Verificação Após Execução

Depois de executar o SQL, você pode verificar se funcionou:

1. Reabra a aplicação no navegador
2. Vá para a aba **Crediário**
3. A página deve carregar normalmente (mesmo que vazia inicialmente)

## Próximos Passos

Após criar as tabelas, você poderá:
1. Cadastrar vendas a prazo
2. Gerenciar o crediário
3. Registrar pagamentos
4. Acompanhar devedores

## Observações Importantes

- O script usa `CREATE TABLE IF NOT EXISTS`, então é seguro executar múltiplas vezes
- As constraints de chave estrangeira assumem que as tabelas `clients`, `users`, `products`, etc. já existem
- Se alguma tabela dependente não existir, você receberá um erro específico

## Em Caso de Erro

Se você receber erros sobre tabelas não encontradas (como `clients`, `users`, `products`), me informe que criarei os scripts para essas tabelas também. 