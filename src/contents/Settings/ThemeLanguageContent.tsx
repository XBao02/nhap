import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { LeftPanel } from '../../components/common';
import { useTheme } from '../../styles/ThemeContext';
import { styles } from './settingsStyles';
import { SettingsHeader, LanguageSelector, ThemeToggle } from './components';
import { isTablet } from '../../utils';

export const ThemeLanguageContent: React.FC = () => {
  const { theme, isDark, toggleTheme } = useTheme();

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
          <ScrollView contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            scrollEventThrottle={16}
            bounces={false}>
            {isTablet ? (
              <View style={styles.tabletContainer}>
                <LeftPanel />
                <View style={styles.rightPanel}>
                  <SettingsHeader />
                  <LanguageSelector />
                  <ThemeToggle onToggle={toggleTheme} />
                </View>
              </View>
            ) : (
              <>
                <SettingsHeader />
                <LanguageSelector />
                <ThemeToggle onToggle={toggleTheme} />
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};
