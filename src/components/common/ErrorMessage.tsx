import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import {useTheme} from '../../styles/ThemeContext';
import {isTablet} from '../../utils';

interface ErrorMessageProps {
  message: string;
  isGeneral?: boolean;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = React.memo(
  ({message, isGeneral = false}) => {
    const {theme} = useTheme();

    return (
      <View
        style={[
          isGeneral ? styles.errorContainer : styles.fieldErrorContainer,
          isGeneral && {
            backgroundColor: theme.error + '20',
            borderColor: theme.error,
          },
        ]}>
        <Icon name="error" size={isGeneral ? 16 : 14} color={theme.error} />
        <Text
          style={[
            isGeneral ? styles.errorText : styles.fieldErrorText,
            {color: theme.error},
          ]}>
          {message}
        </Text>
      </View>
    );
  },
);

export default ErrorMessage;

const styles = StyleSheet.create({
  fieldErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginLeft: 4,
  },
  fieldErrorText: {
    fontSize: 12,
    marginLeft: 4,
    flex: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: isTablet ? 0 : 20,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
});
