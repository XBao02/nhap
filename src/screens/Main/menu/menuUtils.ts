import type {MenuItem} from './menuTypes';

// ✅ FIXED: Sửa lại logic filterMenuByPermission
export const filterMenuByPermission = (
  menuItems: MenuItem[] | [],
  userRoles: string[]
): MenuItem[] => {
  return menuItems
    .filter(item => {
      // Check if user has permission
      if (item.permissions) {
        return item.permissions.some(permission => 
          permission === '*' || userRoles.includes(permission)
        );
      }
      return true;
    })
    .map(item => {
      // Process children if exists
      if (item.children && item.children.length > 0) {
        const filteredChildren = filterMenuByPermission(item.children, userRoles);
        return {
          ...item,
          children: filteredChildren
        };
      }
      return item;
    })
    .filter(item => {
      // Keep item if it has no children OR has filtered children
      return !item.children || item.children.length > 0;
    });
};

export const searchMenuItems = (
  menuItems: MenuItem[],
  searchText: string,
  t: (key: string) => string
): MenuItem[] => {
  const searchLower = searchText.toLowerCase();
  
  return menuItems
    .map(item => {
      const nameMatch = t(item.name).toLowerCase().includes(searchLower);
      const childrenMatch = item.children
        ? searchMenuItems(item.children, searchText, t)
        : [];
      
      if (nameMatch || childrenMatch.length > 0) {
        return {
          ...item,
          children: childrenMatch.length > 0 ? childrenMatch : item.children
        };
      }
      return null;
    })
    .filter(Boolean) as MenuItem[];
};

export const updateExpandedState = (
  menuItems: MenuItem[],
  expandedItems: string[]
): MenuItem[] => {
  return menuItems.map(item => ({
    ...item,
    isExpanded: expandedItems.includes(item.id),
    children: item.children
      ? updateExpandedState(item.children, expandedItems)
      : undefined
  }));
};

export const updateActiveState = (
  menuItems: MenuItem[],
  activeItem: string | null
): MenuItem[] => {
  return menuItems.map(item => ({
    ...item,
    isActive: item.id === activeItem,
    children: item.children
      ? updateActiveState(item.children, activeItem)
      : undefined
  }));
};

/**
 * Sắp xếp menu items theo order
 */
export const sortMenuItems = (menuItems: MenuItem[]): MenuItem[] => {
  return menuItems
    .map(item => ({
      ...item,
      children: item.children ? sortMenuItems(item.children) : undefined,
    }))
    .sort((a, b) => (a.order || 0) - (b.order || 0));
};

// NEW FUNCTION: Flatten menu items for renderFlatListItem
export const flattenMenuItems = (
  menuItems: MenuItem[],
  level: number = 1,
  parentExpanded: boolean = true
): MenuItem[] => {
  const flatItems: MenuItem[] = [];
  
  menuItems.forEach(item => {
    // Add current item with its level
    const flatItem: MenuItem = {
      ...item,
      level: level,
      visible: parentExpanded // Determine if item should be visible
    };
    
    flatItems.push(flatItem);
    
    // Add children if item is expanded
    if (item.children && item.children.length > 0 && item.isExpanded) {
      const childItems = flattenMenuItems(
        item.children,
        level + 1,
        parentExpanded && item.isExpanded
      );
      flatItems.push(...childItems);
    }
  });
  
  // Filter out invisible items
  return flatItems.filter(item => item.visible !== false);
};

// Helper function to get all menu item ids recursively
export const getAllMenuItemIds = (menuItems: MenuItem[]): string[] => {
  const ids: string[] = [];
  
  menuItems.forEach(item => {
    ids.push(item.id);
    if (item.children && item.children.length > 0) {
      ids.push(...getAllMenuItemIds(item.children));
    }
  });
  
  return ids;
};

// Helper function to find menu item by id
export const findMenuItemById = (
  menuItems: MenuItem[],
  id: string
): MenuItem | null => {
  for (const item of menuItems) {
    if (item.id === id) {
      return item;
    }
    if (item.children && item.children.length > 0) {
      const found = findMenuItemById(item.children, id);
      if (found) {
        return found;
      }
    }
  }
  return null;
};

// Helper function to get parent menu item
export const getParentMenuItem = (
  menuItems: MenuItem[],
  childId: string,
  parent: MenuItem | null = null
): MenuItem | null => {
  for (const item of menuItems) {
    if (item.children && item.children.some(child => child.id === childId)) {
      return item;
    }
    if (item.children && item.children.length > 0) {
      const found = getParentMenuItem(item.children, childId, item);
      if (found) {
        return found;
      }
    }
  }
  return null;
};

// Helper function to auto-expand parent items when child is active
export const getExpandedItemsForActive = (
  menuItems: MenuItem[],
  activeItemId: string
): string[] => {
  const expandedItems: string[] = [];
  
  const findAndExpand = (items: MenuItem[], targetId: string, path: string[] = []): boolean => {
    for (const item of items) {
      const currentPath = [...path, item.id];
      
      if (item.id === targetId) {
        // Found target, expand all parents
        expandedItems.push(...path);
        return true;
      }
      
      if (item.children && item.children.length > 0) {
        if (findAndExpand(item.children, targetId, currentPath)) {
          return true;
        }
      }
    }
    return false;
  };
  
  findAndExpand(menuItems, activeItemId);
  return expandedItems;
};

// ✅ FIXED: Export helper functions để sử dụng trong các component khác
export const menuHelpers = {
  // Lọc menu theo quyền user
  filterMenuByPermissions: (menuConfigInput: MenuItem[], userPermissions: string[]) => {
    const hasPermission = (requiredPermissions: string[] | undefined) => {
      if (!requiredPermissions) return true;
      return (
        requiredPermissions.includes('*') ||
        requiredPermissions.some(perm => userPermissions.includes(perm))
      );
    };

    const filterItems = (items: MenuItem[]): MenuItem[] => {
      return items
        .filter(item => hasPermission(item.permissions))
        .map(item => {
          if (item.children && item.children.length > 0) {
            const filteredChildren = filterItems(item.children);
            return {
              ...item,
              children: filteredChildren
            };
          }
          return item;
        })
        .filter(item => !item.children || item.children.length > 0);
    };

    return filterItems(menuConfigInput);
  },

  // Lấy menu theo group
  getMenuByGroup: (menuConfigInput: MenuItem[], groupName: string) => {
    return menuConfigInput.filter(item => item.group === groupName);
  },

  // Tìm menu item theo ID
  findMenuById: (menuConfigInput: MenuItem[], id: string): MenuItem | null => {
    const findInItems = (items: MenuItem[]): MenuItem | null => {
      for (const item of items) {
        if (item.id === id) return item;
        if (item.children) {
          const found = findInItems(item.children);
          if (found) return found;
        }
      }
      return null;
    };

    return findInItems(menuConfigInput);
  },
};