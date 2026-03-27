import React from 'react';
import {View, Text, FlatList} from 'react-native';
import {useLanguage} from '../../../i18n';
import {useTheme} from '../../../styles';
import {styles} from '../dashboardStyles';

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  status: 'sufficient' | 'low';
}

interface InventoryTableProps {
  data: InventoryItem[];
}

const InventoryTable: React.FC<InventoryTableProps> = ({data}) => {
  const {t} = useLanguage();
  const {theme} = useTheme();

  const renderInventoryItem = ({item}: {item: InventoryItem}) => (
    <View style={[styles.tableRow, {backgroundColor: theme.surface}]}>
      <Text style={[styles.tableCell, {color: theme.text}]}>{item.name}</Text>
      <Text style={[styles.tableCell, {color: theme.text}]}>
        {item.quantity}
      </Text>
      <Text
        style={[
          styles.tableCell,
          {color: item.status === 'low' ? theme.accent : theme.textSecondary},
        ]}>
        {t(`dashboard.inventory.status.${item.status}`)}
      </Text>
    </View>
  );

  return (
    <View style={[styles.section, {backgroundColor: theme.surface}]}>
      <Text style={[styles.sectionTitle, {color: theme.text}]}>
        {t('dashboard.inventory.title')}
      </Text>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderCell, {color: theme.text}]}>
          {t('dashboard.inventory.name')}
        </Text>
        <Text style={[styles.tableHeaderCell, {color: theme.text}]}>
          {t('dashboard.inventory.quantity')}
        </Text>
        <Text style={[styles.tableHeaderCell, {color: theme.text}]}>
          {t('dashboard.inventory.statusH')}
        </Text>
      </View>
      <FlatList
        data={data}
        renderItem={renderInventoryItem}
        keyExtractor={item => item.id}
        scrollEnabled={false}
      />
    </View>
  );
};

export default InventoryTable;
