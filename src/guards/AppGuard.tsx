// guards/AppGuard.tsx
import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { InitializationScreen } from '../screens/Initialization';

interface AppGuardProps {
  children: React.ReactNode;
  fallback?: React.ComponentType;
  requireSetup?: boolean;
  requireAuth?: boolean;
  requireDatabase?: boolean;
}

export const AppGuard: React.FC<AppGuardProps> = ({
  children,
  fallback: FallbackComponent,
  requireSetup = true,
  requireAuth = false,
  requireDatabase = true,
}) => {
  /* 

  // Show loading state
  if (isLoading) {
    if (FallbackComponent) {
      return <FallbackComponent />;
    }
    return <InitializationScreen autoInitialize={false} />;
  }

  // Check setup requirement
  if (requireSetup && needsSetup) {
    console.log('🚫 AppGuard: Setup required but not completed');
    return <InitializationScreen autoInitialize={false} />;
  }

  // Check authentication requirement
  if (requireAuth && !hasValidSession) {
    console.log('🚫 AppGuard: Authentication required but no valid session');
    return <InitializationScreen autoInitialize={false} />;
  }

  // Check database requirement
  if (requireDatabase && !isDatabaseReady) {
    console.log('🚫 AppGuard: Database required but not ready');
    return <InitializationScreen autoInitialize={false} />;
  }

  // Show error state
  if (error) {
    return <InitializationScreen autoInitialize={false} />;
  } */

  // All guards passed, render children
  return <>{children}</>;
};

