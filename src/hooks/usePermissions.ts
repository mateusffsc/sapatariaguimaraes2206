import { useAuth } from './useAuth';
import { useUsers } from './useUsers';
import { UserService } from '../services/userService';

export const usePermissions = () => {
  const { user: authUser, isAuthenticated } = useAuth();
  const { data: users = [] } = useUsers();

  // MOCK TEMPORÁRIO - usuário com todas as permissões
  const mockUser = authUser ? {
    id: authUser.id,
    email: authUser.email,
    full_name: authUser.fullName,
    role: 'admin',
    permissions: ['*'], // Todas as permissões
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  } : null;

  // Usar usuário mock temporariamente
  const user = mockUser;

  const hasPermission = (permission: string): boolean => {
    if (!isAuthenticated || !user) return false;
    
    // Admins têm todas as permissões
    if (user.role === 'admin') return true;
    
    // Verificar se tem a permissão específica
    return user.permissions?.includes(permission) || false;
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!isAuthenticated || !user) return false;
    
    // Admins têm todas as permissões
    if (user.role === 'admin') return true;
    
    // Verificar se tem pelo menos uma das permissões
    return permissions.some(permission => 
      user.permissions?.includes(permission) || false
    );
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!isAuthenticated || !user) return false;
    
    // Admins têm todas as permissões
    if (user.role === 'admin') return true;
    
    // Verificar se tem todas as permissões
    return permissions.every(permission => 
      user.permissions?.includes(permission) || false
    );
  };

  const hasRoleLevel = (requiredRole: string): boolean => {
    if (!isAuthenticated || !user) return false;
    
    return UserService.hasRoleLevel(user.role || '', requiredRole);
  };

  const canAccess = (options: {
    requiredRole?: string;
    requiredPermissions?: string[];
    requireAnyPermission?: boolean;
  }): boolean => {
    const { requiredRole, requiredPermissions = [], requireAnyPermission = false } = options;

    // Verificar role se necessário
    if (requiredRole && !hasRoleLevel(requiredRole)) {
      return false;
    }

    // Verificar permissões se necessário
    if (requiredPermissions.length > 0) {
      if (requireAnyPermission) {
        return hasAnyPermission(requiredPermissions);
      } else {
        return hasAllPermissions(requiredPermissions);
      }
    }

    return true;
  };

  return {
    user,
    isAuthenticated,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRoleLevel,
    canAccess,
    role: user?.role || authUser?.role || '',
    permissions: user?.permissions || [],
    isAdmin: user?.role === 'admin' || authUser?.role === 'admin',
    isManager: UserService.hasRoleLevel(user?.role || authUser?.role || '', 'manager'),
    isEmployee: UserService.hasRoleLevel(user?.role || authUser?.role || '', 'employee')
  };
};

export default usePermissions; 