import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import {useTheme} from '../../styles/ThemeContext';
import {isTablet} from '../../utils';

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = React.memo(
  ({icon, title, description}) => {
    const {theme} = useTheme();
    return (
      <View style={[styles.featureCard, {backgroundColor: theme.surface}]}>
        <View style={[styles.featureIcon]}>
          <Icon name={icon as any} size={32} color={theme.accent} />
        </View>
        <Text style={[styles.featureTitle, {color: theme.text}]}>{title}</Text>
        <Text style={[styles.featureDescription, {color: theme.textSecondary}]}>
          {description}
        </Text>
      </View>
    );
  },
);

export default FeatureCard;

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
  featureCard: {
    width: isTablet ? '47%' : '100%', // Giảm kích thước xuống dưới 50% để tránh lỗi xuống dòng
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
