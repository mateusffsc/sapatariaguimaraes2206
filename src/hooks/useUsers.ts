import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserService, type SystemUser, type CreateUserData, type UpdateUserData } from '../services/userService';
import { toast } from './use-toast';

// ==================== HOOKS PRINCIPAIS ====================

export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      // Para desenvolvimento, usar dados mock
      return UserService.getMockUsers();
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

export const useUser = (userId: string) => {
  return useQuery({
    queryKey: ['users', userId],
    queryFn: async () => {
      const users = UserService.getMockUsers();
      return users.find(u => u.id === userId) || null;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUserStats = () => {
  return useQuery({
    queryKey: ['users', 'stats'],
    queryFn: () => UserService.getUserStats(),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
};

// ==================== MUTATIONS ====================

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: CreateUserData) => {
      // Validar email
      const isEmailAvailable = await UserService.isEmailAvailable(userData.email);
      if (!isEmailAvailable) {
        throw new Error('Este email já está em uso');
      }

      // Mock para desenvolvimento
      const newUser: SystemUser = {
        id: Date.now().toString(),
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
        department: userData.department,
        phone: userData.phone,
        active: userData.active ?? true,
        permissions: userData.permissions,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      return newUser;
    },
    onSuccess: (newUser) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'stats'] });
      toast({
        title: "Usuário criado com sucesso!",
        description: `${newUser.full_name} foi adicionado ao sistema.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar usuário",
        description: error.message,
        variant: "destructive",
      });
    }
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, userData }: { id: string; userData: UpdateUserData }) => {
      // Mock para desenvolvimento
      const users = UserService.getMockUsers();
      const user = users.find(u => u.id === id);
      
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      if (userData.full_name && userData.full_name !== user.email) {
        const isEmailAvailable = await UserService.isEmailAvailable(userData.full_name, id);
        if (!isEmailAvailable) {
          throw new Error('Este email já está em uso');
        }
      }

      const updatedUser: SystemUser = {
        ...user,
        ...userData,
        updated_at: new Date().toISOString()
      };

      return updatedUser;
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', updatedUser.id] });
      queryClient.invalidateQueries({ queryKey: ['users', 'stats'] });
      toast({
        title: "Usuário atualizado com sucesso!",
        description: `As informações de ${updatedUser.full_name} foram atualizadas.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar usuário",
        description: error.message,
        variant: "destructive",
      });
    }
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      // Mock para desenvolvimento
      const users = UserService.getMockUsers();
      const user = users.find(u => u.id === userId);
      
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      if (user.role === 'admin') {
        throw new Error('Não é possível excluir um administrador');
      }

      return { id: userId, name: user.full_name };
    },
    onSuccess: (deletedUser) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'stats'] });
      toast({
        title: "Usuário excluído com sucesso!",
        description: `${deletedUser.name} foi removido do sistema.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir usuário",
        description: error.message,
        variant: "destructive",
      });
    }
  });
};

export const useToggleUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, active }: { userId: string; active: boolean }) => {
      // Mock para desenvolvimento
      const users = UserService.getMockUsers();
      const user = users.find(u => u.id === userId);
      
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      if (user.role === 'admin' && !active) {
        throw new Error('Não é possível desativar um administrador');
      }

      const updatedUser: SystemUser = {
        ...user,
        active,
        updated_at: new Date().toISOString()
      };

      return updatedUser;
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', updatedUser.id] });
      queryClient.invalidateQueries({ queryKey: ['users', 'stats'] });
      
      const status = updatedUser.active ? 'ativado' : 'desativado';
      toast({
        title: `Usuário ${status} com sucesso!`,
        description: `${updatedUser.full_name} foi ${status}.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao alterar status",
        description: error.message,
        variant: "destructive",
      });
    }
  });
};

export const useUpdateUserPermissions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, permissions }: { userId: string; permissions: string[] }) => {
      // Mock para desenvolvimento
      const users = UserService.getMockUsers();
      const user = users.find(u => u.id === userId);
      
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      const updatedUser: SystemUser = {
        ...user,
        permissions,
        updated_at: new Date().toISOString()
      };

      return updatedUser;
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', updatedUser.id] });
      toast({
        title: "Permissões atualizadas!",
        description: `As permissões de ${updatedUser.full_name} foram atualizadas.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar permissões",
        description: error.message,
        variant: "destructive",
      });
    }
  });
};

// ==================== HOOKS DE PERMISSÕES ====================

export const usePermissions = () => {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: () => UserService.getAvailablePermissions(),
    staleTime: 30 * 60 * 1000, // 30 minutos
  });
};

export const usePermissionsByCategory = () => {
  return useQuery({
    queryKey: ['permissions', 'by-category'],
    queryFn: () => UserService.getPermissionsByCategory(),
    staleTime: 30 * 60 * 1000,
  });
};

export const useRoles = () => {
  return useQuery({
    queryKey: ['roles'],
    queryFn: () => UserService.getAvailableRoles(),
    staleTime: 30 * 60 * 1000,
  });
};

// ==================== HOOKS DE VALIDAÇÃO ====================

export const useEmailValidation = () => {
  return useMutation({
    mutationFn: async ({ email, excludeId }: { email: string; excludeId?: string }) => {
      return await UserService.isEmailAvailable(email, excludeId);
    }
  });
};

// ==================== HOOKS UTILITÁRIOS ====================

export const useUserFilters = (users: SystemUser[]) => {
  return {
    filterByRole: (role: string) => users.filter(u => u.role === role),
    filterByStatus: (active: boolean) => users.filter(u => u.active === active),
    filterByDepartment: (department: string) => users.filter(u => u.department === department),
    searchByName: (searchTerm: string) => 
      users.filter(u => 
        u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    sortByName: () => [...users].sort((a, b) => a.full_name.localeCompare(b.full_name)),
    sortByRole: () => [...users].sort((a, b) => {
      const roleOrder = { admin: 4, manager: 3, employee: 2, user: 1 };
      return (roleOrder[b.role] || 0) - (roleOrder[a.role] || 0);
    }),
    sortByCreatedAt: () => [...users].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ),
  };
};

export const useUserPermissionCheck = (userPermissions: string[]) => {
  return {
    hasPermission: (permission: string) => {
      // Admin tem todas as permissões
      if (userPermissions.includes('admin')) return true;
      return userPermissions.includes(permission);
    },
    hasAnyPermission: (permissions: string[]) => {
      if (userPermissions.includes('admin')) return true;
      return permissions.some(p => userPermissions.includes(p));
    },
    hasAllPermissions: (permissions: string[]) => {
      if (userPermissions.includes('admin')) return true;
      return permissions.every(p => userPermissions.includes(p));
    }
  };
}; 