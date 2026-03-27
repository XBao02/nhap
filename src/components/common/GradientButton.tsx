import React from 'react';
import {Pressable, Text, StyleSheet, Platform} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from '@react-native-vector-icons/material-icons';
import {useTheme} from '../../styles/ThemeContext';
import {isTablet} from '../../utils';

interface GradientButtonProps {
  title?: string;
  iconName?: string;
  onPress?: () => void;
  disabled?: boolean;
  colors?: string[];
  isBiometric?: boolean;
  style?: any;
}

export const GradientButton: React.FC<GradientButtonProps> = React.memo(
  ({title, iconName, onPress, disabled, colors, isBiometric}) => {
    const {theme} = useTheme();

    // Kiểm tra nếu đang chạy trên Windows để điều chỉnh animation
    const isWindows = Platform.OS === 'windows';

    return (
      <Pressable
        style={({pressed}) => [
          isBiometric ? styles.biometricButton : styles.loginButton,
          disabled && styles.loginButtonDisabled,
          // Chỉ áp dụng scale transform khi không phải Windows hoặc khi cần thiết
          !isWindows && {
            transform: [{scale: pressed ? 0.95 : 1}]
          },
          // Thay thế bằng opacity cho Windows để tạo feedback
          isWindows && pressed && styles.pressedWindows,
        ]}
        onPress={onPress}
        disabled={disabled}
        // Loại bỏ onPressIn và onPressOut vì không cần Animated
        android_ripple={
          !isWindows ? {
            color: 'rgba(0, 217, 255, 0.2)',
            borderless: false,
          } : undefined
        }
      >
        <LinearGradient
          colors={(colors as any) || theme.gradient}
          style={
            isBiometric ? styles.biometricButtonGradient : styles.buttonGradient
          }>
          {iconName ? (
            <Icon name={iconName as any} size={24} color="#00D9FF" />
          ) : (
            <Text
              style={[
                styles.loginButtonText,
                {color: theme.textOnGradient || '#FFFFFF'},
              ]}>
              {title}
            </Text>
          )}
        </LinearGradient>
      </Pressable>
    );
  },
);

export default GradientButton;

const styles = StyleSheet.create({
  loginButton: {
    flex: 1,
    minHeight: 40,
    marginRight: isTablet ? 0 : 12,
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#00D9FF',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      windows: {
        // Windows specific styles - có thể thêm border hoặc background khác
        borderWidth: 1,
        borderColor: 'rgba(0, 217, 255, 0.3)',
      },
    }),
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  biometricButton: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#00D9FF',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      windows: {
        borderWidth: 1,
        borderColor: 'rgba(0, 217, 255, 0.2)',
      },
    }),
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
  // Style cho Windows khi button được nhấn
  pressedWindows: {
    opacity: 0.8,
  },
});