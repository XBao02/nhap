// guards/PermissionGuard.tsx
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

export interface PermissionGuardProps {
  children?: React.ReactNode;
  component?: React.ComponentType<any>; // Thêm prop component
  requiredRoles?: string[];
  requiredPermissions?: string[];
  fallback?: React.ComponentType<{message: string}>;
  allowEmpty?: boolean;
  // các thiết lập cho guard
  requireSetup?: boolean;
  requireAuth?: boolean;
  requireDatabase?: boolean;
}

const DefaultFallback: React.FC<{message: string}> = ({message}) => (
  <View style={permissionStyles.container}>
    <Text style={permissionStyles.icon}>🚫</Text>
    <Text style={permissionStyles.message}>{message}</Text>
  </View>
);

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  component: Component, // Destructure component prop
  requiredRoles = [],
  requiredPermissions = [],
  fallback: FallbackComponent = DefaultFallback,
  allowEmpty = false,
}) => {
  
  // No requirements and allowEmpty is true
  if (
    allowEmpty &&
    requiredRoles.length === 0 &&
    requiredPermissions.length === 0
  ) {
    // Render component or children
    return Component ? <Component /> : <>{children}</>;
  }

  /* // No user session
  if (!userSession) {
    return <FallbackComponent message="Authentication required" />;
  }

  // Check role requirements
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role =>
      userSession.roles.includes(role),
    );
    if (!hasRequiredRole) {
      return (
        <FallbackComponent
          message={`Required roles: ${requiredRoles.join(', ')}`}
        />
      );
    }
  } */

  // TODO: Implement permission checking when permission system is ready
  // Check permission requirements
  if (requiredPermissions.length > 0) {
    // This would integrate with your permission service
    console.warn('Permission checking not yet implemented');
  }

  // All checks passed - render component or children
  return Component ? <Component /> : <>{children}</>;
};

const permissionStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});
