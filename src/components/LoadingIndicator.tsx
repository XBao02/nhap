import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { globalStyles } from '../styles/globalStyles';
import { colors } from '../styles/colors';

interface LoadingIndicatorProps {
  size?: 'small' | 'large' | number;
  color?: string;
  message?: string;
  isFullScreen?: boolean;
  visible?: boolean;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  size = 'large',
  color = colors.button,
  message,
  isFullScreen = false,
  visible = true,
}) => {
  const { t } = useTranslation();

  return (
    <View
      style={[
        isFullScreen ? globalStyles.centeredContainer : styles.container,
        styles.wrapper,
      ]}
      accessible={true}
      accessibilityLabel={message || t('common.loading')}
    >
      <ActivityIndicator size={size} color={color} />
      {message && (
        <Text style={[globalStyles.bodyText, styles.message]}>
          {t(message) || message}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: 16,
  },
  message: {
    marginTop: 8,
    color: colors.text,
  },
});

export default LoadingIndicator;