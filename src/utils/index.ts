import {Dimensions} from 'react-native';
const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;
const isDesktop = width >= 1024;

export { isTablet, isDesktop, width, height };
export * from './storage';
export * from './generateUID';