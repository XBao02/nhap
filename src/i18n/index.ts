import {useCallback} from 'react';
import i18n from 'i18next';
import {initReactI18next, useTranslation} from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {STORAGE_KEYS} from '../utils';

import allEn from './en';
import allVi from './vi';

// === i18n/index.ts (File chính để merge tất cả) ===
import {homeEn, homeVi} from '../screens/Home/i18n';
import {
  setupDatabaseEn,
  setupDatabaseVi,
} from '../screens/InitSetupDatabase/i18n';
import {userProfileEn, userProfileVi} from '../screens/InitUserProfile/i18n';

import {loginEn, loginVi} from '../screens/Login/i18n';
import {settingsEn, settingsVi} from '../screens/Settings/i18n';
import {dashboardEn, dashboardVi} from '../contents/Dashboard/i18n';
import {databaseEn, databaseVi} from '../contents/Database/i18n';
import {photoEn, photoVi} from '../contents/Photo/i18n';
import {mainEn, mainVi} from '../screens/Main/i18n';

// Merge tất cả từ điển tiếng Anh
const en = {
  ...allEn,
  ...homeEn,
  ...setupDatabaseEn,
  ...userProfileEn,
  ...loginEn,
  ...settingsEn,
  ...dashboardEn,
  ...databaseEn,
  ...mainEn,
  ...photoEn,
  // Thêm các màn hình khác...
};
// Merge tất cả từ điển tiếng Việt
const vi = {
  ...allVi,
  ...homeVi,
  ...setupDatabaseVi,
  ...userProfileVi,
  ...loginVi,
  ...settingsVi,
  ...dashboardVi,
  ...databaseVi,
  ...mainVi,
  ...photoVi,
  // Thêm các màn hình khác...
};

const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (cb: (lang: string) => void) => {
    const savedLang = await AsyncStorage.getItem(STORAGE_KEYS.APP_LANGUAGE);
    cb(savedLang || 'vi');
  },
  init: () => {},
  cacheUserLanguage: async (lang: string) => {
    await AsyncStorage.setItem(STORAGE_KEYS.APP_LANGUAGE, lang);
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {translation: en},
      vi: {translation: vi},
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: true,
      //có thể truyền được biến json vào như:
      // welcome: 'Chào mừng, {{name}}',
    },
    debug: process.env.NODE_ENV === 'development',
  });

export const useLanguage = () => {
  const {t, i18n} = useTranslation();
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

export default i18n;
