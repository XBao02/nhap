import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { globalStyles } from '../styles/globalStyles';
import { colors } from '../styles/colors';

interface ProductCardProps {
  name: string;
  brand?: string;
  price: string | number;
  description?: string;
  date?: string;
  logoUrl?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({
  name,
  brand,
  price,
  description,
  date,
  logoUrl,
}) => {
  const { t } = useTranslation();

  return (
    <View
      style={[globalStyles.card, styles.container]}
      accessible={true}
      accessibilityLabel={`${t('product.productInfo')}: ${name}`}
    >
      {logoUrl && (
        <Image
          source={{ uri: logoUrl }}
          style={styles.logo}
          accessibilityLabel={`${name} logo`}
        />
      )}
      <Text style={[globalStyles.title, styles.name]}>{name}</Text>
      {brand && (
        <Text style={[globalStyles.secondaryText, styles.brand]}>{brand}</Text>
      )}
      <Text style={[globalStyles.bodyText, styles.price]}>
        {t('product.price')}: {price}
      </Text>
      {description && (
        <Text style={[globalStyles.bodyText, styles.description]}>
          {description}
        </Text>
      )}
      {date && (
        <Text style={[globalStyles.caption, styles.date]}>{date}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    marginBottom: 12,
    alignSelf: 'center',
  },
  name: {
    marginBottom: 8,
  },
  brand: {
    marginBottom: 8,
  },
  price: {
    fontWeight: '600',
  },
  description: {
    marginTop: 8,
  },
  date: {
    marginTop: 8,
  },
});

// export default ProductCard;
export default React.memo(ProductCard);