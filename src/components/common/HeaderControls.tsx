import React from 'react';
import {View, StyleSheet, Platform, TouchableOpacity} from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import {useTheme} from '../../styles/ThemeContext';
import {FlagIcon} from '../../assets/icons';
import {useLanguage} from '../../i18n';
import {useNavigation} from '@react-navigation/native';

interface HeaderControlsProps {
  isHome?: boolean;
  saveSetting?: () => void;
}
/**
 * Nếu là trang home thì 2 nút hiển thị chuyển đổi ngôn ngữ và chuyển đổi theme
 * Nếu là trang setting thì có nút quay về và nút lưu trữ để lưu giữ những gì đang thiết lập
 * Nếu không phải thì là nút quay về bình thường
 */

export const HeaderControls: React.FC<HeaderControlsProps> = React.memo(
  ({isHome, saveSetting}) => {
    const {theme, toggleTheme, isDark} = useTheme();
    const {toggleLanguage, i18n} = useLanguage();
    const navigation = useNavigation();

    const HomeComponent = () => (
      <View style={styles.headerButtonContainer}>
        <TouchableOpacity
          style={[
            styles.headerButton,
            styles.languageToggle,
            {backgroundColor: theme.surface},
          ]}
          onPress={toggleLanguage}>
          <FlagIcon
            language={i18n.language}
            size={20}
            style={styles.flag}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.headerButton,
            styles.themeToggle,
            {backgroundColor: theme.surface},
          ]}
          onPress={toggleTheme}>
          <Icon
            name={isDark ? 'wb-sunny' : 'nightlight-round'}
            size={20}
            color={theme.accent}
          />
        </TouchableOpacity>
      </View>
    );

    const GobackComponent = () => (
      <View style={styles.headerButtonContainer}>
        <TouchableOpacity
          style={[
            styles.headerButton,
            styles.languageToggle,
            {backgroundColor: theme.surface},
          ]}
          onPress={() => navigation.goBack()} // Thay bằng navigate.goBack()
        >
          <Icon
            name="arrow-back" // Icon quay lại
            size={20}
            color={theme.accent}
          />
        </TouchableOpacity>
      </View>
    );

    const SettingComponent = () => (
      <View style={styles.headerButtonContainer}>
        <TouchableOpacity
          style={[
            styles.headerButton,
            styles.languageToggle,
            {backgroundColor: theme.surface},
          ]}
          onPress={() => navigation.goBack()} // Thay bằng navigate.goBack()
        >
          <Icon
            name="arrow-back" // Icon quay lại
            size={20}
            color={theme.accent}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.headerButton,
            styles.themeToggle,
            {backgroundColor: theme.surface},
          ]}
          onPress={saveSetting}>
          <Icon name={'save-as'} size={20} color={theme.accent} />
        </TouchableOpacity>
      </View>
    );

    return isHome ? (
      <HomeComponent />
    ) : saveSetting ? (
      <SettingComponent />
    ) : (
      <GobackComponent />
    );
  },
);

export default HeaderControls;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  languageToggle: {
    left: 10,
  },
  themeToggle: {
    right: 10,
  },
  headerButtonContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 20 : 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 0,
    zIndex: 1,
  },
  headerButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  flag: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
});
