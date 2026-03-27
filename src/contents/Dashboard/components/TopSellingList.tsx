import React from 'react';
import {View, Text, FlatList} from 'react-native';
import {useLanguage} from '../../../i18n';
import {useTheme} from '../../../styles';
import {styles} from '../dashboardStyles';

interface TopSellingItem {
  id: string;
  name: string;
  sold: number;
  revenue: number;
}

interface TopSellingListProps {
  data: TopSellingItem[];
}

const TopSellingList: React.FC<TopSellingListProps> = ({data}) => {
  const {t} = useLanguage();
  const {theme} = useTheme();

  const renderTopSellingItem = ({item}: {item: TopSellingItem}) => (
    <View
      style={[
        styles.card,
        {backgroundColor: theme.surface, borderColor: theme.border},
      ]}>
      <Text style={[styles.cardTitle, {color: theme.text}]}>{item.name}</Text>
      <Text style={[styles.cardText, {color: theme.textSecondary}]}>
        {t('dashboard.topSelling.sold')}: {item.sold}
      </Text>
      <Text style={[styles.cardText, {color: theme.textSecondary}]}>
        {t('dashboard.topSelling.revenue')}: {item.revenue.toLocaleString()} VND
      </Text>
    </View>
  );

  return (
    <View style={[styles.section, {backgroundColor: theme.surface}]}>
      <Text style={[styles.sectionTitle, {color: theme.text}]}>
        {t('dashboard.topSelling.title')}
      </Text>
      <FlatList
        data={data}
        renderItem={renderTopSellingItem}
        keyExtractor={item => item.id}
        scrollEnabled={false}
      />
    </View>
  );
};

export default TopSellingList;
