import React from 'react';
import {StyleProp, ViewStyle} from 'react-native';
import CountryFlag from 'react-native-country-flag-icon';

interface FlagIconProps {
  language: string;
  style?: StyleProp<ViewStyle>; 
  size?: number;
}

const FlagIcon: React.FC<FlagIconProps> = ({
  language,
  style,
  size = 12,
}) => {
  // Mã quốc gia theo chuẩn ISO 3166-1 alpha-2
  // 'vi' => 'VN', 'en' => 'GB'
  const countryCode = language === 'vi' ? 'VN' : 'GB';

  return (
    <CountryFlag
      isoCode={countryCode}
      size={size} 
      style={style}
    />
  );
};

export default FlagIcon;
