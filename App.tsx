import React, { useEffect, useCallback, useMemo } from 'react';
import { Modal, BackHandler, View } from 'react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { I18nextProvider } from 'react-i18next';
import i18n from './src/i18n';
import { ThemeProvider } from './src/styles/ThemeContext';
import { store } from './src/store';
import { NavigationService } from './src/registries';
import { useModal } from './src/hooks/useModal';
import ModalManager from './src/services/ModalManager';

// Tách GlobalModal thành component riêng với ModalManager
const GlobalModal: React.FC = React.memo(() => {
  const modalState = useModal();

  console.log('🔄 GlobalModal rendered at:', new Date().toISOString(), 'visible:', modalState.visible);

  const renderModalContent = useCallback(() => {
    if (!modalState.component) return null;
    const ModalComponent = modalState.component;
    console.log('🎭 Rendering modal component:', ModalComponent.name || 'Unknown');

    const { key, ...restProps } = modalState.props;
    console.log('🔑 Key for modal:', key);
    console.log('📦 Other props:', restProps);

    return (
      <ThemeProvider>
        <Provider store={store}>
          <I18nextProvider i18n={i18n}>
          <ModalComponent key={key} {...restProps} />
          </I18nextProvider>
        </Provider>
      </ThemeProvider>
    );
  }, [modalState.component, modalState.props]);

  const handleClose = useCallback(() => {
    ModalManager.getInstance().closeModal();
  }, []);

  return (
    <Modal
      visible={modalState.visible}
      animationType="slide"
      presentationStyle="overFullScreen"
      transparent={true}
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
        {renderModalContent()}
      </View>
    </Modal>
  );
});

GlobalModal.displayName = 'GlobalModal';

function App() {
  console.log('🔥 APP COMPONENT RENDERED AT:', new Date().toISOString());

  // Setup NavigationService và BackHandler
  useEffect(() => {
    console.log('🔧 Setting up NavigationService and BackHandler');

    const backAction = () => {
      const modalManager = ModalManager.getInstance();
      const currentState = modalManager.getState();

      if (currentState.visible) {
        console.log('🔙 Back button pressed - closing modal');
        modalManager.closeModal();
        return true;
      }
      console.log('🔙 Back button pressed - allowing navigation');
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => {
      console.log('🧹 Cleaning up BackHandler');
      backHandler.remove();
    };
  }, []); // Không có dependencies

  // Memoize toàn bộ app content để tránh re-render
  const appContent = useMemo(() => {
    console.log('🗃️ Creating app content wrapper');
    return (
      <I18nextProvider i18n={i18n}>
        <ThemeProvider>
          <SafeAreaView style={{ flex: 1 }}>
            <NavigationContainer
              ref={ref => {
                console.log('🧭 Setting NavigationService ref');
                NavigationService.setNavigationRef(ref);
              }}
            >
              <Provider store={store}>
                <AppNavigator />
              </Provider>
            </NavigationContainer>
          </SafeAreaView>
          <Toast />
        </ThemeProvider>
      </I18nextProvider>
    );
  }, []); // Không có dependencies - chỉ tạo một lần

  console.log('📱 Rendering App (should be stable now)');

  return (
    <>
      {appContent}
      <GlobalModal />
    </>
  );
}

export default App;