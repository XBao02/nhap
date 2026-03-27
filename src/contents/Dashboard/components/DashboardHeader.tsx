import React from 'react';
import { Text, View } from 'react-native';
import {useLanguage} from '../../../i18n';
import { useTheme } from '../../../styles';
import { styles } from '../dashboardStyles';

export const DashboardHeader: React.FC = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();

  return (
    <View style={styles.headerContainer}>
      <Text style={[styles.title, { color: theme.text }]}>{t('dashboard.title')}</Text>
    </View>
  );
};

export default DashboardHeader;