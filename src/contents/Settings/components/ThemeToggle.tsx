import React from 'react';
import {View, Text, Switch} from 'react-native';
import {useLanguage} from '../../../i18n';
import {useTheme} from '../../../styles/ThemeContext';
import {styles} from '../settingsStyles';

interface ThemeToggleProps {
  onToggle: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({onToggle}) => {
  const {t} = useLanguage();
  const {theme, isDark} = useTheme();

  return (
    <View style={[styles.toggleContainer, {backgroundColor: theme.surface}]}>
      <Text style={[styles.sectionTitle, {color: theme.text}]}>
        {t('settings.themeTitle')}
      </Text>
      <Switch
        value={isDark}
        onValueChange={onToggle}
        trackColor={{false: theme.border, true: theme.accent}}
        thumbColor={theme.text}
      />
    </View>
  );
};

export default ThemeToggle;
