import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Image, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
// import { RNCamera } from 'react-native-camera';
import Button from '../components/Button';
import LoadingIndicator from '../components/LoadingIndicator';
import { globalStyles } from '../styles/globalStyles';
import { colors } from '../styles/colors';

interface QRScreenProps {
  logoUrl?: string;
}

const QRScreen: React.FC<QRScreenProps> = ({ logoUrl }) => {
  const { t } = useTranslation();
  const [qrCode, setQrCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = () => {
    setIsLoading(true);
    setError('');
    // Mock API call
    setTimeout(() => {
      if (qrCode) {
        console.log('Generate QR with code:', qrCode);
        setScanResult(`Generated: ${qrCode}`);
      } else {
        setError(t('qr.error'));
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleBarCodeRead = ({ data }: { data: string }) => {
    if (isScanning && !scanResult) {
      setIsScanning(false);
      setScanResult(t('qr.scanSuccess') + `: ${data}`);
      setIsLoading(true);
      // Mock API call
      setTimeout(() => {
        console.log('Scanned QR:', data);
        setIsLoading(false);
      }, 1000);
    }
  };

  const startScanning = () => {
    setIsScanning(true);
    setScanResult('');
    setError('');
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
      <Text style={globalStyles.title}>{t('qr.scanQR')}</Text>
      {isScanning ? (
        <View style={styles.cameraContainer}>
          {/* <RNCamera
            style={styles.camera}
            onBarCodeRead={handleBarCodeRead}
            captureAudio={false}
            barCodeTypes={[RNCamera.Constants.BarCodeType.qr]}
          >
            <View style={styles.cameraOverlay}>
              <View style={styles.scanArea} />
            </View>
          </RNCamera> */}
          <Button
            title="cancel"
            onPress={() => setIsScanning(false)}
            style={globalStyles.secondaryButton}
            textStyle={globalStyles.secondaryButtonText}
            accessibilityLabel={t('status.cancel')}
          />
        </View>
      ) : (
        <>
          <Text style={[globalStyles.secondaryText, styles.instruction]}>
            {t('qr.scanInstruction')}
          </Text>
          {scanResult && (
            <Text style={[globalStyles.bodyText, styles.scanResult]}>
              {scanResult}
            </Text>
          )}
          {error && <Text style={styles.error}>{error}</Text>}
          <TextInput
            style={globalStyles.textInput}
            placeholder={t('qr.inputQR')}
            value={qrCode}
            onChangeText={setQrCode}
            accessibilityLabel={t('qr.inputQR')}
          />
          <Button
            title="qr.generate"
            onPress={handleGenerate}
            style={globalStyles.primaryButton}
            textStyle={globalStyles.primaryButtonText}
            accessibilityLabel={t('qr.generate')}
          />
          <Button
            title="qr.scanQR"
            onPress={startScanning}
            style={[globalStyles.primaryButton, styles.scanButton]}
            textStyle={globalStyles.primaryButtonText}
            accessibilityLabel={t('qr.scanQR')}
          />
        </>
      )}
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
  instruction: {
    marginBottom: 16,
    textAlign: 'center',
  },
  scanResult: {
    marginBottom: 16,
    textAlign: 'center',
    color: '#34C759',
  },
  error: {
    color: '#FF3B30',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  cameraContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: colors.button,
    backgroundColor: 'transparent',
  },
  scanButton: {
    marginTop: 16,
  },
});

export default QRScreen;