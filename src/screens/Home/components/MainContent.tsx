import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useLanguage } from '../../../i18n';
import {
  FeatureCard,
} from '../../../components/common';
import { useTheme } from '../../../styles/ThemeContext';
import { isTablet } from '../../../utils';

interface MainContentProps {
  onLoginPress: () => void;
  onTryPress: () => void;
}

export const MainContent: React.FC<MainContentProps> = React.memo(
  ({ onLoginPress, onTryPress }) => {
    const { t } = useLanguage();
    const { theme, isDark } = useTheme();
    return (
      <View
        style={[
          styles.contentContainer,
          isTablet && styles.contentContainerTablet,
          { backgroundColor: theme.background },
        ]}>
        <ScrollView contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          bounces={false}>
          {/* Hero Section */}
          <View
            style={[
              styles.heroSection,
              isTablet && styles.heroSectionTablet,
              { backgroundColor: theme.surface },
            ]}>
            <Text
              style={[
                styles.title,
                isTablet && styles.titleTablet,
                { color: theme.text },
              ]}>
              {t('home.title')}
            </Text>
            <Text
              style={[
                styles.subtitle,
                isTablet && styles.subtitleTablet,
                { color: theme.textSecondary },
              ]}>
              {t('home.subtitle')}
            </Text>

            <View
              style={[
                styles.buttonContainer,
                isTablet && styles.buttonContainerTablet,
              ]}>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.loginButton,
                  { borderColor: theme.border },
                ]}
                onPress={onLoginPress}>
                <Text style={[styles.loginButtonText, { color: theme.text }]}>
                  {t('home.loginButton')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.tryButton,
                  { backgroundColor: isDark ? '#FF4500' : '#FF5722' },
                ]}
                onPress={onTryPress}>
                <Text style={[styles.tryButtonText, { color: theme.text }]}>
                  {t('home.tryButton')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Features Section */}
          <View
            style={[
              styles.featuresSection,
              isTablet && styles.featuresSectionTablet,
              { backgroundColor: theme.background },
            ]}>
            <View style={styles.featuresGrid}>
              <FeatureCard
                icon="smartphone"
                title={t('home.feature1Title')}
                description={t('home.feature1Desc')}
              />
              <FeatureCard
                icon="attach-money"
                title={t('home.feature2Title')}
                description={t('home.feature2Desc')}
              />
              <FeatureCard
                icon="flash-on"
                title={t('home.feature3Title')}
                description={t('home.feature3Desc')}
              />
              <FeatureCard
                icon="security"
                title={t('home.feature4Title')}
                description={t('home.feature4Desc')}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
  },
  contentContainerTablet: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
});

export default MainContent;