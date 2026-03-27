import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useLanguage} from '../../../i18n';
import {useTheme} from '../../../styles/ThemeContext';
import {Logo} from '../../../assets/icons';

interface LoginHeaderProps {
  userName?: string;
}

export const LoginHeader: React.FC<LoginHeaderProps> = React.memo(({userName = 'Your heart!'}) => {
  const {t} = useLanguage();
  const {theme} = useTheme();

  return (
    <View style={styles.header}>
      <View style={styles.logoContainer}>
        <LinearGradient
          colors={['#00D9FF', '#00B4CC', '#008B8B']}
          style={styles.logoGradient}>
          <Logo width={80} height={80}/>
        </LinearGradient>
      </View>
      <Text style={[styles.title, {color: theme.text}]}>
        {t('login.title')}
      </Text>
      <Text style={[styles.subtitle, {color: theme.textSecondary}]}>
        {t('login.welcome', { name: userName })}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginTop: 0,
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
    shadowOffset: {width: 0, height: 8},
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
});

export default LoginHeader;