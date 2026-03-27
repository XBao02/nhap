import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { globalStyles } from '../styles/globalStyles';
import { colors } from '../styles/colors';

interface OrderItemProps {
  orderId: string;
  date: string;
  status: 'Ready to Use' | 'Used' | 'Success';
  amount: string | number;
  productName?: string;
  logoUrl?: string;
}

const OrderItem: React.FC<OrderItemProps> = ({
  orderId,
  date,
  status,
  amount,
  productName,
  logoUrl,
}) => {
  const { t } = useTranslation();

  const getStatusColor = () => {
    switch (status) {
      case 'Success':
        return '#34C759';
      case 'Used':
        return '#FF3B30';
      case 'Ready to Use':
        return colors.button;
      default:
        return colors.text;
    }
  };

  return (
    <View
      style={[globalStyles.card, styles.container]}
      accessible={true}
      accessibilityLabel={`${t('history.salesHistory')} ${orderId}`}
    >
      {logoUrl && (
        <Image
          source={{ uri: logoUrl }}
          style={styles.logo}
          accessibilityLabel={`Order ${orderId} logo`}
        />
      )}
      <View style={styles.content}>
        <Text style={[globalStyles.bodyText, styles.orderId]}>
          {t('status.receiptNumber')}: {orderId}
        </Text>
        {productName && (
          <Text style={[globalStyles.bodyText, styles.productName]}>
            {productName}
          </Text>
        )}
        <Text style={[globalStyles.caption, styles.date]}>{date}</Text>
        <View style={styles.statusRow}>
          <Text style={[globalStyles.bodyText, styles.statusLabel]}>
            {t('status.status')}:
          </Text>
          <Text style={[globalStyles.bodyText, { color: getStatusColor() }]}>
            {t(`status.${status.toLowerCase().replace(/\s/g, '')}`)}
          </Text>
        </View>
        <Text style={[globalStyles.bodyText, styles.amount]}>
          {t('product.price')}: {amount}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  logo: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  orderId: {
    fontWeight: '600',
    marginBottom: 4,
  },
  productName: {
    marginBottom: 4,
  },
  date: {
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusLabel: {
    marginRight: 8,
  },
  amount: {
    fontWeight: '600',
  },
});

// export default OrderItem;
export default React.memo(OrderItem);