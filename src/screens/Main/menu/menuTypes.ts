export type NavigationType = 'internal' | 'external' | 'modal' | 'action';

export interface NavigationParams {
  // Cho navigation external (navigate to other screens)
  screenName?: string;
  params?: any;

  // Cho modal
  modalComponent?: React.ComponentType<any>;
  modalProps?: any;

  // Cho action
   actionHandler?: (onConfirm?: () => void) => void | Promise<void>;

  // Common params
  replace?: boolean;
  resetStack?: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  icon?: string;
  level?: number | undefined;

  // Navigation config
  navigationType?: NavigationType;  // đây là kiểu để xử lý bấm menu
  navigationParams?: NavigationParams;

  // load ScreenContent
  screen?: string;
  action?: () => void;

  requireAuth?: boolean;
  permissions?: string[] | undefined;
  visible?: boolean | (() => boolean);

  children?: MenuItem[];
  parent?: string;

  // Visual
  badge?: string | number;
  badgeColor?: string;
  disabled?: boolean;
    
  // Trạng thái xử lý trên layout
  isActive?: boolean;
  isExpanded?: boolean;
  isDisabled?: boolean;
  description?: string;
  
  // Nhóm và sắp xếp
  order?: number;
  group?: string;
}

export interface MenuGroup {
  id: string;
  name: string;
  order: number;
  items: MenuItem[];
}

export interface MenuState {
  expandedItems: string[];
  activeItem: string | null;
  searchText: string;
}

// Giao tiếp này là khai báo cho một thông tin người dùng
// để hiển thị lên ứng dụng, kèm thông tin token làm việc
export interface UserInfo {
  id: string;
  username?: string;
  store_id?: string;
  enterprise_id?: string;
  password_hash?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  role?: string;
  permissions?: any;
  avatar_url?: string;
  is_active?: boolean;
  last_login?: string;
  failed_login_attempts?: number;
  locked_until?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  isTablet: boolean;
  userInfo?: UserInfo; 
  menuData?: MenuItem[];
  onMenuItemPress?: (item: MenuItem) => void;
  showSearch?: boolean;
  searchPlaceholder?: string;
  showGroups?: boolean;
  showGroupDivider?: boolean;
  renderAsFlat?: boolean;
}
