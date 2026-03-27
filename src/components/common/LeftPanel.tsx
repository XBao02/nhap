import React from 'react';
import {View,Text,StyleSheet ,ImageBackground} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useLanguage} from '../../i18n';
import {useTheme} from '../../styles/ThemeContext';
import {Logo} from '../../assets/icons';
import {isDesktop} from '../../utils';

interface LeftPanelProps {
  logoUrl?: string;
}

export const LeftPanel: React.FC<LeftPanelProps> = React.memo(({logoUrl}) => {
  const {t} = useLanguage();
  const {theme, isDark} = useTheme();

  return (
    <View style={styles.leftPanel}>
      <ImageBackground
        source={require('../../assets/logo/logo-bg.svg')}
        style={styles.backgroundImage}
        resizeMode="cover">
        <LinearGradient
          colors={
            isDark
              ? ['rgba(13, 17, 23, 0.8)', 'rgba(33, 38, 45, 0.9)']
              : ['rgba(248, 250, 252, 0.8)', 'rgba(226, 232, 240, 0.9)']
          }
          style={styles.leftPanelOverlay}>
          <View style={styles.leftPanelContent}>
            <View style={styles.tabletLogoContainer}>
              <LinearGradient
                colors={['#00D9FF', '#00B4CC', '#008B8B']}
                style={styles.tabletLogoGradient}>
                <Logo width={120} height={120}/>
              </LinearGradient>
            </View>
            <Text style={[styles.tabletTitle, {color: theme.text}]}>
              {t('login.title')}
            </Text>
            <Text style={[styles.tabletSubtitle, {color: theme.textSecondary}]}>
              {t('login.subtitle')}
            </Text>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
});

export default LeftPanel;

const styles = StyleSheet.create({
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
    shadowOffset: {width: 0, height: 12},
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
});


