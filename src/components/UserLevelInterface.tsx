import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { useCurrentUser } from '@/hooks/useAuth';

interface UserLevelInterfaceProps {
  children: React.ReactNode;
  adminContent?: React.ReactNode;
  managerContent?: React.ReactNode;
  employeeContent?: React.ReactNode;
  fallbackContent?: React.ReactNode;
}

interface RoleBasedContentProps {
  userRole?: string;
  adminContent?: React.ReactNode;
  managerContent?: React.ReactNode;
  employeeContent?: React.ReactNode;
  fallbackContent?: React.ReactNode;
}

// Componente principal que personaliza a interface baseada no usuário
export const UserLevelInterface: React.FC<UserLevelInterfaceProps> = ({
  children,
  adminContent,
  managerContent,
  employeeContent,
  fallbackContent
}) => {
  const { user } = useCurrentUser();
  const { role } = usePermissions();

  // Se houver conteúdo específico para o papel do usuário, mostrar ele
  if (adminContent && role === 'admin') {
    return <>{adminContent}</>;
  }

  if (managerContent && role === 'manager') {
    return <>{managerContent}</>;
  }

  if (employeeContent && role === 'employee') {
    return <>{employeeContent}</>;
  }

  // Se não houver conteúdo específico, mostrar o conteúdo padrão
  if (fallbackContent && !user) {
    return <>{fallbackContent}</>;
  }

  return <>{children}</>;
};

// Componente para conteúdo baseado em papel específico
export const RoleBasedContent: React.FC<RoleBasedContentProps> = ({
  userRole,
  adminContent,
  managerContent,
  employeeContent,
  fallbackContent
}) => {
  switch (userRole) {
    case 'admin':
      return adminContent ? <>{adminContent}</> : null;
    case 'manager':
      return managerContent ? <>{managerContent}</> : null;
    case 'employee':
      return employeeContent ? <>{employeeContent}</> : null;
    default:
      return fallbackContent ? <>{fallbackContent}</> : null;
  }
};

// Hook para determinar o tema/estilo baseado no papel
export const useUserTheme = () => {
  const { role } = usePermissions();

  const getThemeColors = () => {
    switch (role) {
      case 'admin':
        return {
          primary: 'red',
          primaryHover: 'red',
          accent: 'red-50',
          border: 'red-200',
          text: 'red-900'
        };
      case 'manager':
        return {
          primary: 'blue',
          primaryHover: 'blue',
          accent: 'blue-50',
          border: 'blue-200',
          text: 'blue-900'
        };
      case 'employee':
        return {
          primary: 'green',
          primaryHover: 'green',
          accent: 'green-50',
          border: 'green-200',
          text: 'green-900'
        };
      default:
        return {
          primary: 'gray',
          primaryHover: 'gray',
          accent: 'gray-50',
          border: 'gray-200',
          text: 'gray-900'
        };
    }
  };

  const getRoleLabel = () => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'manager':
        return 'Gerente';
      case 'employee':
        return 'Funcionário';
      default:
        return 'Usuário';
    }
  };

  const getRoleIcon = () => {
    switch (role) {
      case 'admin':
        return '👑';
      case 'manager':
        return '📊';
      case 'employee':
        return '👤';
      default:
        return '❓';
    }
  };

  return {
    colors: getThemeColors(),
    roleLabel: getRoleLabel(),
    roleIcon: getRoleIcon(),
    role
  };
};

// Componente para mostrar indicador de papel do usuário
export const UserRoleIndicator: React.FC<{ 
  showIcon?: boolean; 
  showLabel?: boolean; 
  className?: string; 
}> = ({ 
  showIcon = true, 
  showLabel = true, 
  className = "" 
}) => {
  const { roleLabel, roleIcon, colors } = useUserTheme();

  return (
    <div className={`flex items-center space-x-1 px-2 py-1 rounded-full bg-${colors.accent} border border-${colors.border} ${className}`}>
      {showIcon && (
        <span className="text-xs">{roleIcon}</span>
      )}
      {showLabel && (
        <span className={`text-xs font-medium text-${colors.text}`}>
          {roleLabel}
        </span>
      )}
    </div>
  );
};

// Componente para esconder funcionalidades baseado no papel
export const FeatureByRole: React.FC<{
  allowedRoles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ allowedRoles, children, fallback }) => {
  const { role } = usePermissions();

  if (!role || !allowedRoles.includes(role)) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};

// Componente para customizar estatísticas por papel
export const RoleBasedStats: React.FC<{
  adminStats?: React.ReactNode;
  managerStats?: React.ReactNode;
  employeeStats?: React.ReactNode;
}> = ({ adminStats, managerStats, employeeStats }) => {
  const { role } = usePermissions();

  return (
    <RoleBasedContent
      userRole={role}
      adminContent={adminStats}
      managerContent={managerStats}
      employeeContent={employeeStats}
    />
  );
};

// Componente para ações específicas por papel
export const RoleBasedActions: React.FC<{
  adminActions?: React.ReactNode;
  managerActions?: React.ReactNode;
  employeeActions?: React.ReactNode;
}> = ({ adminActions, managerActions, employeeActions }) => {
  const { role } = usePermissions();

  return (
    <RoleBasedContent
      userRole={role}
      adminContent={adminActions}
      managerContent={managerActions}
      employeeContent={employeeActions}
    />
  );
}; 