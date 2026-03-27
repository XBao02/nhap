// utils/performanceUtils.ts
import { DebugUtils } from "./debugUtils";

export class PerformanceMonitor {
  private static timers: Map<string, number> = new Map();
  private static metrics: Array<{
    operation: string;
    duration: number;
    timestamp: Date;
  }> = [];

  static startTimer(operation: string) {
    this.timers.set(operation, Date.now());
  }

  static endTimer(operation: string) {
    const startTime = this.timers.get(operation);
    if (!startTime) {
      console.warn(`Timer for operation '${operation}' was not started`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.timers.delete(operation);

    this.metrics.push({
      operation,
      duration,
      timestamp: new Date(),
    });

    // Keep only last 500 metrics
    if (this.metrics.length > 500) {
      this.metrics = this.metrics.slice(-500);
    }

    DebugUtils.log('info', `Performance: ${operation} took ${duration}ms`);
    return duration;
  }

  static getMetrics() {
    return [...this.metrics];
  }

  static getAverageTime(operation: string): number {
    const operationMetrics = this.metrics.filter(m => m.operation === operation);
    if (operationMetrics.length === 0) return 0;

    const total = operationMetrics.reduce((sum, m) => sum + m.duration, 0);
    return Math.round(total / operationMetrics.length);
  }

  static getSlowestOperations(count = 10) {
    return [...this.metrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, count);
  }
}

// ==================== EXAMPLE USAGE ====================

/*
// In your component:
import { useAppState, usePermissions } from '../hooks';
import { DebugUtils, PerformanceMonitor } from '../utils';

export const MyComponent = () => {
  const appState = useAppState();
  const permissions = usePermissions();

  useEffect(() => {
    PerformanceMonitor.startTimer('component_render');
    return () => {
      PerformanceMonitor.endTimer('component_render');
    };
  }, []);

  if (!appState.isAppReady) {
    return <LoadingScreen />;
  }

  if (!permissions.canAccessPOS) {
    return <UnauthorizedScreen />;
  }

  return (
    <View>
      <Text>Welcome, {appState.currentUser?.userId}</Text>
      {__DEV__ && (
        <Button 
          title="Export Debug Info" 
          onPress={async () => {
            const debugInfo = await DebugUtils.getSystemInfo();
            console.log('Debug Info:', debugInfo);
          }}
        />
      )}
    </View>
  );
};

// In your test files:
import { TestUtils } from '../utils/testUtils';

describe('App Initialization', () => {
  beforeEach(async () => {
    await TestUtils.setupMockInitialization('fresh');
  });

  afterEach(() => {
    TestUtils.resetMocks();
  });

  it('should handle fresh installation', async () => {
    const initTime = await TestUtils.measureInitializationTime();
    expect(initTime).toBeLessThan(5000); // Should complete within 5 seconds
  });

  it('should handle storage errors gracefully', async () => {
    await TestUtils.simulateError('storage');
    // Test error handling
  });
});
*/