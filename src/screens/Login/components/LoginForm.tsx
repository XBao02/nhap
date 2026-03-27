import React, { useEffect } from 'react';
import { View, TouchableOpacity, Text, Keyboard, StyleSheet } from 'react-native';
import {
  CustomInput,
  GradientButton,
  SocialButton,
  ErrorMessage,
} from '../../../components/common';
import { useLanguage } from '../../../i18n';
import { useTheme } from '../../../styles/ThemeContext';
import { isTablet } from '../../../utils';

interface LoginFormProps {
  password: string;
  showPassword: boolean;
  isLoading: boolean;
  errors: any;
  touched: any;
  handleFieldChange: (field: string, value: string) => void;
  handleFieldBlur: (field: string) => void;
  handleLogin: () => void;
  setShowPassword: (value: boolean) => void;
  handleBiometricAuth: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = React.memo(
  ({
    password,
    showPassword,
    isLoading,
    errors,
    touched,
    handleFieldChange,
    handleFieldBlur,
    handleLogin,
    setShowPassword,
    handleBiometricAuth,
  }) => {
    const { t } = useLanguage();
    const { theme, isDark } = useTheme();

    useEffect(() => {
      const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
        console.log('Keyboard shown');
      });
      const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
        console.log('Keyboard hidden');
      });

      return () => {
        keyboardDidShowListener.remove();
        keyboardDidHideListener.remove();
      };
    }, []);

    // Enhanced button handlers with keyboard dismissal
    const handleLoginPress = () => {
      handleLogin()
    };

    const handleBiometricPress = () => {
      handleBiometricAuth()
    };

    const handleTogglePassword = () => {
      setShowPassword(!showPassword);
    };

    return (
      <View style={styles.formContainer}>
        {errors.general && <ErrorMessage message={errors.general} isGeneral />}

        <CustomInput
          label={t('common.password')}
          value={password}
          placeholder={t('login.passwordPlaceholder')}
          onChangeText={value => handleFieldChange('password', value)}
          onBlur={() => handleFieldBlur('password')}
          error={errors.password}
          touched={touched.password}
          secureTextEntry={!showPassword}
          showPassword={showPassword}
          toggleShowPassword={handleTogglePassword}
          iconName="lock"
          returnKeyType="done"
          onSubmitEditing={handleLoginPress}
          blurOnSubmit={true}
          autoFocus={true}
        />

        <TouchableOpacity
          style={styles.forgotPasswordContainer}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={[styles.forgotPasswordText, { color: theme.accent }]}>
            {t('login.forgotPassword')}?
          </Text>
        </TouchableOpacity>

        <View style={[styles.buttonContainer, { marginTop: 20, zIndex: 1 }]}>
          <GradientButton
            title={isLoading ? `${t('login.processing')}...` : t('login.login')}
            onPress={handleLoginPress}
            disabled={isLoading}
            colors={['#00D9FF', '#00B4CC', '#008B8B']}
            style={{ marginBottom: 10 }}
          />

          <GradientButton
            iconName="fingerprint"
            onPress={handleBiometricPress}
            colors={
              isDark
                ? ['#2D3748', '#4A5568', '#2D3748']
                : ['#E2E8F0', '#CBD5E0', '#E2E8F0']
            }
            isBiometric
            disabled={isLoading}
          />
        </View>

        <View style={styles.dividerContainer}>
          <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
          <Text style={[styles.dividerText, { color: theme.textSecondary }]}>
            {t('common.or')}
          </Text>
          <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
        </View>

        <View style={[styles.socialContainer, { zIndex: 1 }]}>
          <SocialButton platform="google" />
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  formContainer: {
    flex: 1,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
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
});

export default LoginForm;