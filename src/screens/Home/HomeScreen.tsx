import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  ScrollView,
  View,
  Platform,
  StyleSheet,
  KeyboardAvoidingView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../styles/ThemeContext';
import { MainContent } from './components';
import { HeaderControls, LeftPanel } from '../../components/common';
import { isTablet, isDesktop, height } from '../../utils';
import { useNavigateTo } from '../../hooks';

export const HomeScreen: React.FC = () => {
  console.log(`[HomeScreen][render] Rendering HomeScreen component`);
  const { theme, isDark } = useTheme();
  console.log(`[HomeScreen][render] Theme: isDark=${isDark}, background=${theme.background}, gradient=${JSON.stringify(theme.gradient)}`);
  const { navigateTo } = useNavigateTo();
  console.log(`[HomeScreen][render] NavigateTo hook initialized`);

  const handleTryPress = () => {
    console.log(`[HomeScreen][handleTryPress] Navigating to Main screen`);
    navigateTo.navigate('Main');
  };

  /**
   * Chuyển sang màn hình khởi tạo
   */
  const handleStartPress = () => {
    console.log(`[HomeScreen][handleStartPress] Navigating to Initialization screen`);
    navigateTo.navigate('Initialization');
  };

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
          style={styles.keyboardAvoidingView}>
          <HeaderControls isHome={true} />
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            scrollEventThrottle={16}
            bounces={false}>
            {isTablet ? (
              <View style={styles.tabletLayout}>
                <LeftPanel />
                <View style={styles.rightPanel}>
                  <MainContent
                    onLoginPress={handleStartPress}
                    onTryPress={handleTryPress}
                  />
                </View>
              </View>
            ) : (
              <MainContent
                onLoginPress={handleStartPress}
                onTryPress={handleTryPress}
              />
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default HomeScreen;

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
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: isTablet ? 0 : 24,
    paddingVertical: isTablet ? 40 : 0,
    justifyContent: isTablet ? 'center' : 'flex-start',
    minHeight: height,
  },
  header: {
    alignItems: 'center',
    marginTop: height * 0.08,
    marginBottom: 20,
  },
  headerTablet: {
    alignItems: 'flex-start',
    marginTop: height * 0.05,
    marginBottom: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  tabletLayout: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  rightPanel: {
    flex: isDesktop ? 0.4 : 0.5,
    paddingHorizontal: isDesktop ? 60 : 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sidePanel: {
    flex: 1,
    minWidth: 400,
  },
  sidePanelGradient: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  imageContainer: {
    alignItems: 'center',
  },
  phoneMockup: {
    width: 200,
    height: 300,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  contentContainerTablet: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  languageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  languageText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    alignItems: 'center',
  },
  heroSectionTablet: {
    paddingHorizontal: 40,
    paddingTop: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 30,
  },
  titleTablet: {
    fontSize: 32,
    lineHeight: 35,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 20,
  },
  subtitleTablet: {
    fontSize: 16,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  buttonContainerTablet: {
    marginTop: 8,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  loginButton: {
    borderWidth: 2,
  },
  tryButton: {},
  loginButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  featuresSection: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 16,
    flex: 1,
  },
  featuresSectionTablet: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  featuresGrid: {
    flexDirection: isTablet ? 'row' : 'column',
    flexWrap: isTablet ? 'wrap' : 'nowrap',
    justifyContent: 'space-between',
    gap: 16,
    paddingBottom: 20,
  },
  featureCard: {
    width: isTablet ? '47%' : '100%',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: isTablet ? 0 : 16,
  },
  featureCardTablet: {
    width: '48%',
    padding: 20,
    shadowOpacity: 0.08,
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});