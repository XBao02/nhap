import React, { useCallback, useEffect } from 'react';
import { View, TouchableOpacity, Animated } from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useTheme } from '../../styles/ThemeContext';
import { isTablet } from '../../utils';
import {
  isScreenRegistered,
  getScreenComponent,
  getScreenProps,
  NavigationService,
} from '../../registries';
import { MenuItem, UserInfo } from './menu/menuTypes';
import { DashboardContent } from '../../contents';
import { Sidebar } from './Sidebar';
import { useMainScreen } from './hooks/useMainScreen';
import { sidebarStyles } from './sidebarStyles';
import { menuConfig } from './menu';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

export const MainScreen: React.FC = () => {
  console.log(`[MainScreen][render] Rendering MainScreen`);
  const { theme } = useTheme();
  console.log(`[MainScreen][render] Theme: background=${theme.background}`);
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  console.log(`[MainScreen][render] Auth state:`, { isAuthenticated, user });
  const userInfo: UserInfo = {
    id: user?.id || '',
  };
  console.log(`[MainScreen][render] UserInfo:`, userInfo);

  const {
    isSidebarOpen,
    toggleSidebar,
    contentMargin,
    currentScreen,
    navigateToScreen,
  } = useMainScreen();
  console.log(`[MainScreen][render] MainScreen state:`, {
    isSidebarOpen,
    contentMargin,
    currentScreen,
  });

  const initMenuConfig = menuConfig;
  console.log(`[MainScreen][render] Menu config initialized:`, initMenuConfig);

  // Log currentScreen changes
  useEffect(() => {
    console.log(`[MainScreen][useEffect] Current screen changed to: ${currentScreen}`);
  }, [currentScreen]);

  // Enhanced menu item press handler
  const handleMenuItemPress = useCallback(
    (item: MenuItem) => {
      const { navigationType, navigationParams, screen, action, children } = item;
      const switchAction = navigationType || 'internal';
      const isParent = children && children.length > 0;
      console.log(`[MainScreen][handleMenuItemPress] Menu item pressed:`, {
        navigationType: switchAction,
        navigationParams,
        screen,
        action: !!action,
        isParent,
      });
      console.log(`[MainScreen][handleMenuItemPress] Current screen before navigation: ${currentScreen}`);

      switch (switchAction) {
        case 'internal':
          if (screen) {
            if (isScreenRegistered(screen)) {
              console.log(`[MainScreen][handleMenuItemPress] Navigating from ${currentScreen} to ${screen}`);
              navigateToScreen(screen);
            } else {
              console.warn(`[MainScreen][handleMenuItemPress] Screen "${screen}" not found in registry. Redirecting to Dashboard.`);
              navigateToScreen('Dashboard');
            }
          } else if (action) {
            console.log(`[MainScreen][handleMenuItemPress] Executing action for menu item`);
            action();
          }
          break;

        case 'external':
          if (navigationParams) {
            console.log(`[MainScreen][handleMenuItemPress] External navigation with params:`, navigationParams);
            NavigationService.navigate('external', navigationParams);
          } else {
            console.warn(`[MainScreen][handleMenuItemPress] Navigation params missing for external navigation`);
          }
          break;

        case 'modal':
          if (navigationParams) {
            console.log(`[MainScreen][handleMenuItemPress] Modal navigation with params:`, navigationParams);
            NavigationService.navigate('modal', navigationParams);
          } else {
            console.warn(`[MainScreen][handleMenuItemPress] Navigation params missing for modal navigation`);
          }
          break;

        case 'action':
          if (navigationParams) {
            console.log(`[MainScreen][handleMenuItemPress] Action navigation with params:`, navigationParams);
            NavigationService.navigate('action', navigationParams);
          } else if (action) {
            console.log(`[MainScreen][handleMenuItemPress] Executing action for menu item`);
            action();
          } else {
            console.warn(`[MainScreen][handleMenuItemPress] No action handler found for action navigation`);
          }
          break;

        default:
          console.warn(`[MainScreen][handleMenuItemPress] Unknown navigation type: ${switchAction}`);
      }

      // Close sidebar on mobile after navigation
      if (!isTablet && !isParent) {
        console.log(`[MainScreen][handleMenuItemPress] Closing sidebar on mobile, isParent: ${isParent}`);
        toggleSidebar();
      }
    },
    [currentScreen, navigateToScreen, toggleSidebar]
  );

  // Render main content
  const renderMainContent = useCallback(() => {
    console.log(`[MainScreen][renderMainContent] Rendering content for screen: ${currentScreen}`);
    try {
      const ScreenComponent = getScreenComponent(currentScreen);
      const screenProps = getScreenProps(currentScreen);
      console.log(`[MainScreen][renderMainContent] Screen component found: ${!!ScreenComponent}, props:`, screenProps);

      if (ScreenComponent) {
        return <ScreenComponent {...screenProps} />;
      }

      console.log(`[MainScreen][renderMainContent] No component found for screen: ${currentScreen}, falling back to DashboardContent`);
      return <DashboardContent />;
    } catch (error) {
      console.error(`[MainScreen][renderMainContent] Error rendering screen content:`, (error as Error).stack);
      return <DashboardContent />;
    }
  }, [currentScreen]);

  return (
    <View
      style={[sidebarStyles.container, { backgroundColor: theme.background }]}>
      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={() => {
          console.log(`[MainScreen][render] Toggling sidebar, current state: ${isSidebarOpen}`);
          toggleSidebar();
        }}
        isTablet={isTablet}
        menuData={initMenuConfig}
        userInfo={userInfo}
        onMenuItemPress={handleMenuItemPress}
      />

      {/* Overlay when sidebar is open on mobile */}
      {!isTablet && isSidebarOpen && (
        <TouchableOpacity
          style={sidebarStyles.overlay}
          onPress={() => {
            console.log(`[MainScreen][render] Closing sidebar via overlay press`);
            toggleSidebar();
          }}
          activeOpacity={1}
        />
      )}

      {/* Menu button */}
      {(!isSidebarOpen || !isTablet) && (
        <TouchableOpacity
          style={[
            sidebarStyles.menuButton,
            isSidebarOpen
              ? sidebarStyles.menuButtonHidden
              : sidebarStyles.menuButtonVisible,
          ]}
          onPress={() => {
            console.log(`[MainScreen][render] Opening sidebar via menu button press`);
            toggleSidebar();
          }}
          activeOpacity={0.7}>
          <Icon
            name="chevron-right"
            size={24}
            color={theme.text}
            style={[
              isSidebarOpen
                ? sidebarStyles.menuButtonIconHidden
                : sidebarStyles.menuButtonIcon,
            ]}
          />
        </TouchableOpacity>
      )}

      {/* Main Content Area */}
      <Animated.ScrollView
        style={[
          sidebarStyles.content,
          { marginLeft: isTablet ? contentMargin : 0 },
        ]}
        contentContainerStyle={{ padding: isTablet ? 16 : 0 }}
        key={currentScreen}
        nestedScrollEnabled={true}>
        {renderMainContent()}
      </Animated.ScrollView>
    </View>
  );
};

export default MainScreen;