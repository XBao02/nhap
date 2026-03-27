// hooks/usePermissions.ts
import { useMemo } from 'react';
import { useAppState } from './useAppState';

export const usePermissions = () => {
  const { userRoles, isAuthenticated } = useAppState();

  const permissions = useMemo(() => {
    if (!isAuthenticated || !userRoles.length) {
      return {
        canAccessPOS: false,
        canManageUsers: false,
        canViewReports: false,
        canManageStore: false,
        canAccessAccounting: false,
      };
    }

    const hasRole = (roles: string[]) => 
      roles.some(role => userRoles.includes(role));

    return {
      canAccessPOS: hasRole(['employee', 'manager', 'owner', 'admin_store']),
      canManageUsers: hasRole(['manager', 'owner', 'admin_store', 'admin_enterprise']),
      canViewReports: hasRole(['manager', 'owner', 'accountant', 'admin_store', 'admin_enterprise']),
      canManageStore: hasRole(['owner', 'admin_store', 'admin_enterprise']),
      canAccessAccounting: hasRole(['accountant', 'owner', 'admin_enterprise']),
      canManageSystem: hasRole(['admin_enterprise']),
    };
  }, [userRoles, isAuthenticated]);

  return permissions;
};