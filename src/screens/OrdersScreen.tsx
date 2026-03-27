import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import OrderItem from '../components/OrderItem';
import LoadingIndicator from '../components/LoadingIndicator';
import { globalStyles } from '../styles/globalStyles';
import { colors } from '../styles/colors';

interface Order {
  orderId: string;
  date: string;
  status: 'Ready to Use' | 'Used' | 'Success';
  amount: string;
  productName: string;
}

interface OrderScreenProps {
  logoUrl?: string;
}

const OrderScreen: React.FC<OrderScreenProps> = ({ logoUrl }) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<'Today' | 'Weekly' | 'Monthly'>('Today');

  // Mock data
  const mockOrders: Order[] = [
    {
      orderId: 'ORD12345',
      date: '2025-06-10',
      status: 'Success',
      amount: '99.99',
      productName: 'Product A',
    },
    {
      orderId: 'ORD12346',
      date: '2025-06-09',
      status: 'Used',
      amount: '49.99',
      productName: 'Product B',
    },
    {
      orderId: 'ORD12347',
      date: '2025-06-08',
      status: 'Ready to Use',
      amount: '29.99',
      productName: 'Product C',
    },
  ];

  // Fetch orders (mock)
  const fetchOrders = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setOrders(mockOrders);
      setFilteredOrders(mockOrders);
      setIsLoading(false);
    }, 1000);
  };

  // Handle pull-to-refresh
  const onRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setOrders(mockOrders);
      setFilteredOrders(mockOrders);
      setSearchQuery('');
      setFilter('Today');
      setIsRefreshing(false);
    }, 1000);
  };

  // Initial fetch
  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter orders based on search query and filter
  useEffect(() => {
    let filtered = orders.filter(
      (order) =>
        order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.productName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Apply time filter
    const today = new Date('2025-06-10');
    filtered = filtered.filter((order) => {
      const orderDate = new Date(order.date);
      if (filter === 'Today') {
        return orderDate.toDateString() === today.toDateString();
      } else if (filter === 'Weekly') {
        const oneWeekAgo = new Date(today);
        oneWeekAgo.setDate(today.getDate() - 7);
        return orderDate >= oneWeekAgo;
      }
      return true; // Monthly shows all
    });

    setFilteredOrders(filtered);
  }, [searchQuery, orders, filter]);

  const renderOrder = ({ item }: { item: Order }) => (
    <OrderItem
      orderId={item.orderId}
      date={item.date}
      status={item.status}
      amount={item.amount}
      productName={item.productName}
    />
  );

  const renderFilterButton = (filterType: 'Today' | 'Weekly' | 'Monthly') => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === filterType && styles.activeFilterButton,
      ]}
      onPress={() => setFilter(filterType)}
      accessible={true}
      accessibilityLabel={t(`history.${filterType.toLowerCase()}`)}
    >
      <Text
        style={[
          globalStyles.bodyText,
          filter === filterType && styles.activeFilterText,
        ]}
      >
        {t(`history.${filterType.toLowerCase()}`)}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={globalStyles.screenContainer}>
      {isLoading && !isRefreshing && <LoadingIndicator isFullScreen message="loading" />}
      {logoUrl && (
        <Image
          source={{ uri: logoUrl }}
          style={styles.logo}
          accessibilityLabel="App logo"
        />
      )}
      <Text style={globalStyles.title}>{t('orders.title')}</Text>
      <TextInput
        style={globalStyles.textInput}
        placeholder={t('orders.searchPlaceholder')}
        value={searchQuery}
        onChangeText={setSearchQuery}
        accessible={true}
        accessibilityLabel={t('orders.searchPlaceholder')}
      />
      <View style={styles.filterContainer}>
        {renderFilterButton('Today')}
        {renderFilterButton('Weekly')}
        {renderFilterButton('Monthly')}
      </View>
      <FlatList
        data={filteredOrders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.orderId}
        ListEmptyComponent={
          <Text style={[globalStyles.bodyText, styles.noResults]}>
            {t('orders.noResults')}
          </Text>
        }
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  activeFilterButton: {
    backgroundColor: colors.button,
    borderColor: colors.button,
  },
  activeFilterText: {
    color: colors.buttonText,
  },
  listContent: {
    paddingBottom: 16,
  },
  noResults: {
    textAlign: 'center',
    marginTop: 16,
    color: colors.secondaryText,
  },
});

export default OrderScreen;