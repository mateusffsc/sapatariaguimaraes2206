#!/usr/bin/env node

// Script simples para criar o usuário admin padrão
// Uso: node create-admin.js

require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase (ler do .env se disponível)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://seu-projeto.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sua-service-key';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const ADMIN_CREDENTIALS = {
  email: 'admin@admin.com',
  password: 'admin123456',
  fullName: 'Administrador do Sistema'
};

async function createAdminUser() {
  try {
    console.log('🚀 Criando usuário admin padrão...');
    console.log(`📧 Email: ${ADMIN_CREDENTIALS.email}`);
    console.log(`🔑 Senha: ${ADMIN_CREDENTIALS.password}`);
    console.log('');

    // Verificar se já existe
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingAdmin = existingUsers.users.find(user => user.email === ADMIN_CREDENTIALS.email);

    if (existingAdmin) {
      console.log('⚠️  Usuário admin já existe!');
      console.log(`👤 ID: ${existingAdmin.id}`);
      console.log(`📧 Email: ${existingAdmin.email}`);
      console.log(`📅 Criado em: ${existingAdmin.created_at}`);
      return;
    }

    // Criar usuário
    const { data, error } = await supabase.auth.admin.createUser({
      email: ADMIN_CREDENTIALS.email,
      password: ADMIN_CREDENTIALS.password,
      email_confirm: true,
      user_metadata: {
        full_name: ADMIN_CREDENTIALS.fullName,
        role: 'admin'
      },
      app_metadata: {
        role: 'admin',
        permissions: ['*']
      }
    });

    if (error) {
      console.error('❌ Erro ao criar usuário admin:', error.message);
      process.exit(1);
    }

    console.log('✅ Usuário admin criado com sucesso!');
    console.log(`👤 ID: ${data.user.id}`);
    console.log(`📧 Email: ${data.user.email}`);
    console.log(`📅 Criado em: ${data.user.created_at}`);
    console.log('');
    console.log('🎉 Você já pode fazer login no sistema!');
    console.log(`🌐 Acesse: http://localhost:5173`);

  } catch (error) {
    console.error('💥 Erro inesperado:', error.message);
    process.exit(1);
  }
}

async function main() {
  console.log('🔧 Setup do Sistema de Gestão - Sapataria Guimarães');
  console.log('=' * 50);
  console.log('');

  // Verificar se as variáveis de ambiente estão configuradas
  if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('⚠️  ATENÇÃO: Variáveis de ambiente não configuradas!');
    console.log('');
    console.log('Certifique-se de que o arquivo .env contém:');
    console.log('VITE_SUPABASE_URL=https://seu-projeto.supabase.co');
    console.log('VITE_SUPABASE_ANON_KEY=sua-anon-key');
    console.log('SUPABASE_SERVICE_ROLE_KEY=sua-service-key');
    console.log('');
    console.log('📋 Continuando com valores padrão...');
    console.log('');
  }

  await createAdminUser();
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
} 