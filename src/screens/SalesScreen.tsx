import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import ProductCard from '../components/ProductCard';
import LoadingIndicator from '../components/LoadingIndicator';
import Button from '../components/Button';
import { globalStyles } from '../styles/globalStyles';
import { colors } from '../styles/colors';

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  quantity: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface SalesScreenProps {
  logoUrl?: string;
}

const SalesScreen: React.FC<SalesScreenProps> = ({ logoUrl }) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Mock data
  const mockProducts: Product[] = [
    {
      id: '1',
      name: 'Product A',
      brand: 'Brand X',
      price: 29.99,
      quantity: 50,
    },
    {
      id: '2',
      name: 'Product B',
      brand: 'Brand Y',
      price: 49.99,
      quantity: 20,
    },
    {
      id: '3',
      name: 'Product C',
      brand: 'Brand Z',
      price: 19.99,
      quantity: 100,
    },
  ];

  // Fetch products (mock)
  const fetchProducts = () => {
    setIsLoading(true);
    setTimeout(() => {
      setProducts(mockProducts);
      setFilteredProducts(mockProducts);
      setIsLoading(false);
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

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.product.id === product.id);
    if (existingItem) {
      if (existingItem.quantity < product.quantity) {
        setCart(
          cart.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        );
      }
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
    setError('');
    setSuccess('');
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter((item) => item.product.id !== productId));
    } else {
      setCart(
        cart.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        )
      );
    }
    setError('');
    setSuccess('');
  };

  const handleCreateOrder = () => {
    if (cart.length === 0) {
      setError(t('sales.error'));
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      console.log('Order created:', cart);
      setSuccess(t('sales.success'));
      setCart([]);
      setIsLoading(false);
    }, 1000);
  };

  const calculateTotal = () => {
    return cart
      .reduce((total, item) => total + item.product.price * item.quantity, 0)
      .toFixed(2);
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      onPress={() => addToCart(item)}
      accessible={true}
      accessibilityLabel={`Add ${item.name} to cart`}
    >
      <ProductCard
        name={item.name}
        brand={item.brand}
        price={item.price.toString()}
        description={`Stock: ${item.quantity}`}
      />
    </TouchableOpacity>
  );

  const renderCartItem = (item: CartItem) => (
    <View style={styles.cartItem}>
      <Text style={[globalStyles.bodyText, styles.cartItemName]}>
        {item.product.name}
      </Text>
      <View style={styles.quantityContainer}>
        <TouchableOpacity
          onPress={() => updateCartQuantity(item.product.id, item.quantity - 1)}
          style={styles.quantityButton}
          accessible={true}
          accessibilityLabel={`Decrease quantity of ${item.product.name}`}
        >
          <Text style={styles.quantityButtonText}>-</Text>
        </TouchableOpacity>
        <Text style={[globalStyles.bodyText, styles.quantityText]}>
          {item.quantity}
        </Text>
        <TouchableOpacity
          onPress={() => updateCartQuantity(item.product.id, item.quantity + 1)}
          style={styles.quantityButton}
          disabled={item.quantity >= item.product.quantity}
          accessible={true}
          accessibilityLabel={`Increase quantity of ${item.product.name}`}
        >
          <Text style={styles.quantityButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      <Text style={[globalStyles.bodyText, styles.cartItemPrice]}>
        ${(item.product.price * item.quantity).toFixed(2)}
      </Text>
    </View>
  );

  return (
    <View style={globalStyles.screenContainer}>
      {isLoading && <LoadingIndicator isFullScreen message="loading" />}
      {logoUrl && (
        <Image
          source={{ uri: logoUrl }}
          style={styles.logo}
          accessibilityLabel="App logo"
        />
      )}
      <Text style={globalStyles.title}>{t('sales.title')}</Text>
      <TextInput
        style={globalStyles.textInput}
        placeholder={t('sales.searchPlaceholder')}
        value={searchQuery}
        onChangeText={setSearchQuery}
        accessible={true}
        accessibilityLabel={t('sales.searchPlaceholder')}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      {success && <Text style={styles.success}>{success}</Text>}
      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={[globalStyles.bodyText, styles.noResults]}>
            {t('sales.noResults')}
          </Text>
        }
        contentContainerStyle={styles.listContent}
      />
      <View style={[globalStyles.card, styles.cartContainer]}>
        <Text style={[globalStyles.subtitle, styles.cartTitle]}>
          {t('sales.cart')}
        </Text>
        {cart.length === 0 ? (
          <Text style={[globalStyles.bodyText, styles.cartEmpty]}>
            {t('sales.cartEmpty')}
          </Text>
        ) : (
          <ScrollView style={styles.cartScroll}
            keyboardShouldPersistTaps="handled"
            scrollEventThrottle={16}
            bounces={false}>
            {cart.map((item) => renderCartItem(item))}
            <Text style={[globalStyles.bodyText, styles.total]}>
              {t('sales.total')}: ${calculateTotal()}
            </Text>
          </ScrollView>
        )}
        <Button
          title="sales.createOrder"
          onPress={handleCreateOrder}
          style={globalStyles.primaryButton}
          textStyle={globalStyles.primaryButtonText}
          accessibilityLabel={t('sales.createOrder')}
        />
      </View>
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
  cartContainer: {
    marginTop: 16,
    padding: 16,
  },
  cartTitle: {
    marginBottom: 8,
  },
  cartEmpty: {
    textAlign: 'center',
    marginBottom: 16,
    color: colors.secondaryText,
  },
  cartScroll: {
    maxHeight: 200,
    marginBottom: 16,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cartItemName: {
    flex: 2,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  quantityButton: {
    padding: 8,
    backgroundColor: colors.button,
    borderRadius: 4,
  },
  quantityButtonText: {
    color: colors.buttonText,
    fontSize: 16,
    fontWeight: '600',
  },
  quantityText: {
    marginHorizontal: 12,
  },
  cartItemPrice: {
    flex: 1,
    textAlign: 'right',
  },
  total: {
    fontWeight: '600',
    textAlign: 'right',
    marginTop: 8,
  },
  error: {
    color: '#FF3B30',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  success: {
    color: '#34C759',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
});

export default SalesScreen;