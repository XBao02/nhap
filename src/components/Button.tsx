import React from 'react';
import {TouchableOpacity, Text, StyleSheet} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../styles/colors';

type ButtonProps = {
  title: string;
  onPress: () => void;
  style?: object;
  textStyle?: object;
  accessibilityLabel?:string;
};

const Button: React.FC<ButtonProps> = ({title, onPress, style, textStyle, accessibilityLabel}) => {
    const { t } = useTranslation();
  return (
    <TouchableOpacity style={[styles.button, style]} onPress={onPress}
     accessible={true}
      accessibilityLabel={accessibilityLabel || t(title)}
    >
      <Text style={[styles.buttonText, textStyle]}>{t(title)}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.button,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.buttonText,
    fontSize: 16,
    fontWeight: '600',
  },
});

// export default Button;
export default React.memo(Button);
