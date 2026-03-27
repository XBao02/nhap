import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

interface LogoProps {
  width?: number;
  height?: number;
  style?: StyleProp<ImageStyle>;
  color?: string; // Thêm color để dùng làm tintColor
}

const Logo: React.FC<LogoProps> = ({
  width = 100,
  height = 100,
  style,
  color,
}) => {
  return (
    <Image
      source={require('./mypos-logo.png')} 
      style={[
        {
          width,
          height,
          resizeMode: 'contain',
          tintColor: color, // Đây là cách áp màu cho ảnh PNG (nếu ảnh là đơn sắc)
        },
        style,
      ]}
    />
  );
};

export default Logo;
