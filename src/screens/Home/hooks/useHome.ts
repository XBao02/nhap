import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useHome = () => {
  const { t, i18n } = useTranslation();
  const toggleLanguage = useCallback(async () => {
    const newLang = i18n.language === 'vi' ? 'en' : 'vi';
    await i18n.changeLanguage(newLang);
    await AsyncStorage.setItem('APP_LANGUAGE', newLang);
  }, [i18n]);

  return {
    t,
    i18n,
    toggleLanguage,
  };
};

export default useHome;