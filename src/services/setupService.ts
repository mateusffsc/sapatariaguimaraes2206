import { supabase } from '../lib/supabase';
import { AuthService } from './authService';

export interface DefaultAdminConfig {
  email: string;
  password: string;
  fullName: string;
  role: 'admin';
}

export class SetupService {
  private static readonly DEFAULT_ADMIN: DefaultAdminConfig = {
    email: 'admin@admin.com',
    password: 'admin123456',
    fullName: 'Administrador do Sistema',
    role: 'admin'
  };

  /**
   * Verifica se já existe algum usuário admin no sistema
   */
  static async hasAdminUser(): Promise<boolean> {
    try {
      // Verificar na tabela de usuários do sistema se há algum admin
      const { data, error } = await supabase
        .from('users')
        .select('id, role')
        .eq('role', 'admin')
        .limit(1);

      if (error) {
        console.log('Tabela users ainda não existe, tentando auth users...');
        
        // Se a tabela users não existe, verificar na tabela auth.users
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
        
        if (authError) {
          console.log('Erro ao listar usuários auth:', authError);
          return false;
        }

        // Verificar se há usuários com role admin nos metadados
        const adminUsers = authUsers.users.filter((user: any) => 
          user.user_metadata?.role === 'admin' || 
          user.app_metadata?.role === 'admin'
        );

        return adminUsers.length > 0;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Erro ao verificar usuários admin:', error);
      return false;
    }
  }

  /**
   * Cria o usuário admin padrão
   */
  static async createDefaultAdmin(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Criando usuário admin padrão...');

      // Primeiro, verificar se já existe
      const hasAdmin = await this.hasAdminUser();
      if (hasAdmin) {
        return {
          success: true,
          message: 'Usuário admin já existe no sistema'
        };
      }

      // Criar usuário no Supabase Auth
      const { data, error } = await supabase.auth.admin.createUser({
        email: this.DEFAULT_ADMIN.email,
        password: this.DEFAULT_ADMIN.password,
        email_confirm: true, // Confirmar email automaticamente
        user_metadata: {
          full_name: this.DEFAULT_ADMIN.fullName,
          role: this.DEFAULT_ADMIN.role
        },
        app_metadata: {
          role: this.DEFAULT_ADMIN.role,
          permissions: ['*'] // Acesso total
        }
      });

      if (error) {
        console.error('Erro ao criar usuário admin:', error);
        
        // Se não conseguiu criar via admin, tentar via signup normal
        const signUpResult = await AuthService.signUp({
          email: this.DEFAULT_ADMIN.email,
          password: this.DEFAULT_ADMIN.password,
          fullName: this.DEFAULT_ADMIN.fullName,
          metadata: {
            role: this.DEFAULT_ADMIN.role,
            permissions: ['*']
          }
        });

        if (signUpResult.error) {
          return {
            success: false,
            message: `Erro ao criar admin: ${signUpResult.error}`
          };
        }

        return {
          success: true,
          message: 'Usuário admin criado com sucesso via signup'
        };
      }

      // Tentar inserir na tabela users se existir
      try {
        await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: this.DEFAULT_ADMIN.email,
            name: this.DEFAULT_ADMIN.fullName,
            role: this.DEFAULT_ADMIN.role,
            permissions: ['*'],
            active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      } catch (insertError) {
        console.log('Tabela users não existe ainda, usuário criado apenas no auth');
      }

      return {
        success: true,
        message: 'Usuário admin padrão criado com sucesso!'
      };

    } catch (error) {
      console.error('Erro inesperado ao criar admin:', error);
      return {
        success: false,
        message: `Erro inesperado: ${error}`
      };
    }
  }

  /**
   * Configura o sistema para primeiro uso
   */
  static async initializeSystem(): Promise<{ success: boolean; message: string; adminCreated: boolean }> {
    try {
      console.log('Inicializando sistema...');

      // Verificar se há admin
      const hasAdmin = await this.hasAdminUser();
      
      if (hasAdmin) {
        return {
          success: true,
          message: 'Sistema já inicializado com usuário admin',
          adminCreated: false
        };
      }

      // Criar admin padrão
      const adminResult = await this.createDefaultAdmin();
      
      return {
        success: adminResult.success,
        message: adminResult.message,
        adminCreated: adminResult.success
      };

    } catch (error) {
      console.error('Erro na inicialização do sistema:', error);
      return {
        success: false,
        message: `Erro na inicialização: ${error}`,
        adminCreated: false
      };
    }
  }

  /**
   * Obter credenciais do admin padrão (para exibição)
   */
  static getDefaultAdminCredentials(): { email: string; password: string } {
    return {
      email: this.DEFAULT_ADMIN.email,
      password: this.DEFAULT_ADMIN.password
    };
  }

  /**
   * Verificar se o usuário logado é o admin padrão
   */
  static async isDefaultAdmin(email?: string): Promise<boolean> {
    if (!email) {
      const user = await AuthService.getCurrentUser();
      email = user?.email;
    }
    
    return email === this.DEFAULT_ADMIN.email;
  }

  /**
   * Forçar criação do admin (para desenvolvimento)
   */
  static async forceCreateAdmin(): Promise<{ success: boolean; message: string }> {
    try {
      // Tentar deletar admin existente primeiro
      try {
        const { data: users } = await supabase.auth.admin.listUsers();
        const existingAdmin = users.users.find(u => u.email === this.DEFAULT_ADMIN.email);
        
        if (existingAdmin) {
          await supabase.auth.admin.deleteUser(existingAdmin.id);
          console.log('Admin existente removido');
        }
      } catch (deleteError) {
        console.log('Erro ao remover admin existente:', deleteError);
      }

      // Criar novo admin
      return await this.createDefaultAdmin();
    } catch (error) {
      console.error('Erro ao forçar criação do admin:', error);
      return {
        success: false,
        message: `Erro: ${error}`
      };
    }
  }
}

export default SetupService; 