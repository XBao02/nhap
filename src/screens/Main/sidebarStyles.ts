import {StyleSheet, Platform} from 'react-native';

export const sidebarStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 99, // Dưới sidebar nhưng trên nội dung
  },
  // Container chính của sidebar
  sidebar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: {width: 2, height: 0},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'visible',
  },

  // Header của sidebar
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    height: Platform.OS === 'ios' ? 80 : 60,
    position: 'relative',
    overflow: 'visible',
  },

  // Logo text
  logoText: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },

  sidebarToggleIcon: {
    marginRight: -20,
  },

  menuList: {
    flex: 1,
  },
  // Menu item cấp 1
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },

  // Menu item cấp 2
  menuItemLevel2: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 32,
    paddingRight: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.3,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },

  // Menu item cấp 3
  menuItemLevel3: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 48,
    paddingRight: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.2,
    borderBottomColor: 'rgba(0,0,0,0.03)',
  },

  // Icon menu
  menuIcon: {
    marginRight: 16,
  },

  // Icon menu cấp 2
  menuIconLevel2: {
    marginRight: 12,
  },

  // Icon menu cấp 3
  menuIconLevel3: {
    marginRight: 10,
  },

  // Text menu
  menuText: {
    fontSize: 16,
    flex: 1,
  },

  // Text menu cấp 2
  menuTextLevel2: {
    fontSize: 14,
    flex: 1,
  },

  // Text menu cấp 3
  menuTextLevel3: {
    fontSize: 13,
    flex: 1,
  },

  // Icon mở rộng/thu gọn
  expandIcon: {
    marginLeft: 8,
  },

  // Container cho submenu
  submenuContainer: {
    overflow: 'hidden',
  },

  // Badge cho số lượng submenu
  menuBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  menuBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },

  // Menu item đang active
  menuItemActive: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },

  // Menu item disabled
  menuItemDisabled: {
    opacity: 0.5,
  },

  // Divider giữa các nhóm menu
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginVertical: 8,
    marginHorizontal: 16,
  },

  // Header cho nhóm menu
  menuGroupHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },

  menuGroupHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    opacity: 0.6,
  },

  // Menu button ở ngoài sidebar
  menuButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 36 : 10,
    left: -16,
    zIndex: 999999,
    padding: 8,
    backgroundColor: 'transparent',
    borderWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
  },

  menuButtonHidden: {
    left: -40,
    opacity: 0,
    backgroundColor: 'transparent',
  },

  menuButtonVisible: {
    left: -25,
    opacity: 1,
    backgroundColor: 'transparent',
  },

  menuButtonIcon: {
    marginLeft: 10,
  },

  menuButtonIconHidden: {
    marginLeft: 0,
  },

  // Loading state
  menuItemLoading: {
    opacity: 0.6,
  },

  // Search box trong sidebar
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },

  searchInput: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
});
