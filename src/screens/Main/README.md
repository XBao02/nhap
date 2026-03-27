# Hệ thống Menu Config Động với Navigation

## Tổng quan

Hệ thống này cho phép bạn định nghĩa menu động với nhiều loại navigation khác nhau:

- **Internal Navigation**: Điều hướng trong MainLayout (thay đổi nội dung chính)
- **External Navigation**: Điều hướng đến màn hình khác ngoài MainLayout
- **Modal Navigation**: Hiển thị modal/popup
- **Action Navigation**: Thực hiện các action tùy chỉnh

## Cấu trúc Files

```
src/
├── contents/
│   │   ├── Dashboard             # Nội dung Dashboard
│   │   ├── ...                   # Các nội dung khác
│   │   └── Database              # Nội dung Database
├── registries/
│   ├── NavigationService.tsx     # Xử lý điều hướng
│   └── screenRegistry.tsx        # Đăng ký màn hình
├── screens/
│   ├── HomeScreen.tsx            # Màn hình chính
│   ├── LoginScreen.tsx           # Màn hình login
│   ├── ProfileScreen.tsx         # Màn hình profile
│   ├── Main/
│   │   ├── hooks/
│   │   │   └── useMainLayout.ts  # Hook quản lý layout
│   │   ├── menu/
│   │   │   ├── menuConfig.ts     # Cấu hình menu động
│   │   │   ├── menuTypes.ts      # Type definitions
│   │   │   └── menuUtils.ts      # Modal feedback
│   │   ├── modals/
│   │   │   ├── HelpModal.tsx     # Modal help
│   │   │   └── FeedbackModal.tsx # Modal feedback
│   │   ├── MainScreen.tsx        # Layout chính
│   │   ├── Sidebar.tsx           # Sidebar component
│   │   └── sidebarStyles.ts      # Các style trong menu
│   └── SettingsScreen.tsx        # Màn hình settings│
└── App.tsx                       # App root với 
```

## Cách sử dụng

### 1. Thêm màn hình Internal (trong MainLayout)

**Bước 1**: Tạo component màn hình
```typescript
// screens/Analytics/AnalyticsContent.tsx
export const AnalyticsContent: React.FC = () => {
  return (
    <View>
      <Text>Analytics Screen</Text>
    </View>
  );
};
```

**Bước 2**: Đăng ký trong screenRegistry.ts
```typescript
import {AnalyticsContent} from '/src/contents/Analytics/AnalyticsContent';

export const screenRegistry: Record<string, ScreenInfo> = {
  // ... existing screens
  Analytics: {
    component: AnalyticsContent,
    props: {},
  },
};
```

**Bước 3**: Thêm vào menuConfig.ts
```typescript
{
  id: 'analytics',
  title: 'Analytics',
  icon: 'analytics',
  navigationType: 'internal',
  screen: 'Analytics',
  visible: true,
}
```

### 2. Thêm màn hình External (ngoài MainLayout)

**Bước 1**: Tạo màn hình trong React Navigation stack (App.tsx)
```typescript
<Stack.Screen 
  name="Reports" 
  component={ReportsScreen}
  options={{title: 'Reports'}}
/>
```

**Bước 2**: Thêm vào menuConfig.ts
```typescript
{
  id: 'reports',
  title: 'Reports',
  icon: 'assessment',
  navigationType: 'external',
  navigationParams: {
    screenName: 'Reports',
    params: {section: 'monthly'},
  },
  visible: true,
}
```

### 3. Thêm Modal

**Bước 1**: Tạo modal component
```typescript
// modals/CustomModal.tsx
export const CustomModal: React.FC<{onClose: () => void}> = ({onClose}) => {
  return (
    <View>
      <Text>Custom Modal Content</Text>
      <TouchableOpacity onPress={onClose}>
        <Text>Close</Text>
      </TouchableOpacity>
    </View>
  );
};
```

**Bước 2**: Thêm vào menuConfig.ts
```typescript
{
  id: 'custom-modal',
  title: 'Custom Modal',
  icon: 'open-in-new',
  navigationType: 'modal',
  navigationParams: {
    modalComponent: () => require('./modals/CustomModal').CustomModal,
    modalProps: {title: 'Custom Title'},
  },
  visible: true,
}
```

### 4. Thêm Action

