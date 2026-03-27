import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import ProductCard from '../components/ProductCard';
import LoadingIndicator from '../components/LoadingIndicator';
import { globalStyles } from '../styles/globalStyles';
import { colors } from '../styles/colors';

interface Product {
  id: string;
  name: string;
  brand: string;
  price: string;
  quantity: number;
  description: string;
}

interface InventoryScreenProps {
  logoUrl?: string;
}

const InventoryScreen: React.FC<InventoryScreenProps> = ({ logoUrl }) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock data
  const mockProducts: Product[] = [
    {
      id: '1',
      name: 'Product A',
      brand: 'Brand X',
      price: '29.99',
      quantity: 50,
      description: 'High-quality product A',
    },
    {
      id: '2',
      name: 'Product B',
      brand: 'Brand Y',
      price: '49.99',
      quantity: 20,
      description: 'Premium product B',
    },
    {
      id: '3',
      name: 'Product C',
      brand: 'Brand Z',
      price: '19.99',
      quantity: 100,
      description: 'Affordable product C',
    },
  ];

  // Fetch products (mock)
  const fetchProducts = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setProducts(mockProducts);
      setFilteredProducts(mockProducts);
      setIsLoading(false);
    }, 1000);
  };

  // Handle pull-to-refresh
  const onRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setProducts(mockProducts);
      setFilteredProducts(mockProducts);
      setSearchQuery('');
      setIsRefreshing(false);
    }, 1000);
  };

  // Initial fetch
  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter products based on search query
  useEffect(() => {
    const filtered = products.filter((product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [searchQuery, products]);

  const renderProduct = ({ item }: { item: Product }) => (
    <ProductCard
      name={item.name}
      brand={item.brand}
      price={item.price}
      description={`${t('inventory.quantity')}: ${item.quantity}`}
    />
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
      <Text style={globalStyles.title}>{t('inventory.title')}</Text>
      <TextInput
        style={globalStyles.textInput}
        placeholder={t('inventory.searchPlaceholder')}
        value={searchQuery}
        onChangeText={setSearchQuery}
        accessible={true}
        accessibilityLabel={t('inventory.searchPlaceholder')}
      />
      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={[globalStyles.bodyText, styles.noResults]}>
            {t('inventory.noResults')}
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
  listContent: {
    paddingBottom: 16,
  },
  noResults: {
    textAlign: 'center',
    marginTop: 16,
    color: colors.secondaryText,
  },
});

export default InventoryScreen;