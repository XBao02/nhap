// --- File: src/screens/Setup/hooks/useSetup.ts ---
import {useState, useCallback, useEffect} from 'react';
import {useLanguage} from '../../../i18n';
import {useNavigateTo} from '../../../hooks';
import {userService, storeService, enterpriseService} from '../../../services';
import {AppError} from '../../../types';

interface SetupFormData {
  username: string;
  password: string;
  email: string;
  storeName: string;
  enterpriseName: string;
  address?: string;
  phone?: string;
}

interface SetupState {
  formData: SetupFormData;
  isLoading: boolean;
  error: AppError | null;
  isPasswordChanged: boolean;
  storeId?: string; // Thêm để lưu storeId
  enterpriseId?: string; // Thêm để lưu enterpriseId
}

export const useSetup = (userId: string) => {
  const {t} = useLanguage();
  const {navigateTo} = useNavigateTo();
  // tái sử dụng phiên đã mở database

  const [state, setState] = useState<SetupState>({
    formData: {
      username: '',
      password: '',
      email: '',
      storeName: '',
      enterpriseName: '',
    },
    isLoading: false,
    error: null,
    isPasswordChanged: false,
    storeId: undefined,
    enterpriseId: undefined,
  });

  //------------------------------------------
  // Load user data khi component mount hoặc user_id thay đổi
  useEffect(() => {
    const loadData = async () => {
      if (!userId) {
        setState(prev => ({
          ...prev,
          error: {type: 'VALIDATION', message: t('error.invalid_user_id')},
        }));
        return;
      }
      setState(prev => ({...prev, isLoading: true, error: null}));

      try {
        const user = await userService.findById(userId);
        if (!user) throw {type: 'SESSION', message: t('error.user_not_found')};

        const store = await storeService.findById(user.store_id);
        if (!store)
          throw {type: 'DATABASE', message: t('error.store_not_found')};

        const enterprise = await enterpriseService.findById(
          store.enterprise_id,
        );
        if (!enterprise)
          throw {type: 'DATABASE', message: t('error.enterprise_not_found')};

        setState(prev => ({
          ...prev,
          formData: {
            username: user.username || '',
            password: '', // Không load password_hash, force change
            email: user.email || '',
            storeName: store.name || '',
            enterpriseName: enterprise.name || '',
          },
          isPasswordChanged: user.password_hash === 'temp_password_hash',
          storeId: user.store_id,
          enterpriseId: store.enterprise_id,
          isLoading: false,
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error as AppError,
        }));
      }
    };

    loadData();
  }, [userId, t]);

  //------------------------------------------

  const handleInputChange = useCallback(
    (field: keyof SetupFormData, value: string) => {
      setState(prev => ({
        ...prev,
        formData: {...prev.formData, [field]: value},
      }));
    },
    [],
  );

  const validateForm = (form: SetupFormData): AppError | null => {
    if (!form.username)
      return {type: 'VALIDATION', message: t('error.required_username')};
    if (!form.password)
      return {type: 'VALIDATION', message: t('error.required_password')};
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email))
      return {type: 'VALIDATION', message: t('error.invalid_email')};
    if (!form.storeName || !form.enterpriseName)
      return {type: 'VALIDATION', message: t('error.required_names')};
    return null;
  };

  const handleSave = useCallback(async () => {
    const validationError = validateForm(state.formData);
    if (validationError) {
      setState(prev => ({...prev, error: validationError}));
      return;
    }
    if (state.isPasswordChanged && state.formData.password === '') {
      setState(prev => ({
        ...prev,
        error: {type: 'VALIDATION', message: t('error.force_password_change')},
      }));
      return;
    }

    setState(prev => ({...prev, isLoading: true, error: null}));

    try {
      console.log('Start update', userId, state.storeId, state.enterpriseId);

      await userService.update(userId, {
        username: state.formData.username,
        email: state.formData.email,
      });

      const passwordHash = state.isPasswordChanged
        ? await userService.hashPassword(state.formData.password)
        : null;
        
      if (passwordHash) {
        await userService.updatePassword(userId, passwordHash);
      }

      await storeService.update(state.storeId, {
        name: state.formData.storeName,
      });
      await enterpriseService.update(state.enterpriseId, {
        name: state.formData.enterpriseName,
      });

      // Update session if needed
      navigateTo.navigate('Login', {userId});
    } catch (error) {
      setState(prev => ({...prev, isLoading: false, error: error as AppError}));
    }
  }, [state.formData, state.isPasswordChanged, t, navigateTo, userId]);

  return {
    ...state,
    handleInputChange,
    handleSave,
  };
};
