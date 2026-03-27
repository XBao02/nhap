import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useLanguage } from '../../i18n';
import { useTheme } from '../../styles/ThemeContext';
import { LoginHeader, LoginForm, LoginFooter } from './components';
import { HeaderControls, LeftPanel } from '../../components/common';
import useLogin from './hooks/useLogin';
import { isTablet, isDesktop, height } from '../../utils';

export const LoginScreen: React.FC = () => {
  const { t } = useLanguage();
  const { theme, isDark } = useTheme();
  const {
    userName,
    password,
    showPassword,
    isLoading,
    errors,
    touched,
    handleBiometricAuth,
    handleFieldChange,
    handleFieldBlur,
    handleLogin,
    handleChangeUserPress,
    setShowPassword,
  } = useLogin();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />
      <LinearGradient colors={theme.gradient} style={styles.gradient}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
          {/* Header Controls */}
          <HeaderControls isHome={false} />
          {/* Responsive Layout */}
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            scrollEventThrottle={16}
            bounces={false}>
            {isTablet ? (
              <View style={styles.tabletContainer}>
                <LeftPanel />
                <View style={styles.rightPanel}>
                  <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.text }]}>
                      {t('login.welcome', { name: userName })}
                    </Text>
                  </View>
                  <LoginForm
                    password={password}
                    showPassword={showPassword}
                    isLoading={isLoading}
                    errors={errors}
                    touched={touched}
                    handleFieldChange={handleFieldChange}
                    handleFieldBlur={handleFieldBlur}
                    handleLogin={handleLogin}
                    setShowPassword={setShowPassword}
                    handleBiometricAuth={handleBiometricAuth}
                  />
                  <LoginFooter onChangeUserPress={handleChangeUserPress} />
                </View>
              </View>
            ) : (
              <>
                <LoginHeader userName={userName} />
                <LoginForm
                  password={password}
                  showPassword={showPassword}
                  isLoading={isLoading}
                  errors={errors}
                  touched={touched}
                  handleFieldChange={handleFieldChange}
                  handleFieldBlur={handleFieldBlur}
                  handleLogin={handleLogin}
                  setShowPassword={setShowPassword}
                  handleBiometricAuth={handleBiometricAuth}
                />
                <LoginFooter onChangeUserPress={handleChangeUserPress} />
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  headerButtonContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 20 : 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 0,
    zIndex: 1,
  },
  headerButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  languageToggle: {
    left: 10,
  },
  themeToggle: {
    right: 10,
  },
  flag: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: isTablet ? 0 : 24,
    paddingVertical: isTablet ? 40 : 0,
    justifyContent: isTablet ? 'center' : 'flex-start',
    minHeight: height, // Đảm bảo nội dung chiếm toàn bộ chiều cao
  },
  header: {
    alignItems: 'center',
    marginTop: 0,     //height * 0.001,
    marginBottom: 10,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00D9FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  tabletContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  leftPanel: {
    flex: isDesktop ? 0.6 : 0.5,
    position: 'relative',
  },
  backgroundImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftPanelOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  leftPanelContent: {
    alignItems: 'center',
    maxWidth: 400,
  },
  tabletLogoContainer: {
    marginBottom: 32,
  },
  tabletLogoGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00D9FF',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  tabletTitle: {
    fontSize: isDesktop ? 36 : 32,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  tabletSubtitle: {
    fontSize: isDesktop ? 20 : 18,
    textAlign: 'center',
    marginBottom: 24,
  },
  rightPanel: {
    flex: isDesktop ? 0.4 : 0.5,
    paddingHorizontal: isDesktop ? 60 : 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    flex: 1,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  required: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  eyeIcon: {
    padding: 4,
  },
  fieldErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginLeft: 4,
  },
  fieldErrorText: {
    fontSize: 12,
    marginLeft: 4,
    flex: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: isTablet ? 0 : 20,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  loginButton: {
    flex: 1,
    minHeight: 40, // Đặt độ cao tối thiểu để hiển thị text
    marginRight: isTablet ? 0 : 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#00D9FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  biometricButton: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#00D9FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  biometricButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '600',
    marginHorizontal: 16,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    marginHorizontal: 6,
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 24,
  },
  footerText: {
    fontSize: 14,
  },
  signUpText: {
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalMobileWrapper: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
    padding: 0,
  },
  modalTabletWrapper: {
    maxWidth: isDesktop ? 400 : 360,
    maxHeight: height * 0.8,
    backgroundColor: 'transparent',
    borderRadius: 16,
    padding: 10,
    alignSelf: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: isTablet ? 16 : 0,
    padding: isTablet ? 24 : 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    width: '90%',
    maxWidth: 400,
    alignSelf: 'center',
  },
});
