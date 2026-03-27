// NavigationService.ts
import React from 'react';
import {NavigationParams, NavigationType} from '../screens/Main/menu/menuTypes';
import ModalManager from '../services/ModalManager';

// Interface cho navigation service
interface INavigationService {
  navigate: (type: NavigationType, params: NavigationParams) => void;
  setNavigationRef: (ref: any) => void;
  setModalHandler: (
    handler: (component: React.ComponentType<any>, props?: any) => void,
  ) => void;
  getCurrentRoute: () => string | null;
}

class NavigationServiceClass implements INavigationService {
  private navigationRef: any = null;
  private modalManager = ModalManager.getInstance();
  
  // Legacy handlers - giữ lại để backward compatibility
  private modalHandler:
    | ((component: React.ComponentType<any>, props?: any) => void)
    | null = null;
  private modalCloseHandler: (() => void) | null = null;

  // Set navigation ref từ React Navigation
  setNavigationRef = (ref: any) => {
    this.navigationRef = ref;
  };

  // Set modal handler từ app level (DEPRECATED - sử dụng ModalManager)
  setModalHandler = (
    handler: (component: React.ComponentType<any>, props?: any) => void,
  ) => {
    console.warn(
      'NavigationService.setModalHandler is deprecated. ModalManager is now used internally for better performance.'
    );
    this.modalHandler = handler;
  };

  // Set modal close handler từ app level (DEPRECATED - sử dụng ModalManager)
  setModalCloseHandler = (handler: () => void) => {
    console.warn(
      'NavigationService.setModalCloseHandler is deprecated. ModalManager is now used internally for better performance.'
    );
    this.modalCloseHandler = handler;
  };

  // Main navigation method
  navigate = (type: NavigationType, params: NavigationParams) => {
    switch (type) {
      case 'external':
        this.handleExternalNavigation(params);
        break;
      case 'modal':
        this.handleModalNavigation(params);
        break;
      case 'action':
        this.handleActionNavigation(params);
        break;
      case 'internal':
        // Internal navigation được xử lý bởi MainLayout
        console.log('Internal navigation should be handled by MainLayout');
        break;
      default:
        console.warn(`Unknown navigation type: ${type}`);
    }
  };

  // Handle external navigation (to other screens outside MainLayout)
  private handleExternalNavigation = (params: NavigationParams) => {
    if (!this.navigationRef) {
      console.error(
        'Navigation ref not set. Make sure to call setNavigationRef.',
      );
      return;
    }

    const {screenName, params: screenParams, replace, resetStack} = params;

    if (!screenName) {
      console.error('Screen name is required for external navigation');
      return;
    }

    try {
      if (resetStack) {
        this.navigationRef.reset({
          index: 0,
          routes: [{name: screenName, params: screenParams}],
        });
      } else if (replace) {
        this.navigationRef.replace(screenName, screenParams);
      } else {
        this.navigationRef.navigate(screenName, screenParams);
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  // Handle modal navigation - updated to use ModalManager
  private handleModalNavigation = (params: NavigationParams) => {
    const {modalComponent, modalProps} = params;

    if (!modalComponent) {
      console.error('Modal component is required for modal navigation');
      return;
    }

    // Sử dụng ModalManager thay vì legacy handler
    this.modalManager.showModal(modalComponent, modalProps);
  };

  // Handle action navigation
  private handleActionNavigation = (params: NavigationParams) => {
    const {actionHandler} = params;

    if (!actionHandler) {
      console.error('Action handler is required for action navigation');
      return;
    }

    try {
      actionHandler();
    } catch (error) {
      console.error('Action handler error:', error);
    }
  };

  // Get current route name
  getCurrentRoute = (): string | null => {
    if (!this.navigationRef) {
      return null;
    }

    try {
      return this.navigationRef.getCurrentRoute()?.name || null;
    } catch (error) {
      console.error('Error getting current route:', error);
      return null;
    }
  };

  // Helper methods
  goBack = () => {
    if (this.navigationRef?.canGoBack()) {
      this.navigationRef.goBack();
    }
  };

  /**
   * Show global modal with specified component
   * Sử dụng ModalManager để tránh re-render App component
   * @param component React component to render in modal
   * @param props Props to pass to the component
   */
  showModal(component: React.ComponentType<any>, props?: any) {
    const modalProps = {
      ...props,
      key: props?.key || Date.now().toString(), // Unique key cho mỗi modal instance
    };
    
    console.log('🎭 NavigationService: Delegating to ModalManager');
    this.modalManager.showModal(component, modalProps);
  }

  /**
   * Hide the currently displayed global modal
   * Sử dụng ModalManager để tránh re-render App component
   */
  hideModal() {
    console.log('🚪 NavigationService: Delegating close to ModalManager');
    this.modalManager.closeModal();
  }

  /**
   * Legacy method - sử dụng hideModal() thay thế
   * @deprecated Use hideModal() instead
   */
  closeModal() {
    console.warn('NavigationService.closeModal() is deprecated. Use hideModal() instead.');
    this.hideModal();
  }

  resetToScreen = (screenName: string, params?: any) => {
    this.navigate('external', {
      screenName,
      params,
      resetStack: true,
    });
  };

  // Utility methods để kiểm tra modal state
  isModalVisible(): boolean {
    return this.modalManager.getState().visible;
  }

  getCurrentModalComponent(): React.ComponentType<any> | null {
    return this.modalManager.getState().component;
  }

  // Method để subscribe vào modal state changes (nếu cần)
  subscribeToModalChanges(callback: (visible: boolean, component: React.ComponentType<any> | null) => void): () => void {
    return this.modalManager.subscribe((state) => {
      callback(state.visible, state.component);
    });
  }
}

// Export singleton instance
export const NavigationService = new NavigationServiceClass();

// Export for dependency injection if needed
export default NavigationService;