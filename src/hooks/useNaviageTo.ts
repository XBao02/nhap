import {useNavigation, NavigationProp} from '@react-navigation/native';
import type {RootStackParamList} from '../navigation/types';

export const useNavigateTo = () => {
  const navigateTo: any = useNavigation<NavigationProp<RootStackParamList>>();
  return {
    navigateTo,
  };
};

export default useNavigateTo;
