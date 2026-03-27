import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Image } from 'react-native';

import { useTranslation } from 'react-i18next';
import Button from '../components/Button';
import LoadingIndicator from '../components/LoadingIndicator';
import { globalStyles } from '../styles/globalStyles';
import { colors } from '../styles/colors';

interface SalesPointsScreenProps {
  logoUrl?: string;
}

const SalesPointsScreen: React.FC<SalesPointsScreenProps> = ({ logoUrl }) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAddSalePoint = () => {
    setError('');
    setSuccess('');
    if (!name || !address) {
      setError(t('addSalePoint.error'));
      return;
    }

    setIsLoading(true);
    // Mock API call
    setTimeout(() => {
      console.log('Add Sale Point:', { name, address, phone, status, location });
      setSuccess(t('addSalePoint.success'));
      // Reset form
      setName('');
      setAddress('');
      setPhone('');
      setStatus('Active');
      setLocation('');
      setIsLoading(false);
    }, 1000);
  };

  return (
    <View style={globalStyles.centeredContainer}>
      {isLoading && <LoadingIndicator isFullScreen message="loading" />}
      {logoUrl && (
        <Image
          source={{ uri: logoUrl }}
          style={styles.logo}
          accessibilityLabel="App logo"
        />
      )}
      <Text style={globalStyles.title}>{t('addSalePoint.title')}</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      {success && <Text style={styles.success}>{success}</Text>}
      <TextInput
        style={globalStyles.textInput}
        placeholder={t('addSalePoint.name')}
        value={name}
        onChangeText={setName}
        accessible={true}
        accessibilityLabel={t('addSalePoint.name')}
      />
      <TextInput
        style={globalStyles.textInput}
        placeholder={t('addSalePoint.address')}
        value={address}
        onChangeText={setAddress}
        accessible={true}
        accessibilityLabel={t('addSalePoint.address')}
      />
      <TextInput
        style={globalStyles.textInput}
        placeholder={t('addSalePoint.phone')}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        accessible={true}
        accessibilityLabel={t('addSalePoint.phone')}
      />
      <View style={styles.pickerContainer}>
        <Text style={[globalStyles.bodyText, styles.pickerLabel]}>
          {t('addSalePoint.status')}
        </Text>
        {/* <Picker
          selectedValue={status}
          style={styles.picker}
          onValueChange={(itemValue) => setStatus(itemValue as 'Active' | 'Inactive')}
          accessible={true}
          accessibilityLabel={t('addSalePoint.status')}
        >
          <Picker.Item label={t('addSalePoint.active')} value="Active" />
          <Picker.Item label={t('addSalePoint.inactive')} value="Inactive" />
        </Picker> */}
      </View>
      <TextInput
        style={globalStyles.textInput}
        placeholder={t('addSalePoint.location')}
        value={location}
        onChangeText={setLocation}
        accessible={true}
        accessibilityLabel={t('addSalePoint.location')}
      />
      <Button
        title="addSalePoint.addButton"
        onPress={handleAddSalePoint}
        style={globalStyles.primaryButton}
        textStyle={globalStyles.primaryButtonText}
        accessibilityLabel={t('addSalePoint.addButton')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
    marginBottom: 24,
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
  pickerContainer: {
    width: '100%',
    marginBottom: 16,
  },
  pickerLabel: {
    marginBottom: 8,
  },
  picker: {
    width: '100%',
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
});

export default SalesPointsScreen;