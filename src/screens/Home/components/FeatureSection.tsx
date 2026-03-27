import React from 'react';
import {View, StyleSheet} from 'react-native';
import {useLanguage} from '../../../i18n';
import {useTheme} from '../../../styles/ThemeContext';
import {isTablet} from '../../../utils';
import FeatureCard from '../../../components/common/FeatureCard';

export const FeatureSection: React.FC = React.memo(() => {
  const {t} = useLanguage();
  const {theme} = useTheme();

  const features = [
    {
      icon: 'smartphone',
      title: t('home.feature1Title'),
      description: t('home.feature1Desc'),
    },
    {
      icon: 'attach-money',
      title: t('home.feature2Title'),
      description: t('home.feature2Desc'),
    },
    {
      icon: 'flash-on',
      title: t('home.feature3Title'),
      description: t('home.feature3Desc'),
    },
    {
      icon: 'security',
      title: t('home.feature4Title'),
      description: t('home.feature4Desc'),
    },
  ];

  return (
    <View style={[styles.featuresSection, isTablet && styles.featuresSectionTablet, {backgroundColor: theme.background}]}>
      <View style={styles.featuresGrid}>
        {features.map((feature, index) => (
          <FeatureCard key={index} {...feature} />
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
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

export default FeatureSection;