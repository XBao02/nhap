import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';

interface ThemeIconProps {
  isDark: boolean; // Nếu là dark mode thì dùng biểu tượng mặt trời (sun), ngược lại là moon
  style?: StyleProp<ViewStyle>;
  width?: number;
  height?: number;
  color?: string;
}

const ThemeIcon: React.FC<ThemeIconProps> = ({
  isDark,
  style,
  width = 12,
  height = 12,
  color = '#000',
}) => {
  const iconName = isDark ? 'wb-sunny' : 'nightlight-round'; // MaterialIcons: sun/moon

  return (
    <Icon
      name={iconName}
      size={Math.max(width, height)} // icon dùng size, không có width/height riêng
      style={style}
      color={color}
    />
  );
};

export default ThemeIcon;
