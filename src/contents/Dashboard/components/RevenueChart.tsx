import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import {useLanguage} from '../../../i18n';
import { useTheme } from '../../../styles';
import { isTablet } from '../../../utils';
import { styles } from '../dashboardStyles';

interface RevenueChartProps {
  data: {
    labels: string[];
    datasets: { data: number[] }[];
  };
  isSidebarOpen: boolean;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data, isSidebarOpen }) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const screenWidth = Dimensions.get('window').width;

  return (
    <View style={[styles.section, { backgroundColor: theme.surface }]}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('dashboard.revenue.title')}</Text>
      <LineChart
        data={data}
        width={screenWidth - (isTablet ? (isSidebarOpen ? 282 : 32) : 32)}
        height={220}
        chartConfig={{
          backgroundColor: theme.surface,
          backgroundGradientFrom: theme.surface,
          backgroundGradientTo: theme.surface,
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
          labelColor: (opacity = 1) => theme.textSecondary,
          style: { borderRadius: 16 },
          propsForDots: {
            r: '6',
            strokeWidth: '2',
            stroke: theme.accent,
          },
        }}
        bezier
        style={styles.chart}
      />
    </View>
  );
};

export default RevenueChart;