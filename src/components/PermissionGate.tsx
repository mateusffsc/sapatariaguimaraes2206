import React from 'react';
import { usePermissions } from '../hooks/usePermissions';

interface PermissionGateProps {
  children: React.ReactNode;
  requiredRole?: string;
  requiredPermissions?: string[];
  requireAnyPermission?: boolean;
  fallback?: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  requiredRole,
  requiredPermissions = [],
  requireAnyPermission = false,
  fallback = null
}) => {
  const { canAccess } = usePermissions();

  const hasAccess = canAccess({
    requiredRole,
    requiredPermissions,
    requireAnyPermission
  });

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default PermissionGate; 