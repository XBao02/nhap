import React from 'react';
import {View, Text} from 'react-native';
import {useLanguage} from '../../../i18n';
import {useTheme} from '../../../styles/ThemeContext';
import {styles} from '../settingsStyles';

const SettingsHeader: React.FC = () => {
  const {t} = useLanguage();
  const {theme} = useTheme();

  return (
    <View style={styles.headerContainer}>
      <Text style={[styles.title, {color: theme.text}]}>
        {t('settings.title')}
      </Text>
    </View>
  );
};

export default SettingsHeader;
