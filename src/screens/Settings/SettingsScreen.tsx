import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  Text,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { HeaderControls, LeftPanel } from '../../components/common';
import { useTheme } from '../../styles/ThemeContext';
import { styles } from './settingsStyles';
import {
  SettingsHeader,
  IndustrySelector,
  RoleSelector,
  LanguageSelector,
  ThemeToggle,
} from './components';
import { useSettings } from './hooks/useSettings';
import { isTablet } from '../../utils';

interface SettingsScreenProps {
  logoUrl?: string;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ logoUrl }) => {
  const { theme, isDark } = useTheme();
  const {
    industries,
    roles,
    selectedIndustries,
    selectedRoles,
    handleIndustryChange,
    handleRoleChange,
    handleThemeToggle,
    handleSaveSettings,
  } = useSettings();

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
          <HeaderControls saveSetting={handleSaveSettings} />
          <ScrollView contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            scrollEventThrottle={16}
            bounces={false}>
            {isTablet ? (
              <View style={styles.tabletContainer}>
                <LeftPanel />
                <View style={styles.rightPanel}>
                  <SettingsHeader />
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
                  <LanguageSelector />
                  <ThemeToggle onToggle={handleThemeToggle} />
                </View>
              </View>
            ) : (
              <>
                <SettingsHeader />
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
                <LanguageSelector />
                <ThemeToggle onToggle={handleThemeToggle} />
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default SettingsScreen;
