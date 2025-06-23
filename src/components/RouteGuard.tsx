import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';

interface RouteGuardProps {
  children: React.ReactNode;
  requiredRole?: string;
  requiredPermissions?: string[];
  requireAnyPermission?: boolean;
  redirectTo?: string;
}

export const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  requiredRole,
  requiredPermissions = [],
  requireAnyPermission = false,
  redirectTo = '/'
}) => {
  const { canAccess } = usePermissions();

  const hasAccess = canAccess({
    requiredRole,
    requiredPermissions,
    requireAnyPermission
  });

  if (!hasAccess) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default RouteGuard; 