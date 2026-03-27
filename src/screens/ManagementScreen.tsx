import React, {useRef} from 'react';
import {View, StyleSheet, Animated, TouchableOpacity} from 'react-native';
import {useSettings, useNavigateTo} from '../hooks';
import {useTheme} from '../styles/ThemeContext';
import {
  MenuItem,
  Sidebar,
  defaultMenuConfig,
  useSidebar,
  sidebarStyles,
} from '../components/menu';
import Icon from '@react-native-vector-icons/material-icons';
import {isTablet} from '../utils';


// Custom menu cho trang quản lý
export const managementMenuConfig: MenuItem[] = [
  {
    id: 'dashboard',
    name: 'menu.dashboard',
    icon: 'dashboard',
    level: 1,
    screen: 'Dashboard',
    permission: {roles: ['manager', 'owner']},
    order: 1,
  },
  {
    id: 'users',
    name: 'menu.userManagement',
    icon: 'people',
    level: 1,
    permission: {roles: ['owner']},
    order: 2,
    children: [
      {
        id: 'user-list',
        name: 'menu.userList',
        icon: 'list',
        level: 2,
        screen: 'UserList',
        parent: 'users',
        permission: {roles: ['owner']},
        order: 1,
      },
      {
        id: 'user-roles',
        name: 'menu.userRoles',
        icon: 'admin_panel_settings',
        level: 2,
        parent: 'users',
        permission: {roles: ['owner']},
        order: 2,
        children: [
          {
            id: 'role-management',
            name: 'menu.roleManagement',
            icon: 'security',
            level: 3,
            screen: 'RoleManagement',
            parent: 'user-roles',
            permission: {roles: ['owner']},
            order: 1,
          },
          {
            id: 'permission-settings',
            name: 'menu.permissionSettings',
            icon: 'lock',
            level: 3,
            screen: 'PermissionSettings',
            parent: 'user-roles',
            permission: {roles: ['owner']},
            order: 2,
          },
        ],
      },
    ],
  },
];

// =================
// Sử dụng với custom menu
// =================

const ManagementScreen: React.FC = () => {
  const {selectedRoles} = useSettings();
  
  const sidebar = useSidebar({
    menuData: managementMenuConfig, // Sử dụng menu tùy chỉnh
    userRoles: selectedRoles,
    initialActiveId: 'users',
  });

  return (
    <View style={{flex: 1}}>
      {/* Content */}
      <Sidebar {...sidebar} isTablet={false} />
    </View>
  );
};


export default ManagementScreen;

// =================
// Phân quyền nâng cao
// =================

const advancedPermissionCheck = (userRole: string, userDepartment: string): boolean => {
  // Logic phân quyền phức tạp
  if (userRole === 'manager' && userDepartment === 'IT') {
    return true;
  }
  return false;
};

const advancedMenuConfig: MenuItem[] = [
  {
    id: 'system-admin',
    name: 'menu.systemAdmin',
    icon: 'admin_panel_settings',
    level: 1,
    permission: {
      roles: ['admin'],
      customCheck: () => advancedPermissionCheck('manager', 'IT'),
    },
    children: [
      {
        id: 'system-logs',
        name: 'menu.systemLogs',
        icon: 'description',
        level: 2,
        screen: 'SystemLogs',
        parent: 'system-admin',
        permission: {
          roles: ['admin'],
          permissions: ['view_logs', 'system_admin'],
        },
      },
    ],
  },
];