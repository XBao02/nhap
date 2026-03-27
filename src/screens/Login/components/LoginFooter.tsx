import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useLanguage} from '../../../i18n';
import {useTheme} from '../../../styles/ThemeContext';

interface LoginFooterProps {
  onChangeUserPress?: () => void;
}

export const LoginFooter: React.FC<LoginFooterProps> = React.memo(
  ({onChangeUserPress}) => {
    const {t} = useLanguage();
    const {theme} = useTheme();

    return (
      <View style={styles.footer}>
        <Text style={[styles.footerText, {color: theme.textSecondary}]}>
          {t('login.differentUser')}{' '}
          <Text
            style={[styles.signUpText, {color: theme.accent}]}
            onPress={onChangeUserPress}>
            {t('login.changeUser')}
          </Text>
        </Text>
      </View>
    );
  },
);

const styles = StyleSheet.create({
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
});

export default LoginFooter;