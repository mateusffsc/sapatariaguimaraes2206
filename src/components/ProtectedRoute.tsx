import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../hooks/useAuth';
import { UserService } from '../services/userService';
import { Skeleton } from './ui/skeleton';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Shield, Lock, Home, ArrowLeft } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  requiredPermissions?: string[];
  requireAnyPermission?: boolean; // true = precisa de pelo menos uma; false = precisa de todas
  fallbackPath?: string;
  showFallbackUI?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredPermissions = [],
  requireAnyPermission = false,
  fallbackPath = '/login',
  showFallbackUI = true
}) => {
  const { 
    isAuthenticated, 
    user, 
    canAccess, 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions,
    role 
  } = usePermissions();
  const location = useLocation();
  const { isLoading: authLoading } = useAuth();

  // Loading será tratado pelo hook de permissões
  const isLoading = authLoading || (!isAuthenticated && !user);

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary animate-pulse" />
              </div>
              <div className="text-center space-y-2">
                <Skeleton className="h-4 w-32 mx-auto" />
                <Skeleton className="h-3 w-48 mx-auto" />
              </div>
              <div className="grid grid-cols-1 gap-2 w-full">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Redirecionar para login se não autenticado
  if (!isAuthenticated && !authLoading) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Verificar role se necessário
  if (requiredRole && !UserService.hasRoleLevel(role, requiredRole)) {
    if (!showFallbackUI) {
      return <Navigate to="/" replace />;
    }

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 text-destructive" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Acesso Negado</h2>
            <p className="text-muted-foreground mb-4">
              Você não tem o nível de acesso necessário para esta página.
            </p>
            <div className="space-y-2 mb-6">
                              <p className="text-sm text-muted-foreground">
                  Nível necessário: <span className="font-medium">{UserService.getRoleLabel(requiredRole)}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Seu nível: <span className="font-medium">{UserService.getRoleLabel(role)}</span>
                </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => window.history.back()} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button onClick={() => window.location.href = '/'} className="flex-1">
                <Home className="w-4 h-4 mr-2" />
                Início
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Verificar permissões se necessário
  if (requiredPermissions.length > 0) {
    const hasRequiredPermissions = requireAnyPermission
      ? hasAnyPermission(requiredPermissions)
      : hasAllPermissions(requiredPermissions);

    if (!hasRequiredPermissions) {
        if (!showFallbackUI) {
          return <Navigate to="/" replace />;
        }

        return (
          <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-destructive" />
                </div>
                <h2 className="text-lg font-semibold mb-2">Permissões Insuficientes</h2>
                <p className="text-muted-foreground mb-4">
                  Você não tem as permissões necessárias para acessar esta funcionalidade.
                </p>
                <div className="text-left bg-muted p-3 rounded-lg mb-4">
                  <p className="text-sm font-medium mb-2">Permissões necessárias:</p>
                  <ul className="text-xs space-y-1">
                    {requiredPermissions.map((permission) => {
                      const permissionData = UserService.getAvailablePermissions().find(p => p.id === permission);
                      const hasThisPermission = hasPermission(permission);
                      return (
                        <li key={permission} className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            hasThisPermission ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                          <span>{permissionData?.name || permission}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => window.history.back()} className="flex-1">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar
                  </Button>
                  <Button onClick={() => window.location.href = '/'} className="flex-1">
                    <Home className="w-4 h-4 mr-2" />
                    Início
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }
    }

  return <>{children}</>;
};

export default ProtectedRoute; 