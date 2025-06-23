# 🔧 Instruções de Configuração - Sistema de Gestão Sapataria

## 🚀 Acesso Admin Padrão

O sistema possui um usuário administrador padrão configurado automaticamente:

### 📋 Credenciais de Acesso

```
📧 Email: admin@admin.com
🔑 Senha: admin123456
👤 Role: Administrador (acesso total)
```

### 🎯 Como Acessar

1. **Iniciar o Sistema:**
   ```bash
   npm run dev
   ```

2. **Abrir o navegador:**
   - Acesse: `http://localhost:5173`

3. **Fazer Login:**
   - Use as credenciais acima na tela de login
   - O sistema irá reconhecer automaticamente as permissões de admin

### 🔧 Configuração Alternativa

Se o usuário admin não for criado automaticamente, você pode:

1. **Criar manualmente via script:**
   ```bash
   npm run create-admin
   ```

2. **Ou usar o setup completo:**
   ```bash
   npm run setup
   ```

### 🏗️ Configuração do Supabase

Certifique-se de que seu arquivo `.env` contém:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-key
```

### 🎛️ Funcionalidades do Admin

Com o usuário admin você terá acesso a:

- ✅ **Dashboard Completo** - Visão geral do sistema
- ✅ **Gestão de Usuários** - Criar/editar usuários e permissões
- ✅ **Clientes** - Cadastro completo de clientes
- ✅ **Ordens de Serviço** - Gestão completa de OS
- ✅ **Estoque** - Controle de produtos e movimentações
- ✅ **Financeiro** - Fluxo de caixa, contas a pagar/receber
- ✅ **Relatórios** - Análises e exportações
- ✅ **WhatsApp** - Automação e templates
- ✅ **QR Codes** - Geração para consultas públicas
- ✅ **Configurações** - Ajustes do sistema
- ✅ **Auditoria** - Logs de atividades

### 🔒 Segurança

- As credenciais padrão devem ser alteradas após o primeiro acesso
- O sistema possui controle de permissões por roles
- Logs de auditoria registram todas as atividades importantes

### 🚨 Troubleshooting

**Problema:** Não consegue fazer login
- Verifique se o Supabase está configurado corretamente
- Execute `npm run create-admin` para recriar o usuário
- Verifique o console do navegador para erros

**Problema:** Usuário criado mas sem permissões
- O sistema atribui automaticamente role 'admin' com permissões ['*']
- Verifique na tabela `users` do Supabase se o role está correto

**Problema:** Erro de conexão com Supabase
- Verifique as URLs e chaves no arquivo `.env`
- Confirme se o projeto Supabase está ativo

### 📞 Suporte

Em caso de problemas, verifique:

1. **Console do navegador** - Para erros de JavaScript
2. **Network tab** - Para erros de API
3. **Logs do Supabase** - Para erros de backend
4. **Arquivo `.env`** - Para configurações incorretas

---

## 🎉 Pronto para usar!

Após seguir essas instruções, seu sistema estará completamente configurado e pronto para uso em produção. 