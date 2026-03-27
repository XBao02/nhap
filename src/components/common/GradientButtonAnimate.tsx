import React from 'react';
import {Pressable, Animated, Text, StyleSheet} from 'react-native';
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
}

export const GradientButton: React.FC<GradientButtonProps> = React.memo(
  ({title, iconName, onPress, disabled, colors, isBiometric}) => {
    const {theme} = useTheme();
    const scale = new Animated.Value(1);

    const onPressIn = () => {
      Animated.spring(scale, {toValue: 0.95, useNativeDriver: true}).start();
    };

    const onPressOut = () => {
      Animated.spring(scale, {toValue: 1, useNativeDriver: true}).start();
    };

    return (
      <Pressable
        style={({pressed}) => [
          isBiometric ? styles.biometricButton : styles.loginButton,
          disabled && styles.loginButtonDisabled,
          {transform: [{scale: pressed ? 0.95 : 1}]},
        ]}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}>
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
    minHeight: 40, // Đặt độ cao tối thiểu để hiển thị text
    marginRight: isTablet ? 0 : 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#00D9FF',
    shadowOffset: {width: 0, height: 4},
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
    shadowOffset: {width: 0, height: 2},
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
});
