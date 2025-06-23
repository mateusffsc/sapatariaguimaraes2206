
import React, { useEffect } from 'react';
import { Bell, Search, User, Menu, LogOut, Settings, Shield, Activity } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useAudit } from '../../hooks/useAudit';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { UserRoleIndicator } from '../UserLevelInterface';
import PermissionGate from '../PermissionGate';

interface HeaderProps {
  onMenuToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { user, signOut, isSigningOut } = useAuth();
  const { logView, logLogout } = useAudit();

  // Log de visualização da página quando o usuário acessa
  useEffect(() => {
    if (user) {
      logView('dashboard', undefined, { 
        page: window.location.pathname,
        timestamp: new Date().toISOString()
      });
    }
  }, [user, logView]);

  const handleLogout = async () => {
    try {
      // Registrar logout antes de sair
      if (user) {
        logLogout();
      }
      await signOut();
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleLabel = (role?: string) => {
    const roles = {
      'admin': 'Administrador',
      'manager': 'Gerente',
      'employee': 'Funcionário',
      'user': 'Usuário'
    };
    return roles[role as keyof typeof roles] || 'Usuário';
  };

  const getRoleColor = (role?: string) => {
    const colors = {
      'admin': 'destructive',
      'manager': 'default',
      'employee': 'secondary',
      'user': 'outline'
    };
    return colors[role as keyof typeof colors] || 'outline';
  };

  return (
    <header className="bg-white shadow-sm border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100"
          >
            <Menu size={20} />
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar clientes, OS, produtos..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-96"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="p-2 rounded-lg hover:bg-gray-100 relative">
            <Bell size={20} className="text-gray-600" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              3
            </span>
          </button>
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 h-auto p-2">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {getUserInitials(user.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="text-sm font-medium">{user.fullName}</p>
                    <div className="flex items-center space-x-1">
                      <UserRoleIndicator showIcon={true} showLabel={true} className="text-xs" />
                      {!user.emailConfirmed && (
                        <Badge variant="outline" className="text-xs">
                          Email não confirmado
                        </Badge>
                      )}
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.fullName}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Shield className="mr-2 h-4 w-4" />
                  Perfil
                </DropdownMenuItem>
                <PermissionGate requiredPermissions={['audit.view']} requiredRole="manager">
                  <DropdownMenuItem>
                    <Activity className="mr-2 h-4 w-4" />
                    Auditoria
                  </DropdownMenuItem>
                </PermissionGate>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  disabled={isSigningOut}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {isSigningOut ? 'Saindo...' : 'Sair'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User size={16} />
              </div>
              <div>
                <p className="text-sm font-medium">Carregando...</p>
                <p className="text-xs text-gray-500">Verificando acesso</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
