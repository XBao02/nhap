import {useState, useRef, useEffect} from 'react';
import {Animated} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {RootState, setCurrentScreen} from '../store';
import {isTablet} from '../utils';

/**
 * hook dùng chung cho MainMenu
 * @returns 
 */
export const useMainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(isTablet);
  const contentMargin = useRef(new Animated.Value(isTablet ? 250 : 0)).current;
  const dispatch = useDispatch();
  const currentScreen = useSelector((state: RootState) => state.ui.currentScreen);
  const navigateToScreen = (screen: string) => {
    dispatch(setCurrentScreen(screen));
  };

  useEffect(() => {
    Animated.timing(contentMargin, {
      toValue: isSidebarOpen ? 250 : 0, // 250 là width của sidebar
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isSidebarOpen]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return {
    isSidebarOpen,
    toggleSidebar,
    contentMargin,
    currentScreen,
    navigateToScreen,
  };
};

export default useMainLayout;