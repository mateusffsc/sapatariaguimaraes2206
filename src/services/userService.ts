import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export interface SystemUser {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'employee' | 'user';
  department?: string;
  phone?: string;
  active: boolean;
  permissions: string[];
  created_at: string;
  updated_at: string;
  last_login?: string;
  auth_user_id?: string;
}

export interface CreateUserData {
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'employee' | 'user';
  department?: string;
  phone?: string;
  permissions: string[];
  active?: boolean;
}

export interface UpdateUserData {
  full_name?: string;
  role?: 'admin' | 'manager' | 'employee' | 'user';
  department?: string;
  phone?: string;
  permissions?: string[];
  active?: boolean;
}

export interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  level: number;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  resource: string;
  action: string;
}

export class UserService {
  // ==================== CRUD USUÁRIOS ====================

  /**
   * Criar novo usuário
   */
  static async createUser(userData: CreateUserData): Promise<SystemUser> {
    try {
      const { data, error } = await supabase
        .from('system_users')
        .insert([{
          email: userData.email,
          full_name: userData.full_name,
          role: userData.role,
          department: userData.department,
          phone: userData.phone,
          permissions: userData.permissions,
          active: userData.active ?? true
        }])
        .select('*')
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw new Error(`Falha ao criar usuário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Listar todos os usuários
   */
  static async listUsers(): Promise<SystemUser[]> {
    try {
      const { data, error } = await supabase
        .from('system_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      throw new Error(`Falha ao listar usuários: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Obter usuário por ID
   */
  static async getUserById(id: string): Promise<SystemUser | null> {
    try {
      const { data, error } = await supabase
        .from('system_users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao obter usuário:', error);
      throw new Error(`Falha ao obter usuário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Obter usuário por email
   */
  static async getUserByEmail(email: string): Promise<SystemUser | null> {
    try {
      const { data, error } = await supabase
        .from('system_users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao obter usuário por email:', error);
      throw new Error(`Falha ao obter usuário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Atualizar usuário
   */
  static async updateUser(id: string, userData: UpdateUserData): Promise<SystemUser> {
    try {
      const { data, error } = await supabase
        .from('system_users')
        .update({
          ...userData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw new Error(`Falha ao atualizar usuário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Deletar usuário
   */
  static async deleteUser(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('system_users')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      throw new Error(`Falha ao deletar usuário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Ativar/Desativar usuário
   */
  static async toggleUserStatus(id: string, active: boolean): Promise<SystemUser> {
    try {
      const { data, error } = await supabase
        .from('system_users')
        .update({
          active,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Erro ao alterar status do usuário:', error);
      throw new Error(`Falha ao alterar status: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // ==================== PERMISSÕES ====================

  /**
   * Obter todas as permissões disponíveis
   */
  static getAvailablePermissions(): Permission[] {
    return [
      // Dashboard
      { id: 'dashboard.view', name: 'Ver Dashboard', description: 'Visualizar dashboard principal', category: 'Dashboard', resource: 'dashboard', action: 'view' },
      { id: 'dashboard.analytics', name: 'Ver Analytics', description: 'Visualizar métricas e gráficos', category: 'Dashboard', resource: 'dashboard', action: 'analytics' },
      
      // Clientes
      { id: 'clients.view', name: 'Ver Clientes', description: 'Visualizar lista de clientes', category: 'Clientes', resource: 'clients', action: 'view' },
      { id: 'clients.create', name: 'Criar Clientes', description: 'Cadastrar novos clientes', category: 'Clientes', resource: 'clients', action: 'create' },
      { id: 'clients.edit', name: 'Editar Clientes', description: 'Modificar dados de clientes', category: 'Clientes', resource: 'clients', action: 'edit' },
      { id: 'clients.delete', name: 'Excluir Clientes', description: 'Remover clientes do sistema', category: 'Clientes', resource: 'clients', action: 'delete' },
      
      // Ordens de Serviço
      { id: 'orders.view', name: 'Ver OS', description: 'Visualizar ordens de serviço', category: 'Ordens de Serviço', resource: 'orders', action: 'view' },
      { id: 'orders.create', name: 'Criar OS', description: 'Criar novas ordens de serviço', category: 'Ordens de Serviço', resource: 'orders', action: 'create' },
      { id: 'orders.edit', name: 'Editar OS', description: 'Modificar ordens de serviço', category: 'Ordens de Serviço', resource: 'orders', action: 'edit' },
      { id: 'orders.delete', name: 'Excluir OS', description: 'Remover ordens de serviço', category: 'Ordens de Serviço', resource: 'orders', action: 'delete' },
      { id: 'orders.complete', name: 'Finalizar OS', description: 'Marcar OS como concluída', category: 'Ordens de Serviço', resource: 'orders', action: 'complete' },
      
      // Vendas
      { id: 'sales.view', name: 'Ver Vendas', description: 'Visualizar vendas realizadas', category: 'Vendas', resource: 'sales', action: 'view' },
      { id: 'sales.create', name: 'Realizar Vendas', description: 'Registrar novas vendas', category: 'Vendas', resource: 'sales', action: 'create' },
      { id: 'sales.edit', name: 'Editar Vendas', description: 'Modificar vendas existentes', category: 'Vendas', resource: 'sales', action: 'edit' },
      { id: 'sales.delete', name: 'Excluir Vendas', description: 'Remover vendas do sistema', category: 'Vendas', resource: 'sales', action: 'delete' },
      
      // Financeiro
      { id: 'finance.view', name: 'Ver Financeiro', description: 'Visualizar dados financeiros', category: 'Financeiro', resource: 'finance', action: 'view' },
      { id: 'finance.manage', name: 'Gerenciar Financeiro', description: 'Gerir movimentações financeiras', category: 'Financeiro', resource: 'finance', action: 'manage' },
      { id: 'finance.reports', name: 'Relatórios Financeiros', description: 'Gerar relatórios financeiros', category: 'Financeiro', resource: 'finance', action: 'reports' },
      
      // Estoque
      { id: 'inventory.view', name: 'Ver Estoque', description: 'Visualizar produtos em estoque', category: 'Estoque', resource: 'inventory', action: 'view' },
      { id: 'inventory.manage', name: 'Gerenciar Estoque', description: 'Controlar entradas e saídas', category: 'Estoque', resource: 'inventory', action: 'manage' },
      { id: 'inventory.adjust', name: 'Ajustar Estoque', description: 'Fazer ajustes de estoque', category: 'Estoque', resource: 'inventory', action: 'adjust' },
      
      // Configurações
      { id: 'settings.view', name: 'Ver Configurações', description: 'Visualizar configurações do sistema', category: 'Configurações', resource: 'settings', action: 'view' },
      { id: 'settings.edit', name: 'Editar Configurações', description: 'Modificar configurações', category: 'Configurações', resource: 'settings', action: 'edit' },
      
      // Usuários
      { id: 'users.view', name: 'Ver Usuários', description: 'Visualizar lista de usuários', category: 'Usuários', resource: 'users', action: 'view' },
      { id: 'users.create', name: 'Criar Usuários', description: 'Cadastrar novos usuários', category: 'Usuários', resource: 'users', action: 'create' },
      { id: 'users.edit', name: 'Editar Usuários', description: 'Modificar dados de usuários', category: 'Usuários', resource: 'users', action: 'edit' },
      { id: 'users.delete', name: 'Excluir Usuários', description: 'Remover usuários do sistema', category: 'Usuários', resource: 'users', action: 'delete' },
      { id: 'users.permissions', name: 'Gerenciar Permissões', description: 'Definir permissões de usuários', category: 'Usuários', resource: 'users', action: 'permissions' },
    ];
  }

  /**
   * Obter permissões por categoria
   */
  static getPermissionsByCategory(): Record<string, Permission[]> {
    const permissions = this.getAvailablePermissions();
    
    return permissions.reduce((acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = [];
      }
      acc[permission.category].push(permission);
      return acc;
    }, {} as Record<string, Permission[]>);
  }

  /**
   * Atualizar permissões do usuário
   */
  static async updateUserPermissions(userId: string, permissions: string[]): Promise<SystemUser> {
    try {
      const { data, error } = await supabase
        .from('system_users')
        .update({
          permissions,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select('*')
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Erro ao atualizar permissões:', error);
      throw new Error(`Falha ao atualizar permissões: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // ==================== ROLES ====================

  /**
   * Obter todos os roles disponíveis
   */
  static getAvailableRoles(): UserRole[] {
    return [
      {
        id: 'user',
        name: 'user',
        description: 'Usuário básico com acesso limitado',
        level: 1,
        permissions: [
          'dashboard.view',
          'clients.view',
          'orders.view',
          'sales.view'
        ]
      },
      {
        id: 'employee',
        name: 'employee',
        description: 'Funcionário com acesso a operações básicas',
        level: 2,
        permissions: [
          'dashboard.view',
          'clients.view', 'clients.create', 'clients.edit',
          'orders.view', 'orders.create', 'orders.edit', 'orders.complete',
          'sales.view', 'sales.create', 'sales.edit',
          'inventory.view'
        ]
      },
      {
        id: 'manager',
        name: 'manager',
        description: 'Gerente com acesso amplo ao sistema',
        level: 3,
        permissions: [
          'dashboard.view', 'dashboard.analytics',
          'clients.view', 'clients.create', 'clients.edit', 'clients.delete',
          'orders.view', 'orders.create', 'orders.edit', 'orders.delete', 'orders.complete',
          'sales.view', 'sales.create', 'sales.edit', 'sales.delete',
          'finance.view', 'finance.manage', 'finance.reports',
          'inventory.view', 'inventory.manage', 'inventory.adjust',
          'settings.view', 'settings.edit',
          'users.view', 'users.create', 'users.edit'
        ]
      },
      {
        id: 'admin',
        name: 'admin',
        description: 'Administrador com acesso total',
        level: 4,
        permissions: [] // Admin tem todas as permissões
      }
    ];
  }

  /**
   * Obter permissões padrão para um role
   */
  static getDefaultPermissionsForRole(role: string): string[] {
    const roles = this.getAvailableRoles();
    const foundRole = roles.find(r => r.name === role);
    
    if (role === 'admin') {
      // Admin tem todas as permissões
      return this.getAvailablePermissions().map(p => p.id);
    }
    
    return foundRole?.permissions || [];
  }

  // ==================== ESTATÍSTICAS ====================

  /**
   * Obter estatísticas dos usuários (mock para desenvolvimento)
   */
  static async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byRole: Record<string, number>;
    byDepartment: Record<string, number>;
    recentLogins: number;
  }> {
    try {
      // Mock data para desenvolvimento
      return {
        total: 8,
        active: 6,
        inactive: 2,
        byRole: {
          'admin': 1,
          'manager': 2,
          'employee': 4,
          'user': 1
        },
        byDepartment: {
          'Administração': 2,
          'Vendas': 3,
          'Técnico': 2,
          'Financeiro': 1
        },
        recentLogins: 5
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      throw new Error(`Falha ao obter estatísticas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // ==================== VALIDAÇÕES ====================

  /**
   * Verificar se email está disponível
   */
  static async isEmailAvailable(email: string, excludeId?: string): Promise<boolean> {
    try {
      // Mock para desenvolvimento - sempre disponível exceto alguns emails
      const reservedEmails = ['admin@sapataria.com', 'gerente@sapataria.com'];
      
      if (reservedEmails.includes(email.toLowerCase())) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao verificar email:', error);
      return false;
    }
  }

  /**
   * Validar permissões do usuário
   */
  static validateUserPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
    try {
      // Admin tem todas as permissões
      if (userPermissions.includes('admin')) {
        return true;
      }

      // Verificar se o usuário tem todas as permissões necessárias
      return requiredPermissions.every(permission => 
        userPermissions.includes(permission)
      );
    } catch (error) {
      console.error('Erro ao validar permissões:', error);
      return false;
    }
  }

  // ==================== UTILITÁRIOS ====================

  /**
   * Obter label do role
   */
  static getRoleLabel(role: string): string {
    const roles = {
      'admin': 'Administrador',
      'manager': 'Gerente',
      'employee': 'Funcionário',
      'user': 'Usuário'
    };
    return roles[role as keyof typeof roles] || 'Usuário';
  }

  /**
   * Obter cor do role
   */
  static getRoleColor(role: string): string {
    const colors = {
      'admin': 'destructive',
      'manager': 'default',
      'employee': 'secondary',
      'user': 'outline'
    };
    return colors[role as keyof typeof colors] || 'outline';
  }

  /**
   * Verificar se role tem nível suficiente
   */
  static hasRoleLevel(userRole: string, requiredRole: string): boolean {
    const roleLevels = {
      'user': 1,
      'employee': 2,
      'manager': 3,
      'admin': 4
    };

    const userLevel = roleLevels[userRole as keyof typeof roleLevels] || 0;
    const requiredLevel = roleLevels[requiredRole as keyof typeof roleLevels] || 0;

    return userLevel >= requiredLevel;
  }

  /**
   * Obter dados mock para desenvolvimento
   */
  static getMockUsers(): SystemUser[] {
    return [
      {
        id: '1',
        email: 'admin@sapataria.com',
        full_name: 'João Silva',
        role: 'admin',
        department: 'Administração',
        phone: '(11) 99999-9999',
        active: true,
        permissions: this.getDefaultPermissionsForRole('admin'),
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-15T14:30:00Z',
        last_login: '2024-01-15T14:30:00Z'
      },
      {
        id: '2',
        email: 'gerente@sapataria.com',
        full_name: 'Maria Santos',
        role: 'manager',
        department: 'Vendas',
        phone: '(11) 88888-8888',
        active: true,
        permissions: this.getDefaultPermissionsForRole('manager'),
        created_at: '2024-01-02T09:00:00Z',
        updated_at: '2024-01-14T16:00:00Z',
        last_login: '2024-01-14T16:00:00Z'
      },
      {
        id: '3',
        email: 'funcionario1@sapataria.com',
        full_name: 'Pedro Oliveira',
        role: 'employee',
        department: 'Técnico',
        phone: '(11) 77777-7777',
        active: true,
        permissions: this.getDefaultPermissionsForRole('employee'),
        created_at: '2024-01-03T08:00:00Z',
        updated_at: '2024-01-13T17:00:00Z',
        last_login: '2024-01-13T17:00:00Z'
      },
      {
        id: '4',
        email: 'funcionario2@sapataria.com',
        full_name: 'Ana Costa',
        role: 'employee',
        department: 'Vendas',
        phone: '(11) 66666-6666',
        active: true,
        permissions: this.getDefaultPermissionsForRole('employee'),
        created_at: '2024-01-04T10:30:00Z',
        updated_at: '2024-01-12T15:45:00Z',
        last_login: '2024-01-12T15:45:00Z'
      },
      {
        id: '5',
        email: 'usuario@sapataria.com',
        full_name: 'Carlos Pereira',
        role: 'user',
        department: 'Financeiro',
        phone: '(11) 55555-5555',
        active: false,
        permissions: this.getDefaultPermissionsForRole('user'),
        created_at: '2024-01-05T11:00:00Z',
        updated_at: '2024-01-10T18:00:00Z',
        last_login: '2024-01-10T18:00:00Z'
      }
    ];
  }
} 