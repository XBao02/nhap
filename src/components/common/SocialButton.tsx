import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useTheme } from '../../styles/ThemeContext';

interface SocialButtonProps {
  platform: 'google' | 'facebook';
}

export const SocialButton: React.FC<SocialButtonProps> = React.memo(({ platform }) => {
  const { theme } = useTheme();
  const iconName = platform === 'google' ? 'g-translate' : 'facebook';
  const iconColor = platform === 'google' ? '#4285F4' : '#1877F2';
  const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);

  return (
    <TouchableOpacity
      style={[styles.socialButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
    >
      <Icon name={iconName} size={20} color={iconColor} />
      <Text style={[styles.socialButtonText, { color: theme.text }]}>{platformName}</Text>
    </TouchableOpacity>
  );
});

export default SocialButton;

const styles = StyleSheet.create({
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
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
});