import { useState, useCallback, useEffect } from 'react';
import { Alert, InteractionManager } from 'react-native';
import { useLanguage } from '../../../i18n';
import { userService } from '../../../services';
import { useNavigateTo } from '../../../hooks';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import { NavigationService } from '../../../registries/NavigationService';
import { ChangeUserModal } from '../modals/ChangeUserModal';
import { StorageService, STORAGE_KEYS } from '../../../utils';
import { UserSession, UserInfo } from '../../../types';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../../store/authSlice';

// State interface
interface LoginState {
  // User data
  userInfo: UserInfo | null;
  userName: string;
  email: string;
  selectedUserId: string;

  // Form data
  password: string;
  showPassword: boolean;

  // UI state
  isLoading: boolean;
  errors: any;
  touched: any;

  // Available users
  availableUsers: any[];
}

export const useLogin = () => {
  console.log(`[useLogin][hook] Initializing useLogin hook`);
  const route: any = useRoute();
  const { userId } = route.params || { userId: null };
  console.log(`[useLogin][hook] Route params:`, { userId });

  // Default state
  const DEFAULT_STATE: LoginState = {
    // User data
    userInfo: null,
    userName: '',
    email: '',
    selectedUserId: userId || '',

    // Form data
    password: '',
    showPassword: false,

    // UI state
    isLoading: false,
    errors: {},
    touched: {},

    // Available users
    availableUsers: [],
  };

  const [state, setState] = useState<LoginState>(DEFAULT_STATE);
  console.log(`[useLogin][hook] Initial state set:`, DEFAULT_STATE);
  const { t } = useLanguage();
  console.log(`[useLogin][hook] Language hook initialized`);
  const { navigateTo } = useNavigateTo();
  console.log(`[useLogin][hook] NavigateTo hook initialized`);
  const dispatch = useDispatch();
  console.log(`[useLogin][hook] Redux dispatch initialized`);

  // Update state helper
  const updateState = useCallback((updates: Partial<LoginState>) => {
    console.log(`[useLogin][updateState] Updating state with:`, updates);
    setState(prev => {
      const newState = { ...prev, ...updates };
      console.log(`[useLogin][updateState] New state:`, newState);
      return newState;
    });
  }, []);

  // Reset password and form state on screen focus
  useFocusEffect(
    useCallback(() => {
      console.log(`[useLogin][useFocusEffect] Screen focused, scheduling state reset`);
      const timer = setTimeout(() => {
        console.log(`[useLogin][useFocusEffect] Resetting form state`);
        updateState({
          errors: {},
          touched: {},
        });
      }, 100);

      return () => {
        console.log(`[useLogin][useFocusEffect] Screen unfocused, clearing timer`);
        clearTimeout(timer);
      };
    }, [updateState])
  );

  // Load user data effect
  useEffect(() => {
    const loadUserData = async () => {
      console.log(`[useLogin][useEffect] Loading user data for userId: ${userId || 'none'}`);
      updateState({ isLoading: true });

      try {
        let userInfoTmp: any = null;

        if (userId) {
          console.log(`[useLogin][useEffect] Fetching user by ID: ${userId}`);
          userInfoTmp = await userService.findById(userId);
          console.log(`[useLogin][useEffect] User data fetched:`, userInfoTmp);
        } else {
          console.log(`[useLogin][useEffect] Fetching active users`);
          const activeUsers = await userService.findActiveUsers();
          console.log(`[useLogin][useEffect] Active users fetched:`, activeUsers);
          if (activeUsers.length > 0) {
            userInfoTmp = activeUsers[0];
            console.log(`[useLogin][useEffect] Selected first active user:`, userInfoTmp);
          } else {
            throw new Error('No active users found');
          }
        }

        if (userInfoTmp) {
          const newUserState = {
            userInfo: userInfoTmp,
            userName: userInfoTmp.full_name || userInfoTmp.username,
            email: userInfoTmp.email || `${userInfoTmp.id}@gmail.com`,
            selectedUserId: userInfoTmp.id,
          };
          console.log(`[useLogin][useEffect] Updating state with user data:`, newUserState);
          updateState(newUserState);
        } else {
          throw new Error('User not found');
        }
      } catch (e) {
        console.error(`[useLogin][useEffect] Error loading user data:`, (e as Error).stack);
        Alert.alert(t('common.error'), t('login.errorLoadingUser'));
      } finally {
        console.log(`[useLogin][useEffect] Setting isLoading to false`);
        updateState({ isLoading: false });
      }
    };

    loadUserData();
  }, [userId, updateState, t]);

  // Load available users for change user functionality
  const loadAvailableUsers = useCallback(async () => {
    console.log(`[useLogin][loadAvailableUsers] Loading available users`);
    try {
      updateState({ isLoading: true });
      const users = await userService.findActiveUsers();
      console.log(`[useLogin][loadAvailableUsers] Active users fetched:`, users);
      updateState({ availableUsers: users || [] });
      return users || [];
    } catch (error) {
      console.error(`[useLogin][loadAvailableUsers] Error loading available users:`, (error as Error).stack);
      return [];
    } finally {
      console.log(`[useLogin][loadAvailableUsers] Setting isLoading to false`);
      updateState({ isLoading: false });
    }
  }, [updateState]);

  const handleBiometricAuth = useCallback(() => {
    console.log(`[useLogin][handleBiometricAuth] Showing biometric auth alert`);
    Alert.alert(t('login.biometricAuth'), t('login.biometricAuthDesc'), [
      { text: t('common.cancel'), style: 'cancel', onPress: () => console.log(`[useLogin][handleBiometricAuth] Biometric auth cancelled`) },
      {
        text: t('login.authenticate'),
        onPress: () => console.log(`[useLogin][handleBiometricAuth] Biometric auth triggered`),
      },
    ]);
  }, [t]);

  const validateField = useCallback((field: string, value: string) => {
    console.log(`[useLogin][validateField] Validating field: ${field}, value: ${value}`);
    switch (field) {
      default:
        console.log(`[useLogin][validateField] No validation required for ${field}`);
        return null;
    }
  }, []);

  const handleFieldChange = useCallback(
    (field: string, value: string) => {
      console.log(`[useLogin][handleFieldChange] Field changed: ${field}, value: ${value}`);
      updateState({ [field]: value } as Partial<LoginState>);

      if (state.errors[field]) {
        console.log(`[useLogin][handleFieldChange] Clearing error for ${field}`);
        updateState({
          errors: {
            ...state.errors,
            [field]: null,
          },
        });
      }
    },
    [state.errors, updateState]
  );

  const handleFieldBlur = useCallback(
    (field: string) => {
      console.log(`[useLogin][handleFieldBlur] Field blurred: ${field}`);
      updateState({
        touched: {
          ...state.touched,
          [field]: true,
        },
      });

      const value = field === 'email' ? state.email : state.password;
      console.log(`[useLogin][handleFieldBlur] Validating ${field} with value: ${value}`);
      const error = validateField(field, value);

      if (error) {
        console.log(`[useLogin][handleFieldBlur] Validation error for ${field}: ${error}`);
        updateState({
          errors: {
            ...state.errors,
            [field]: error,
          },
        });
      }
    },
    [state.email, state.password, state.touched, state.errors, validateField, updateState]
  );

  const handleLogin = useCallback(async () => {
    console.log(`[useLogin][handleLogin] Initiating login process`);
    updateState({
      isLoading: true,
      errors: {},
    });

    try {
      if (!state.selectedUserId || !state.password) {
        console.error(`[useLogin][handleLogin] Missing required fields:`, {
          selectedUserId: state.selectedUserId,
          password: state.password,
        });
        throw new Error('User ID and password are required');
      }

      console.log(`[useLogin][handleLogin] Attempting login for userId: ${state.selectedUserId}`);
      const res = await userService.login(state.selectedUserId, state.password);
      console.log(`[useLogin][handleLogin] Login result:`, res);

      if (res.success && res.user) {
        console.log(`[useLogin][handleLogin] Login successful, dispatching loginSuccess`);
        dispatch(loginSuccess({ ...(res.user as UserInfo) }));

        const userSession: UserSession = {
          userId: state.selectedUserId,
          storeId: state.userInfo?.store_id || '',
          roles: [state.userInfo?.role || 'admin_store'],
          lastLogin: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        };
        console.log(`[useLogin][handleLogin] Saving user session:`, userSession);

        await StorageService.saveKey(STORAGE_KEYS.USER_SESSION, JSON.stringify(userSession));
        console.log(`[useLogin][handleLogin] User session saved to AsyncStorage`);

        console.log(`[useLogin][handleLogin] Scheduling navigation to Main with userInfo`);
        InteractionManager.runAfterInteractions(() => {
          console.log(`[useLogin][handleLogin] Navigating to Main with userInfo:`, state.userInfo);
          navigateTo.navigate('Main', { userInfo: state.userInfo });
        });
      } else {
        console.error(`[useLogin][handleLogin] Login failed:`, res.message);
        throw new Error(res.message || 'Login failed');
      }
    } catch (error: any) {
      console.error(`[useLogin][handleLogin] Login error:`, (error as Error).stack);
      updateState({
        errors: {
          general: error.message || t('login.error'),
        },
      });
      Alert.alert(t('common.error'), error.message || t('login.error'));
    } finally {
      console.log(`[useLogin][handleLogin] Setting isLoading to false`);
      updateState({ isLoading: false });
    }
  }, [state.selectedUserId, state.password, state.userInfo, navigateTo, updateState, t, dispatch]);

  const handleSelectUser = useCallback(
    async (selectedUser: any) => {
      console.log(`[useLogin][handleSelectUser] Selecting user:`, selectedUser);
      try {
        updateState({ isLoading: true });

        const newUserState = {
          userInfo: selectedUser,
          userName: selectedUser.full_name || selectedUser.username,
          email: selectedUser.email || `${selectedUser.id}@gmail.com`,
          selectedUserId: selectedUser.id,
          password: '',
          errors: {},
          touched: {},
        };
        console.log(`[useLogin][handleSelectUser] Updating state with new user data:`, newUserState);
        updateState(newUserState);

        console.log(`[useLogin][handleSelectUser] Changed to user: ${selectedUser.username || selectedUser.email}`);
      } catch (error) {
        console.error(`[useLogin][handleSelectUser] Error changing user:`, (error as Error).stack);
        Alert.alert(t('common.error'), t('login.errorChangingUser'));
      } finally {
        console.log(`[useLogin][handleSelectUser] Setting isLoading to false and hiding modal`);
        updateState({ isLoading: false });
        NavigationService.hideModal();
      }
    },
    [t, updateState]
  );

  const handleAddNewUser = useCallback(() => {
    console.log(`[useLogin][handleAddNewUser] Navigating to UserSelection`);
    navigateTo.navigate('UserSelection');
  }, [navigateTo]);

  const handleChangeUserPress = useCallback(async () => {
    console.log(`[useLogin][handleChangeUserPress] Initiating change user process`);
    try {
      const users = await loadAvailableUsers();
      console.log(`[useLogin][handleChangeUserPress] Available users loaded:`, users);

      console.log(`[useLogin][handleChangeUserPress] Showing ChangeUserModal`);
      NavigationService.showModal(ChangeUserModal, {
        users: users,
        selectedUserId: state.selectedUserId,
        onSelectUser: handleSelectUser,
        onAddNewUser: handleAddNewUser,
        isLoading: false,
      });
    } catch (error) {
      console.error(`[useLogin][handleChangeUserPress] Error showing change user modal:`, (error as Error).stack);
      Alert.alert(t('common.error'), t('login.errorLoadingUsers'));
    }
  }, [loadAvailableUsers, state.selectedUserId, handleSelectUser, handleAddNewUser, t]);

  const setShowPassword = useCallback(
    (show: boolean) => {
      console.log(`[useLogin][setShowPassword] Setting showPassword to: ${show}`);
      updateState({ showPassword: show });
    },
    [updateState]
  );

  console.log(`[useLogin][hook] Returning login hook data`);
  return {
    userName: state.userName,
    email: state.email,
    password: state.password,
    showPassword: state.showPassword,
    isLoading: state.isLoading,
    errors: state.errors,
    touched: state.touched,
    handleBiometricAuth,
    handleFieldChange,
    handleFieldBlur,
    handleLogin,
    handleChangeUserPress,
    handleSelectUser,
    handleAddNewUser,
    setShowPassword,
  };
};

export default useLogin;