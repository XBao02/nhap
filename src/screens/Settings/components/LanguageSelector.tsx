import React, {useState, useEffect} from 'react';
import {View, Text} from 'react-native';
import SelectDropdown from 'react-native-select-dropdown';
import CountryFlag from 'react-native-country-flag-icon';
import Icon from '@react-native-vector-icons/material-icons';
import {useLanguage} from '../../../i18n';
import {useTheme} from '../../../styles/ThemeContext';
import {styles} from '../settingsStyles';

interface LanguageSelectorProps {
  onLanguageChange?: (language: string) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  onLanguageChange,
}) => {
  const {t, i18n, toggleLanguage} = useLanguage();
  const {theme} = useTheme();

  const languages = [
    {title: 'English', flag: 'gb', code: 'en'},
    {title: 'Tiếng Việt', flag: 'vn', code: 'vi'},
  ];

  // State để lưu trữ ngôn ngữ mặc định
  const [selectedItem, setSelectedItem] = useState(
    languages.find(lang => lang.code === i18n.language) || languages[0],
  );

  useEffect(() => {
    // Cập nhật selectedItem khi ngôn ngữ thay đổi từ bên ngoài
    setSelectedItem(
      languages.find(lang => lang.code === i18n.language) || languages[0],
    );
  }, [i18n.language]);

  const handleLanguageChange = (language: string) => {
    toggleLanguage();
    onLanguageChange ? onLanguageChange(language) : null;
  };

  return (
    <View style={[styles.sectionContainer, {backgroundColor: theme.surface}]}>
      <Text style={[styles.sectionTitle, {color: theme.text}]}>
        {t('settings.languageTitle')}
      </Text>
      <SelectDropdown
        data={languages}
        defaultValue={selectedItem}
        onSelect={selectedItem => {
          handleLanguageChange(selectedItem.code);
        }}
        renderButton={(selectedItem, isOpened) => {
          return (
            <View
              style={[
                styles.dropdownButtonStyle,
                {backgroundColor: theme.selectedBackground},
              ]}>
              {selectedItem && (
                <CountryFlag
                  isoCode={selectedItem.flag}
                  size={25}
                  style={styles.dropdownButtonIconStyle}
                />
              )}
              <Text
                style={[styles.dropdownButtonTxtStyle, {color: theme.text}]}>
                {(selectedItem && selectedItem.title) ||
                  `${t('settings.languageTitle')}`}
              </Text>
              <Icon
                name={isOpened ? 'arrow-drop-up' : 'arrow-drop-down'}
                style={[styles.dropdownButtonArrowStyle, {color: theme.text}]}
              />
            </View>
          );
        }}
        renderItem={(item, index, isSelected) => {
          return (
            <View
              style={{
                ...styles.dropdownItemStyle,
                ...{backgroundColor: theme.background},
                ...(isSelected && {backgroundColor: theme.selectedBackground}),
              }}>
              <CountryFlag
                isoCode={item.flag}
                size={25}
                style={styles.dropdownItemIconStyle}
              />
              <Text style={[styles.dropdownItemTxtStyle, {color: theme.text}]}>
                {item.title}
              </Text>
            </View>
          );
        }}
        showsVerticalScrollIndicator={false}
        dropdownStyle={[
          styles.dropdownMenuStyle,
          {backgroundColor: theme.background},
        ]}
      />
    </View>
  );
};

export default LanguageSelector;
