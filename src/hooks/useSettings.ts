import {useState, useEffect, useCallback} from 'react';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useLanguage} from '../i18n';
import {useTheme} from '../styles/ThemeContext';
import {STORAGE_KEYS} from '../utils';

interface Industry {
  id: string;
  name: string;
}

interface Role {
  id: string;
  name: string;
}

// Cấu hình nhóm database theo ngành nghề
const industryDbMap: Record<string, string[]> = {
  fnb: ['core', 'fnb', 'oms', 'payment', 'crm', 'inventory', 'product'],
  retail: ['core', 'oms', 'payment', 'crm', 'inventory', 'product', 'scm'],
  spa: ['core', 'crm', 'oms', 'payment', 'product'],
  pharmacy: ['core', 'inventory', 'product', 'crm', 'oms', 'payment'],
  general: ['core', 'crm', 'payment', 'product'],
  chain: [
    'core',
    'crm',
    'oms',
    'inventory',
    'scm',
    'analytics',
    'product',
    'payment',
  ],
};

export const useSettings = () => {
  const {t} = useLanguage();
  const {toggleTheme} = useTheme();

  const saveToStorage = async (key: string, value: any) => {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  };

  const loadFromStorage = async (
    key: string,
    defaultVal: string[] = [],
  ): Promise<string[]> => {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : defaultVal;
  };

  const industries: Industry[] = [
    {id: 'retail', name: 'settings.industries.retail'},
    {id: 'fnb', name: 'settings.industries.fnb'},
    {id: 'spa', name: 'settings.industries.spa'},
    {id: 'pharmacy', name: 'settings.industries.pharmacy'},
    {id: 'general', name: 'settings.industries.general'},
    {id: 'chain', name: 'settings.industries.chain'},
    {id: 'others', name: 'settings.industries.others'},
  ];

  const roles: Role[] = [
    {id: 'trial', name: 'settings.roles.trial'},
    {id: 'individual', name: 'settings.roles.individual'},
    {id: 'employee', name: 'settings.roles.employee'},
    {id: 'manager', name: 'settings.roles.manager'},
    {id: 'owner', name: 'settings.roles.owner'},
    {id: 'accountant', name: 'settings.roles.accountant'},
  ];

  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isSettings, setIsSettings] = useState<boolean>(false);

  const handleIndustryChange = useCallback((industryIds: string[]) => {
    setSelectedIndustries(industryIds);
  }, []);

  const handleRoleChange = useCallback((roleIds: string[]) => {
    setSelectedRoles(roleIds);
  }, []);

  const handleThemeToggle = useCallback(() => {
    toggleTheme();
  }, [toggleTheme]);

  const syncWithServer = async () => {
    // Gửi về backend nếu cần trong tương lai
  };

  const loadSettings = async () => {
    const industriesSeleted = await loadFromStorage(STORAGE_KEYS.INDUSTRIES, ['retail']);
    const rolesSelected = await loadFromStorage(STORAGE_KEYS.ROLES, ['trial']);
    const savedSettings = await loadFromStorage(STORAGE_KEYS.IS_SETTING);
    setSelectedIndustries(industriesSeleted);
    setSelectedRoles(rolesSelected);

    const isSettingSaved =
      savedSettings.includes(STORAGE_KEYS.IS_SETTING) &&
      savedSettings.includes(STORAGE_KEYS.ROLES);
    setIsSettings(isSettingSaved);
    console.log('isSettingSaved', isSettingSaved, savedSettings);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveSettings = useCallback(async () => {
    try {
      if (!selectedIndustries.length || !selectedRoles.length) {
        Toast.show({
          text1: 'Vui lòng chọn ngành nghề và vai trò',
          type: 'error',
        });
        return;
      }

      await saveToStorage(STORAGE_KEYS.INDUSTRIES, selectedIndustries);
      await saveToStorage(STORAGE_KEYS.ROLES, selectedRoles);
      const newSettings = [STORAGE_KEYS.INDUSTRIES, STORAGE_KEYS.ROLES];
      await saveToStorage(STORAGE_KEYS.IS_SETTING, newSettings);

      const field = selectedIndustries[0];
      const role = selectedRoles[0];
      const databaseList = industryDbMap[field] || ['core', 'crm', 'product'];

      // Ghi file cấu hình setup chung để dùng ở bước tiếp theo
      const setupData = {
        installed: true,
        field,
        role,
        databaseList,
      };

      await saveToStorage('mypos.setup', setupData);

      setIsSettings(true);
      await syncWithServer();

      Toast.show({
        text1: t('settings.savedSuccessfully'),
        type: 'success',
        position: 'top',
        visibilityTime: 2000,
      });
    } catch (error) {
      console.error('Save settings error:', error);
      Toast.show({
        text1: t('settings.saveError'),
        type: 'error',
      });
    }
  }, [selectedIndustries, selectedRoles]);

  return {
    isSettings,
    industries,
    roles,
    selectedIndustries,
    selectedRoles,
    handleIndustryChange,
    handleRoleChange,
    handleThemeToggle,
    handleSaveSettings,
  };
};

export default useSettings;
