// ThemeContext.ts
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {themes, Theme, defaultTheme} from './themes';
import {STORAGE_KEYS} from '../utils';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({children}: {children: ReactNode}) => {
  const [theme, setTheme] = useState<Theme>(themes[defaultTheme]);
  const [isDark, setIsDark] = useState(themes[defaultTheme] === themes.dark);

  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await AsyncStorage.getItem(STORAGE_KEYS.APP_THEME);
      const newIsDark = savedTheme === 'dark';
      const newTheme = newIsDark ? themes.dark : themes.light;
      setIsDark(newIsDark);
      setTheme(newTheme);
    };
    loadTheme();
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    const newTheme = newIsDark ? themes.dark : themes.light;
    setIsDark(newIsDark);
    setTheme(newTheme);
    AsyncStorage.setItem(STORAGE_KEYS.APP_THEME, newIsDark ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{theme, toggleTheme, isDark}}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