```typescript
{
  id: 'export-data',
  title: 'Export Data',
  icon: 'file-download',
  navigationType: 'action',
  navigationParams: {
    actionHandler: async () => {
      // Custom logic
      console.log('Exporting data...');
      await exportData();
      Alert.alert('Success', 'Data exported!');
    },
  },
  visible: true,
}
```

## Advanced Features

### Menu với Children (Submenu)

```typescript
{
  id: 'reports',
  title: 'Reports',
  icon: 'assessment',
  navigationType: 'internal',
  screen: 'Reports',
  children: [
    {
      id: 'monthly-report',
      title: 'Monthly Report',
      icon: 'calendar-month',
      navigationType: 'internal',
      screen: 'MonthlyReport',
      parent: 'reports',
      visible: true,
    },
    {
      id: 'yearly-report',
      title: 'Yearly Report',
      icon: 'calendar-year',
      navigationType: 'external',
      navigationParams: {
        screenName: 'YearlyReport',
      },
      parent: 'reports',
      visible: true,
    },
  ],
  visible: true,
}
```

### Dynamic Visibility

```typescript
{
  id: 'admin-panel',
  title: 'Admin Panel',
  icon: 'admin-panel-settings',
  navigationType: 'external',
  navigationParams: {screenName: 'AdminPanel'},
  visible: () => {
    // Dynamic visibility based on user role
    return getCurrentUser()?.role === 'admin';
  },
}
```

### Badge Support

```typescript
{
  id: 'notifications',
  title: 'Notifications',
  icon: 'notifications',
  navigationType: 'external',
  navigationParams: {screenName: 'Notifications'},
  badge: getUnreadNotificationsCount(), // số hoặc string
  badgeColor: '#ff4444',
  visible: true,
}
```

### Permissions

```typescript
{
  id: 'user-management',
  title: 'User Management',
  icon: 'people',
  navigationType: 'external',
  navigationParams: {screenName: 'UserManagement'},
  requireAuth: true,
  permissions: ['user.read', 'user.write'],
  visible: true,
}
```

## Programmatic Navigation

### Từ Component bất kỳ

```typescript
import {NavigationService} from '/src/reistries/NavigationService';

// External navigation
NavigationService.navigate('external', {
  screenName: 'Profile',
  params: {userId: '123'},
});

// Modal
NavigationService.navigate('modal', {
  modalComponent: () => require('./CustomModal').CustomModal,
  modalProps: {data: someData},
});

// Action
NavigationService.navigate('action', {
  actionHandler: () => {
    console.log('Custom action executed');
  },
});
```

### Từ MainLayout

```typescript
import {useMainLayout} from '/src/screens/Main/hooks/useMainScreen';

const SomeComponent = () => {
  const {navigateToScreen, currentScreen} = useMainScreen();
  // Internal navigation
  navigateToScreen('Dashboard');  
  // Get current screen
  console.log('Current:', currentScreen);
};
```

## Utility Functions

### Cập nhật Menu động

```typescript
import {updateMenuItemVisibility, updateMenuItemBadge} from './menuConfig';

// Ẩn/hiện menu item
updateMenuItemVisibility('notifications', false);

// Cập nhật badge
updateMenuItemBadge('notifications', 10);
```

### Lấy Menu Items

```typescript
import {getMenuItemById, getMenuItemsByType} from './menuConfig';

// Lấy menu item theo ID
const dashboardItem = getMenuItemById('dashboard');

// Lấy tất cả external navigation items
const externalItems = getMenuItemsByType('external');
```

## Best Practices

1. **Tổ chức Code**: Giữ logic navigation riêng biệt với UI components
2. **Error Handling**: Luôn có fallback cho trường hợp màn hình không tồn tại
3. **Performance**: Sử dụng lazy loading cho các màn hình nặng
4. **UX**: Đóng sidebar sau khi navigate trên mobile
5. **Accessibility**: Đảm bảo tất cả menu items có thể truy cập được
6. **Testing**: Test tất cả navigation paths

## Troubleshooting

### Màn hình không load
- Kiểm tra screenRegistry có đăng ký màn hình chưa
- Kiểm tra import path có đúng không
- Xem console log để debug

### External navigation không hoạt động
- Kiểm tra NavigationService.setNavigationRef đã được gọi chưa
- Kiểm tra screen name có đúng với stack navigator không

### Modal không hiển thị
- Kiểm tra NavigationService.setModalHandler đã được setup chưa
- Kiểm tra modal component có export đúng không