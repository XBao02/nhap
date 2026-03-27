import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Animated,
  ScrollView,
  TouchableOpacity,
  Text,
  TextInput,
  View,
  StyleSheet,
} from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useLanguage } from '../../i18n';
import { useTheme } from '../../styles/ThemeContext';
import { useNavigateTo } from '../../hooks';
import {
  menuConfig,
  filterMenuByPermission,
  searchMenuItems,
  updateExpandedState,
  updateActiveState,
  sortMenuItems,
  MenuItem,
  SidebarProps,
  MenuState,
} from './menu';
import { sidebarStyles } from './sidebarStyles';

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  toggleSidebar,
  isTablet,
  menuData = menuConfig,
  userInfo,
  onMenuItemPress,
  showSearch = false,
  searchPlaceholder = 'Search...',
  showGroups = true,
  showGroupDivider = false,
}) => {
  console.log(`[Sidebar][render] Rendering Sidebar, isOpen: ${isOpen}, isTablet: ${isTablet}`);
  const { t } = useLanguage();
  console.log(`[Sidebar][render] Language hook initialized`);
  const { navigateTo } = useNavigateTo();
  console.log(`[Sidebar][render] NavigateTo hook initialized`);
  const { theme } = useTheme();
  console.log(`[Sidebar][render] Theme: background=${theme.background}, surface=${theme.surface}`);
  const selectedRoles = userInfo?.permissions || ['*', 'cashier', 'staff', 'manager', 'admin'];
  console.log(`[Sidebar][render] UserInfo:`, userInfo, `Selected roles:`, selectedRoles);

  // Animation refs
  const translateX = useRef(new Animated.Value(isOpen ? 0 : -250)).current;
  const opacity = useRef(new Animated.Value(isOpen ? 1 : 0)).current;
  console.log(`[Sidebar][render] Animation refs initialized: translateX=${(translateX as any)._value}, opacity=${(opacity as any)._value}`);

  // Menu state
  const [menuState, setMenuState] = useState<MenuState>({
    expandedItems: [],
    activeItem: null,
    searchText: '',
  });
  console.log(`[Sidebar][render] Initial menu state:`, menuState);

  // Animation effect
  useEffect(() => {
    console.log(`[Sidebar][useEffect] Starting animation for isOpen: ${isOpen}`);
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: isOpen ? 0 : -250,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: isOpen ? 1 : 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start(() => { // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      console.log(`[Sidebar][useEffect] Animation completed: translateX=${translateX._value}, opacity=${opacity._value}`);
    });
  }, [isOpen]);

  // Filtered and processed menu items
  const processedMenuItems = useMemo(() => {
    console.log(`[Sidebar][processedMenuItems] Processing menu items`);
    // First sort menu items by order
    let sortedItems = sortMenuItems(menuData);
    console.log(`[Sidebar][processedMenuItems] Sorted menu items:`, sortedItems.map(item => item.id));

    // Filter by permissions
    let filteredItems = sortedItems;
    if (selectedRoles && selectedRoles.length > 0 && !selectedRoles.includes('*')) {
      console.log(`[Sidebar][processedMenuItems] Filtering by permissions:`, selectedRoles);
      filteredItems = filterMenuByPermission(sortedItems, selectedRoles);
      console.log(`[Sidebar][processedMenuItems] Filtered items:`, filteredItems.map(item => item.id));
    }

    // Search filter
    if (menuState.searchText.trim()) {
      console.log(`[Sidebar][processedMenuItems] Applying search filter: ${menuState.searchText}`);
      filteredItems = searchMenuItems(filteredItems, menuState.searchText, t);
      console.log(`[Sidebar][processedMenuItems] Search filtered items:`, filteredItems.map(item => item.id));
    }

    // Update expanded/active states
    filteredItems = updateExpandedState(filteredItems, menuState.expandedItems);
    console.log(`[Sidebar][processedMenuItems] Updated expanded state:`, filteredItems.map(item => ({ id: item.id, isExpanded: item.isExpanded })));
    filteredItems = updateActiveState(filteredItems, menuState.activeItem);
    console.log(`[Sidebar][processedMenuItems] Updated active state:`, filteredItems.map(item => ({ id: item.id, isActive: item.isActive })));

    return filteredItems;
  }, [menuData, selectedRoles, menuState, t]);

  // Group items by group
  const groupedItems = useMemo(() => {
    console.log(`[Sidebar][groupedItems] Grouping menu items`);
    const groups: { [key: string]: MenuItem[] } = {};

    processedMenuItems.forEach(item => {
      const groupKey = item.group || 'default';
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    });
    console.log(`[Sidebar][groupedItems] Groups created:`, Object.keys(groups));

    // Improved group ordering
    const groupOrder = ['main', 'analytics', 'admin', 'system', 'support', 'default'];
    const sortedGroups: { [key: string]: MenuItem[] } = {};

    groupOrder.forEach(group => {
      if (groups[group] && groups[group].length > 0) {
        sortedGroups[group] = groups[group].sort((a, b) => (a.order || 0) - (b.order || 0));
        console.log(`[Sidebar][groupedItems] Sorted group ${group}:`, sortedGroups[group].map(item => item.id));
      }
    });

    Object.keys(groups).forEach(group => {
      if (!groupOrder.includes(group) && groups[group].length > 0) {
        sortedGroups[group] = groups[group].sort((a, b) => (a.order || 0) - (b.order || 0));
        console.log(`[Sidebar][groupedItems] Sorted additional group ${group}:`, sortedGroups[group].map(item => item.id));
      }
    });

    return sortedGroups;
  }, [processedMenuItems]);

  // Toggle expand/collapse
  const toggleExpand = (itemId: string) => {
    console.log(`[Sidebar][toggleExpand] Toggling expand for item: ${itemId}`);
    setMenuState(prev => {
      const newExpandedItems = prev.expandedItems.includes(itemId)
        ? prev.expandedItems.filter(id => id !== itemId)
        : [...prev.expandedItems, itemId];
      console.log(`[Sidebar][toggleExpand] New expanded items:`, newExpandedItems);
      return { ...prev, expandedItems: newExpandedItems };
    });
  };

  // Check if item is a leaf node
  const isLeafNode = (item: MenuItem): boolean => {
    const isLeaf = !item.children || item.children.length === 0;
    console.log(`[Sidebar][isLeafNode] Checking item ${item.id}: isLeaf=${isLeaf}`);
    return isLeaf;
  };

  // Handle menu item press
  const handleMenuItemPress = (item: MenuItem) => {
    console.log(`[Sidebar][handleMenuItemPress] Menu item pressed: ${item.id}`);
    setMenuState(prev => {
      console.log(`[Sidebar][handleMenuItemPress] Setting active item: ${item.id}`);
      return { ...prev, activeItem: item.id };
    });

    const hasChildren = item.children && item.children.length > 0;
    console.log(`[Sidebar][handleMenuItemPress] Has children: ${hasChildren}`);

    if (hasChildren) {
      console.log(`[Sidebar][handleMenuItemPress] Item has children, toggling expand`);
      toggleExpand(item.id);
      if (onMenuItemPress) {
        console.log(`[Sidebar][handleMenuItemPress] Calling onMenuItemPress for item: ${item.id}`);
        onMenuItemPress(item);
      }
      return;
    }

    if (onMenuItemPress) {
      console.log(`[Sidebar][handleMenuItemPress] Calling onMenuItemPress for leaf item: ${item.id}`);
      onMenuItemPress(item);
    } else {
      console.log(`[Sidebar][handleMenuItemPress] Handling default navigation/action for item: ${item.id}`);
      if (item.screen) {
        console.log(`[Sidebar][handleMenuItemPress] Navigating to screen: ${item.screen}`);
        navigateTo.navigate(item.screen);
      } else if (item.action) {
        console.log(`[Sidebar][handleMenuItemPress] Executing action for item: ${item.id}`);
        item.action();
      } else if (item.navigationType === 'action' && item.navigationParams?.actionHandler) {
        console.log(`[Sidebar][handleMenuItemPress] Executing actionHandler for item: ${item.id}`);
        item.navigationParams.actionHandler();
      }
    }

    if (!isTablet && isLeafNode(item)) {
      console.log(`[Sidebar][handleMenuItemPress] Closing sidebar on mobile for leaf item: ${item.id}`);
      toggleSidebar();
    }
  };

  // Handle search
  const handleSearch = (text: string) => {
    console.log(`[Sidebar][handleSearch] Search text changed: ${text}`);
    setMenuState(prev => ({ ...prev, searchText: text }));
  };

  // Render menu item
  const renderMenuItem = (item: MenuItem, level: 1 | 2 | 3 = 1) => {
    console.log(`[Sidebar][renderMenuItem] Rendering menu item: ${item.id}, level: ${level}`);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = item.isExpanded || false;
    const isActive = item.isActive || false;
    console.log(`[Sidebar][renderMenuItem] Item details:`, { hasChildren, isExpanded, isActive, isDisabled: item.isDisabled });

    const getItemStyle = (level: number) => {
      const baseStyle = sidebarStyles.menuItem;
      const paddingLeft = 16 + (level - 1) * 20;
      const style = [
        baseStyle,
        {
          backgroundColor: isActive ? theme.primaryLight : theme.surface,
          paddingLeft,
        },
        item.isDisabled && sidebarStyles.menuItemDisabled,
      ];
      console.log(`[Sidebar][renderMenuItem] Item style for ${item.id}:`, style);
      return style;
    };

    const getIconSize = (level: number) => {
      const size = Math.max(18, 24 - (level - 1) * 2);
      console.log(`[Sidebar][renderMenuItem] Icon size for ${item.id}: ${size}`);
      return size;
    };

    const getTextStyle = (level: number) => {
      const style = StyleSheet.flatten([
        sidebarStyles.menuText,
        {
          color: isActive ? theme.primary : theme.text,
          fontSize: Math.max(12, 16 - (level - 1) * 1),
          fontWeight: isActive ? '600' : '400',
        },
      ]);
      console.log(`[Sidebar][renderMenuItem] Text style for ${item.id}:`, style);
      return style;
    };

    return (
      <View key={item.id}>
        <TouchableOpacity
          style={getItemStyle(level)}
          onPress={() => handleMenuItemPress(item)}
          disabled={item.isDisabled}
          activeOpacity={0.7}>
          <Icon
            name={item.icon as any}
            size={getIconSize(level)}
            color={isActive ? theme.primary : theme.textSecondary}
            style={sidebarStyles.menuIcon}
          />
          <Text style={getTextStyle(level) as any}>{t(item.name)}</Text>

          {item.badge && (
            <View
              style={[
                sidebarStyles.menuBadge,
                { backgroundColor: theme.primary },
              ]}>
              <Text
                style={[sidebarStyles.menuBadgeText, { color: theme.surface }]}>
                {item.badge}
              </Text>
            </View>
          )}

          {hasChildren && (
            <Icon
              name={(isExpanded ? 'expand-less' : 'expand-more') as any}
              size={20}
              color={theme.textSecondary}
              style={sidebarStyles.expandIcon}
            />
          )}
        </TouchableOpacity>

        {hasChildren && isExpanded && (
          <Animated.View style={sidebarStyles.submenuContainer}>
            {item.children!.map(child => {
              console.log(`[Sidebar][renderMenuItem] Rendering submenu item: ${child.id}`);
              return renderMenuItem(child, Math.min(3, level + 1) as 1 | 2 | 3);
            })}
          </Animated.View>
        )}
      </View>
    );
  };

  // Render group header
  const renderGroupHeader = (groupKey: string) => {
    console.log(`[Sidebar][renderGroupHeader] Rendering group header: ${groupKey}`);
    if (!showGroups || groupKey === 'default') {
      console.log(`[Sidebar][renderGroupHeader] Skipping group header for ${groupKey}`);
      return null;
    }

    const groupTitles: { [key: string]: string } = {
      main: 'menu.groups.main',
      analytics: 'menu.groups.analytics',
      admin: 'menu.groups.admin',
      system: 'menu.groups.system',
      support: 'menu.groups.support',
    };

    const groupTitle = groupTitles[groupKey] || groupKey.charAt(0).toUpperCase() + groupKey.slice(1);
    console.log(`[Sidebar][renderGroupHeader] Group title: ${groupTitle}`);

    return (
      <View
        style={[
          sidebarStyles.menuGroupHeader,
          { backgroundColor: theme.backgroundSecondary },
        ]}>
        <Text
          style={[
            sidebarStyles.menuGroupHeaderText,
            { color: theme.textSecondary },
          ]}>
          {t(`${groupTitle}`)}
        </Text>
      </View>
    );
  };

  // Render group divider
  const renderGroupDivider = () => {
    console.log(`[Sidebar][renderGroupDivider] Rendering group divider`);
    if (!showGroupDivider) {
      console.log(`[Sidebar][renderGroupDivider] Skipping group divider`);
      return null;
    }

    return (
      <View
        style={[sidebarStyles.menuDivider, { backgroundColor: theme.border }]}
      />
    );
  };

  // Render grouped menu
  const renderGroupedMenu = () => {
    console.log(`[Sidebar][renderGroupedMenu] Rendering grouped menu`);
    const groupEntries = Object.entries(groupedItems);
    console.log(`[Sidebar][renderGroupedMenu] Grouped items:`, groupEntries.map(([key, items]) => ({
      group: key,
      count: items.length,
      items: items.map(item => item.id),
    })));

    return (
      <ScrollView
        style={sidebarStyles.menuList}
        showsVerticalScrollIndicator={false}
        bounces={false}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}>
        {groupEntries.map(([groupKey, items], groupIndex) => {
          if (items.length === 0) {
            console.log(`[Sidebar][renderGroupedMenu] Skipping empty group: ${groupKey}`);
            return null;
          }

          console.log(`[Sidebar][renderGroupedMenu] Rendering group: ${groupKey}, item count: ${items.length}`);
          return (
            <View key={groupKey}>
              {renderGroupHeader(groupKey)}
              {items.map(item => renderMenuItem(item, 1))}
              {groupIndex < groupEntries.length - 1 && renderGroupDivider()}
            </View>
          );
        })}
      </ScrollView>
    );
  };

  return (
    <Animated.View
      style={[
        sidebarStyles.sidebar,
        {
          backgroundColor: theme.surface,
          transform: [{ translateX }],
          opacity,
          width: 250,
          zIndex: 1000,
        },
      ]}>
      {/* Header */}
      <Animated.View
        style={[
          sidebarStyles.sidebarHeader,
          { borderBottomColor: theme.border, opacity },
        ]}>
        <Animated.View style={{ opacity, flex: 1 }}>
          <Text
            style={[sidebarStyles.logoText, { color: theme.text }]}
            numberOfLines={2}>
            {t('main.welcome', {
              name:
                userInfo?.full_name ||
                userInfo?.email ||
                userInfo?.username ||
                'Your heart!',
            })}
          </Text>
        </Animated.View>

        <Animated.View style={{ opacity }}>
          <TouchableOpacity
            onPress={() => {
              console.log(`[Sidebar][render] Closing sidebar via toggle button`);
              toggleSidebar();
            }}
            style={sidebarStyles.sidebarToggleIcon}
            activeOpacity={0.7}>
            <Icon name="chevron-left" size={24} color={theme.text} />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      {/* Search */}
      {showSearch && (
        <Animated.View style={[sidebarStyles.searchContainer, { opacity }]}>
          <TextInput
            style={[
              sidebarStyles.searchInput,
              {
                backgroundColor: theme.background,
                borderColor: theme.border,
                color: theme.text,
              },
            ]}
            placeholder={searchPlaceholder || t('menu.search')}
            placeholderTextColor={theme.textSecondary}
            value={menuState.searchText}
            onChangeText={handleSearch}
          />
        </Animated.View>
      )}

      {/* Menu List */}
      <Animated.View style={{ flex: 1, opacity }}>
        {renderGroupedMenu()}
      </Animated.View>
    </Animated.View>
  );
};

export default Sidebar;