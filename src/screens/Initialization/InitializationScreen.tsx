import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useInitialization } from './hooks/useInitialization';
import { useLanguage } from '../../i18n';
import { useTheme } from '../../styles/ThemeContext';
import { isTablet } from '../../utils';

interface InitializationScreenProps {
  autoInitialize?: boolean;
}

export const InitializationScreen: React.FC<InitializationScreenProps> = ({
  autoInitialize = false,
}) => {
  console.log(`[InitializationScreen][render] Rendering InitializationScreen, autoInitialize: ${autoInitialize}`);
  const { t } = useLanguage();
  const { theme, isDark } = useTheme();
  console.log(`[InitializationScreen][render] Theme: isDark=${isDark}, background=${theme.background}, gradient=${JSON.stringify(theme.gradient)}`);
  const {
    // State
    isLoading,
    error,
    setupConfig,
    userSession,
    isDatabaseReady,
    databaseConnections,

    // Actions
    checkInitialization,
    retryInitialization,
    resetInitialization,

    // Computed
    progress,
    isReady,
    hasValidSession,
    needsSetup,
  } = useInitialization();
  console.log(`[InitializationScreen][render] Initialization state:`, {
    isLoading,
    error: !!error,
    setupConfig: !!setupConfig,
    userSession: !!userSession,
    isDatabaseReady,
    databaseConnections,
    progress: progress.progress,
    currentStep: progress.currentStep,
    isReady,
    hasValidSession,
    needsSetup,
  });

  // Auto-initialize on mount
  useEffect(() => {
    if (autoInitialize) {
      console.log(`[InitializationScreen][useEffect] Auto-initializing due to autoInitialize=true`);
      initializeApp();
    }
  }, [autoInitialize]);

  const initializeApp = async () => {
    console.log(`[InitializationScreen][initializeApp] Starting app initialization`);
    try {
      console.log(`[InitializationScreen][initializeApp] Running checkInitialization`);
      await checkInitialization();
      console.log(`[InitializationScreen][initializeApp] checkInitialization completed successfully`);
    } catch (migrationError) {
      console.warn(`[InitializationScreen][initializeApp] Migration failed:`, (migrationError as Error).stack);
      console.log(`[InitializationScreen][initializeApp] Retrying checkInitialization after migration failure`);
      await checkInitialization();
      console.log(`[InitializationScreen][initializeApp] Retry completed`);
    }
  };

  const handleRetry = () => {
    console.log(`[InitializationScreen][handleRetry] Triggering retryInitialization`);
    retryInitialization();
  };

  const handleReset = () => {
    console.log(`[InitializationScreen][handleReset] Showing reset confirmation alert`);
    Alert.alert(
      t('alert.reset_title'),
      t('alert.reset_message'),
      [
        {
          text: t('button.cancel'),
          style: 'cancel',
          onPress: () => console.log(`[InitializationScreen][handleReset] Reset cancelled`),
        },
        {
          text: t('button.reset'),
          style: 'destructive',
          onPress: () => {
            console.log(`[InitializationScreen][handleReset] Executing resetInitialization`);
            resetInitialization();
          },
        },
      ]
    );
  };

  const getStyles = () => {
    console.log(`[InitializationScreen][getStyles] Generating styles with theme`);
    return createStyles(theme, isDark);
  };

  const renderLoadingState = () => {
    console.log(`[InitializationScreen][renderLoadingState] Rendering loading state, progress: ${progress.progress}%`);
    const styles = getStyles();

    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator
          size="large"
          color={theme.primary}
        />

        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          <Text style={[styles.progressText, { color: theme.text }]}>
            {t('loading.initializing')} ({progress.progress}%)
          </Text>

          <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress.progress}%`,
                  backgroundColor: theme.primary,
                },
              ]}
            />
          </View>

          <Text style={[styles.stepText, { color: theme.textSecondary }]}>
            {t(`loading.step.${progress.currentStep}`)}
          </Text>
        </View>

        {/* Debug info (development only) */}
        {__DEV__ && (
          <View style={[styles.debugContainer, { backgroundColor: theme.surface }]}>
            <Text style={[styles.debugText, { color: theme.textSecondary }]}>
              Setup: {setupConfig ? '✅' : '❌'}
            </Text>
            <Text style={[styles.debugText, { color: theme.textSecondary }]}>
              Session: {userSession ? '✅' : '❌'}
            </Text>
            <Text style={[styles.debugText, { color: theme.textSecondary }]}>
              Database: {isDatabaseReady ? '✅' : '❌'}
            </Text>
            <Text style={[styles.debugText, { color: theme.textSecondary }]}>
              Connections: {databaseConnections.join(', ')}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderErrorState = () => {
    console.log(`[InitializationScreen][renderErrorState] Rendering error state, error:`, error);
    const styles = getStyles();

    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>

        <Text style={[styles.errorTitle, { color: theme.error }]}>
          {t('error.initialization_failed')}
        </Text>

        <Text style={[styles.errorMessage, { color: theme.textSecondary }]}>
          {error?.message || t('error.unknown')}
        </Text>

        {/* Error details for debugging */}
        {__DEV__ && !!error?.details && (
          <View style={[styles.errorDetails, { backgroundColor: theme.surface }]}>
            <Text style={[styles.errorDetailsTitle, { color: theme.text }]}>
              Debug Info:
            </Text>
            <Text style={[styles.errorDetailsText, { color: theme.textSecondary }]}>
              Type: {error.type}
            </Text>
            {error.code && (
              <Text style={[styles.errorDetailsText, { color: theme.textSecondary }]}>
                Code: {error.code}
              </Text>
            )}
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={handleRetry}
          >
            <Text style={[styles.retryButtonText, { color: theme.buttonText }]}>
              {t('button.retry')}
            </Text>
          </TouchableOpacity>

          {__DEV__ && (
            <TouchableOpacity
              style={[styles.resetButton, { backgroundColor: theme.error }]}
              onPress={handleReset}
            >
              <Text style={[styles.resetButtonText, { color: '#fff' }]}>
                {t('button.reset')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderReadyState = () => {
    console.log(`[InitializationScreen][renderReadyState] Rendering ready state, isReady: ${isReady}`);
    const styles = getStyles();

    return (
      <View style={styles.centerContainer}>
        <Text style={styles.successIcon}>✅</Text>

        <Text style={[styles.successTitle, { color: theme.success }]}>
          {t('success.initialization_complete')}
        </Text>

        <View style={[styles.statusContainer, { backgroundColor: theme.surface }]}>
          <Text style={[styles.statusText, { color: theme.text }]}>
            {t('status.setup')}: {needsSetup ? t('status.required') : t('status.complete')}
          </Text>
          <Text style={[styles.statusText, { color: theme.text }]}>
            {t('status.session')}: {hasValidSession ? t('status.valid') : t('status.none')}
          </Text>
          <Text style={[styles.statusText, { color: theme.text }]}>
            {t('status.database')}: {isDatabaseReady ? t('status.ready') : t('status.pending')}
          </Text>
        </View>

        {!autoInitialize && (
          <TouchableOpacity
            style={[styles.startButton, { backgroundColor: theme.success }]}
            onPress={checkInitialization}
          >
            <Text style={[styles.startButtonText, { color: '#fff' }]}>
              {t('button.start')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderContent = () => {
    console.log(`[InitializationScreen][renderContent] Determining content to render, isLoading: ${isLoading}, error: ${!!error}`);
    if (error) {
      return renderErrorState();
    }

    if (isLoading) {
      return renderLoadingState();
    }

    return renderReadyState();
  };

  const styles = getStyles();
  console.log(`[InitializationScreen][render] Rendering main view with styles`);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />
      <LinearGradient colors={theme.gradient} style={styles.gradient}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          bounces={false}>
          {isTablet ? (
            <View style={styles.tabletContainer}>
              {renderContent()}
            </View>
          ) : (
            renderContent()
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const createStyles = (theme: any, isDark: boolean) => {
  console.log(`[InitializationScreen][createStyles] Creating styles with theme`);
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    gradient: {
      flex: 1,
    },
    scrollContainer: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 20,
    },
    tabletContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      maxWidth: 600,
      alignSelf: 'center',
      width: '100%',
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },

    // Progress styles
    progressContainer: {
      marginTop: 20,
      alignItems: 'center',
      width: '100%',
    },
    progressText: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 10,
    },
    progressBar: {
      width: '80%',
      height: 8,
      borderRadius: 4,
      marginBottom: 10,
    },
    progressFill: {
      height: '100%',
      borderRadius: 4,
    },
    stepText: {
      fontSize: 14,
      textAlign: 'center',
    },

    // Error styles
    errorIcon: {
      fontSize: 48,
      marginBottom: 16,
    },
    errorTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 8,
      textAlign: 'center',
    },
    errorMessage: {
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 20,
      lineHeight: 24,
    },
    errorDetails: {
      padding: 12,
      borderRadius: 8,
      marginBottom: 20,
      alignSelf: 'stretch',
    },
    errorDetailsTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    errorDetailsText: {
      fontSize: 12,
      fontFamily: 'monospace',
    },

    // Success styles
    successIcon: {
      fontSize: 48,
      marginBottom: 16,
    },
    successTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 20,
      textAlign: 'center',
    },
    statusContainer: {
      padding: 16,
      borderRadius: 8,
      marginBottom: 20,
      alignSelf: 'stretch',
    },
    statusText: {
      fontSize: 14,
      marginBottom: 4,
    },

    // Button styles
    buttonContainer: {
      flexDirection: 'row',
      gap: 12,
    },
    retryButton: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    retryButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    resetButton: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    resetButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    startButton: {
      paddingHorizontal: 32,
      paddingVertical: 16,
      borderRadius: 8,
    },
    startButtonText: {
      fontSize: 18,
      fontWeight: 'bold',
    },

    // Debug styles
    debugContainer: {
      padding: 12,
      borderRadius: 6,
      marginTop: 16,
      alignSelf: 'stretch',
    },
    debugText: {
      fontSize: 12,
      fontFamily: 'monospace',
      marginBottom: 2,
    },
  });
};