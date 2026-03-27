import React, { useCallback } from 'react';
import {
  SafeAreaView,
  StatusBar,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Text,
  Keyboard,
  TouchableOpacity,
  InteractionManager,
  View,
  StyleSheet,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../styles/ThemeContext';
import { useLanguage } from '../../i18n';
import {
  HeaderControls,
  CustomInput,
  GradientButton,
} from '../../components/common';
import { useSetup } from './hooks/useSetup';
import { isTablet, isDesktop } from '../../utils';

import { RouteProp, useRoute } from '@react-navigation/native';
import type { RootStackParamList } from '../../types';
type UserProfileRouteProp = RouteProp<RootStackParamList, 'UserProfile'>;

export const UserProfileScreen: React.FC = () => {
  const route = useRoute<UserProfileRouteProp>();
  const { userId } = route.params || { userId: null };
  const { theme, isDark } = useTheme();
  const { t } = useLanguage();
  const {
    formData,
    handleInputChange,
    handleSave,
    isLoading,
    error,
    isPasswordChanged
  } = useSetup(userId || '');

  // Enhanced save handler with keyboard dismissal
  const handleSavePress = useCallback(() => {
    handleSave()
  }, [handleSave]);

  // Handle form submission from keyboard
  const handleFormSubmit = useCallback(() => {
    handleSavePress();
  }, [handleSavePress]);

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
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>

          <HeaderControls />

          <ScrollView
            contentContainerStyle={[
              styles.scrollContainer,
              { flexGrow: 1, paddingBottom: 30 }
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            scrollEventThrottle={16}
            bounces={false}>

            <Text style={[styles.title, { color: theme.text }]}>
              {t('setup.title')}
            </Text>

            {error && (
              <Text style={[styles.errorText, { color: theme.error }]}>
                {error.message}
              </Text>
            )}

            {isPasswordChanged && (
              <Text style={[styles.warning, { color: theme.warning }]}>
                Vui lòng thay đổi password mặc định!
              </Text>
            )}

            <CustomInput
              label={t('setup.username')}
              value={formData.username}
              onChangeText={value => handleInputChange('username', value)}
              returnKeyType="next"
            />

            <CustomInput
              label={t('setup.password')}
              value={formData.password}
              onChangeText={value => handleInputChange('password', value)}
              secureTextEntry={true}
              returnKeyType="next"
            />

            <CustomInput
              label={t('setup.email')}
              value={formData.email}
              onChangeText={value => handleInputChange('email', value)}
              keyboardType="email-address"
              returnKeyType="next"
            />

            <CustomInput
              label={t('setup.storeName')}
              value={formData.storeName}
              onChangeText={value => handleInputChange('storeName', value)}
              returnKeyType="next"
            />

            <CustomInput
              label={t('setup.enterpriseName')}
              value={formData.enterpriseName}
              onChangeText={value => handleInputChange('enterpriseName', value)}
              returnKeyType="done"
              onSubmitEditing={handleFormSubmit}
            />

            {/* Button Container với better touch handling */}
            <View style={[
              styles.buttonContainer || { marginTop: 30 },
              {
                zIndex: 10,
                elevation: 10,
                paddingVertical: 15,
              }
            ]}>
              <View style={[styles.buttonContainer, { zIndex: 10, elevation: 10, paddingVertical: 15 }]}>
                <GradientButton
                  title={isLoading ? `${t('common.saving')}...` : t('setup.save')}
                  onPress={handleSavePress}
                  disabled={isLoading}
                  colors={theme.gradientButton}
                  style={{ opacity: isLoading ? 0.6 : 1 }}
                />
              </View>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default UserProfileScreen;

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
  buttonContainer: {
    marginTop: 30,        // Khoảng cách từ input cuối
    marginBottom: 20,     // Khoảng cách đến bottom
    zIndex: 10,          // Đảm bảo button ở trên cùng
    elevation: 10,       // Android shadow/elevation
    paddingVertical: 15, // Tăng vùng touch
  },
  title: {
    fontSize: isTablet ? 28 : 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    fontSize: isTablet ? 18 : 16,
    textAlign: 'center',
  },
  warning: {
    color: 'orange',
    marginBottom: 10,
    fontSize: isTablet ? 18 : 16,
    textAlign: 'center',
  },
});