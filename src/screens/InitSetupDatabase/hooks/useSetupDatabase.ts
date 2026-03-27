import {useState, useCallback} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {DatabaseManager, schemaConfigurations} from '../../../database';

import {userService, storeService, enterpriseService} from '../../../services';

import {useLanguage} from '../../../i18n';
import {useNavigateTo} from '../../../hooks';
import {randomId} from '../../../utils';
import {STORAGE_KEYS} from '../../../utils/storage';

interface SetupDatabaseState {
  isLoading: boolean;
  error: string | null;
}

export const useSetupDatabase = () => {
  const {t} = useLanguage();
  const {navigateTo} = useNavigateTo();
  const [state, setState] = useState<SetupDatabaseState>({
    isLoading: false,
    error: null,
  });

  /**
   * Tạo các file và các bảng csdl tương ứng theo vai trò thiết lập
   * Tạo các bảng ghi dữ liệu ban đầu cho điểm bán
   * Gồm Mã doanh nghiệp
   * Mã Điểm bán
   * Mã user Admin
   */
  const initializeDatabase = useCallback(
    async (roles: string[], industries: string[]) => {
      console.log(
        'initializeDatabase called with roles:',
        roles,
        'industries:',
        industries,
      );

      setState(prev => ({...prev, isLoading: true}));

      console.log('Initializing database CORE from useSetupDatabase...');

      // Tạo một cơ sở dữ liệu core ban đầu để lưu user mà thôi
      await DatabaseManager.initializeCoreConnection()

      console.log('Database useSetupDatabase initialized successfully');

      try {
        // database đã khởi tạo thành công (tạo được csdl nhưng chưa tạo user)
        // nếu mở ứng dụng lên mà đã tồn tại user, store, enterprise trước có nghĩa là db đã khởi tạo rồi
        // lúc này không cần tạo lại csdl mà chỉ cần lấy một bảng ghi user đầu tiên lấy được

        const user = await userService.getFirst();
        console.log('User found:', user);

        if (user && user.id) {
          // chuyển vào login với user đã có
          navigateTo.navigate('Login', {userId: user.id});
          // không cần tạo mới user nữa mà chỉ dùng một user ngẫu nhiên này mà login nhé
          return;
        }
        // thực hiện tạo các dữ liệu của doanh nghiệp, điểm bán, và user quản trị mặt định ban đầu
        // Khởi tạo doanh nghiệp mới
        const enterprise: any = await enterpriseService.create({
          name: 'Hộ kinh doanh cá thể ABC',
          business_type: 'hkd',
          status: 'pending',
          subscription_plan: 'basic',
        });

        // Khởi tạo cửa hàng mới
        const store: any = await storeService.create({
          enterprise_id: enterprise.id,
          name: 'Cửa hàng chính',
          store_type: 'retail',
          timezone: 'Asia/Ho_Chi_Minh',
          currency: 'VND',
          tax_rate: 0,
          status: 'active',
          sync_enabled: true,
        });

        // Khởi tạo user admin mặc định
        const newUser = await userService.create({
          store_id: store.id,
          username: `admin_${randomId(3)}`,
          password_hash: 'temp_password_hash', // Sẽ cần thay đổi ngay
          full_name: 'Quản trị viên',
          role: 'admin',
          is_active: true,
          failed_login_attempts: 0,
        });

        const userId: string = newUser.id || '';
        // Lưu SetupConfig vào AsyncStorage
        const setupConfig = {
          installed: true,
          field: industries[0] || 'retail',
          role: roles[0] || 'admin',
          databaseList: Object.keys(schemaConfigurations),
          version: '1.0.0', // Có thể thay đổi tùy theo phiên bản ứng dụng
          setupDate: new Date().toISOString(),
        };

        // Lưu vào AsyncStorage
        console.log('Saving to AsyncStorage...');
        await AsyncStorage.multiSet([
          [STORAGE_KEYS.SETUP_CONFIG, JSON.stringify(setupConfig)],
          // [STORAGE_KEYS.USER_SESSION, JSON.stringify(userSession)],
          [STORAGE_KEYS.IS_SETTING, 'true'],
          [STORAGE_KEYS.ROLES, JSON.stringify(roles)],
          [STORAGE_KEYS.INDUSTRIES, JSON.stringify(industries)],
          [
            STORAGE_KEYS.DATABASE,
            JSON.stringify(Object.keys(schemaConfigurations)),
          ],
          [STORAGE_KEYS.STORE_ID, store.id],
          [STORAGE_KEYS.USER_ID, userId],
        ]);

        console.log('Storage operations completed');

        setState(prev => ({...prev, isLoading: false}));

        console.log('Navigating to UserProfile screen', userId);
        // chuyển đến màn hình hoàn thiện thông tin doanh nghiệp
        // thông tin cửa hàng
        // thông tin user admin của điểm bán
        // có thể tạo thêm thông tin user phân quyền trong màn hình phân quyền trong
        navigateTo.navigate('UserProfile', {userId});

        console.log('Navigation completed');
      } catch (error) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error:
            error instanceof Error
              ? error?.message
              : t('database.error.unknown'),
        }));
      }
    },
    [t, navigateTo],
  );
  return {...state, initializeDatabase};
};
