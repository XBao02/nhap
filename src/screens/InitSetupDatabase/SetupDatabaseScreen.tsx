import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../styles/ThemeContext';
import { useLanguage } from '../../i18n';
import { RoleSelector, IndustrySelector } from './components';
import { useSettings } from './hooks/useSettings';
import { useSetupDatabase } from './hooks/useSetupDatabase';
import { isTablet,isDesktop } from '../../utils';
import { HeaderControls, LeftPanel } from '../../components/common';

export const SetupDatabaseScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const { t } = useLanguage();
  const { isLoading, error, initializeDatabase } = useSetupDatabase();
  const {
    industries,
    roles,
    selectedIndustries,
    selectedRoles,
    handleIndustryChange,
    handleRoleChange,
  } = useSettings();

  const handleSetup = async () => {
    console.log('handleSetup called');
    console.log('selectedRoles:', selectedRoles);
    console.log('selectedIndustries:', selectedIndustries);
    try {
      await initializeDatabase(selectedRoles, selectedIndustries);
    } catch (error) {
      console.error('Error in handleSetup:', error);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />
      <LinearGradient colors={theme.gradient} style={styles.gradient}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoidingView}>
          <HeaderControls saveSetting={handleSetup} />
          <ScrollView contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            scrollEventThrottle={16}
            bounces={false}>
            <Text style={[styles.title, { color: theme.text }]}>
              {t('databaseSetup.title')}
            </Text>
            {isLoading ? (
              <ActivityIndicator size="large" color={theme.primary} />
            ) : error ? (
              <Text style={[styles.errorText, { color: theme.text }]}>
                {error}
              </Text>
            ) : (
              <>
                {isTablet ? (
                  <View style={styles.tabletContainer}>
                    <LeftPanel />
                    <View style={styles.rightPanel}>
                      <IndustrySelector
                        industries={industries}
                        selectedIndustries={selectedIndustries}
                        onIndustryChange={handleIndustryChange}
                      />
                      <RoleSelector
                        roles={roles}
                        selectedRoles={selectedRoles}
                        onRoleChange={handleRoleChange}
                      />
                    </View>
                  </View>
                ) : (
                  <>
                    <IndustrySelector
                      industries={industries}
                      selectedIndustries={selectedIndustries}
                      onIndustryChange={handleIndustryChange}
                    />
                    <RoleSelector
                      roles={roles}
                      selectedRoles={selectedRoles}
                      onRoleChange={handleRoleChange}
                    />
                  </>
                )}
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default SetupDatabaseScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  tabletContainer: {
      flex: 1,
      flexDirection: 'row',
    },
    leftPanel: {
      flex: isDesktop ? 0.6 : 0.5,
    },
    rightPanel: {
      flex: isDesktop ? 0.4 : 0.5,
      justifyContent: 'center',
      paddingHorizontal: 20,
    },
  keyboardAvoidingView: { flex: 1 },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: isTablet ? 24 : 16,
    paddingVertical: 16,
  },
  title: {
    fontSize: isTablet ? 28 : 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorText: {
    fontSize: isTablet ? 18 : 16,
    textAlign: 'center',
  },
});