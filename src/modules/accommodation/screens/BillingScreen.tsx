import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../navigation/types'; // Đường dẫn này có thể điều chỉnh theo project

type DemoScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const DemoScreen = () => {
  const navigation = useNavigation<DemoScreenNavigationProp>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đây là màn hình Demo</Text>
      <Button title="Quay về" onPress={() => navigation.goBack()} />
    </View>
  );
};

export default DemoScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
