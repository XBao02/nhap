import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ReturnKeyTypeOptions,
  KeyboardTypeOptions,
} from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useTheme } from '../../styles/ThemeContext';
import ErrorMessage from './ErrorMessage';
import { isTablet } from '../../utils';

interface CustomInputProps {
  // Basic props
  label?: string;
  value: string;
  placeholder?: string;
  onChangeText?: (value: string) => void;
  onBlur?: () => void;
  
  // Validation props
  error?: string;
  touched?: boolean;
  required?: boolean;
  
  // Visual & interaction props
  editable?: boolean;
  hint?: string;
  iconName?: string;
  
  // Security props
  secureTextEntry?: boolean;
  showPassword?: boolean;
  toggleShowPassword?: () => void;
  
  // Keyboard props
  keyboardType?: KeyboardTypeOptions;
  returnKeyType?: ReturnKeyTypeOptions;
  onSubmitEditing?: () => void;
  blurOnSubmit?: boolean;
  autoFocus?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  autoComplete?: 
    | 'off'
    | 'username'
    | 'password'
    | 'email'
    | 'name'
    | 'tel'
    | 'street-address'
    | 'postal-code'
    | 'cc-number'
    | 'cc-csc'
    | 'cc-exp'
    | 'cc-exp-month'
    | 'cc-exp-year'
    | 'birthdate-full'
    | 'birthdate-day'
    | 'birthdate-month'
    | 'birthdate-year';
  
  // Text input behavior props
  multiline?: boolean;
  numberOfLines?: number;
  textAlignVertical?: 'auto' | 'top' | 'bottom' | 'center';
  selectTextOnFocus?: boolean;
  clearButtonMode?: 'never' | 'while-editing' | 'unless-editing' | 'always';
  maxLength?: number;
  
  // Text styling props
  textAlign?: 'left' | 'center' | 'right';
  
  // Additional behavior props
  caretHidden?: boolean;
  contextMenuHidden?: boolean;
  defaultValue?: string;
  
  // Event handlers
  onFocus?: () => void;
  onEndEditing?: (e: { nativeEvent: { text: string } }) => void;
  onSelectionChange?: (e: { nativeEvent: { selection: { start: number; end: number } } }) => void;
  onKeyPress?: (e: { nativeEvent: { key: string } }) => void;
  
  // Style props (optional - nếu muốn custom style từ bên ngoài)
  containerStyle?: any;
  inputStyle?: any;
  labelStyle?: any;
  errorStyle?: any;
}

// Hoặc có thể định nghĩa các type riêng để dễ maintain:

// Keyboard Types
export type KeyboardTypes = 
  | 'default'
  | 'email-address' 
  | 'numeric'
  | 'phone-pad'
  | 'ascii-capable'
  | 'numbers-and-punctuation'
  | 'url'
  | 'number-pad'
  | 'name-phone-pad'
  | 'decimal-pad'
  | 'twitter'
  | 'web-search'
  | 'visible-password';

// Return Key Types  
export type ReturnKeyTypes =
  | 'done'
  | 'go' 
  | 'next'
  | 'search'
  | 'send'
  | 'none'
  | 'previous'
  | 'default'
  | 'emergency-call'
  | 'google'
  | 'join'
  | 'route'
  | 'yahoo';

// Auto Capitalize Types
export type AutoCapitalizeTypes = 
  | 'none'
  | 'sentences' 
  | 'words'
  | 'characters';

// Text Align Types
export type TextAlignTypes = 
  | 'left'
  | 'center'
  | 'right'
  | 'justify'; // Android only

// Alternative interface with custom types
interface CustomInputPropsAlternative {
  // Basic props
  label?: string;
  value: string;
  placeholder?: string;
  onChangeText?: (value: string) => void;
  onBlur?: () => void;
  
  // Validation props
  error?: string;
  touched?: boolean;
  required?: boolean;
  
  // Visual & interaction props
  editable?: boolean;
  hint?: string;
  iconName?: string;
  
  // Security props
  secureTextEntry?: boolean;
  showPassword?: boolean;
  toggleShowPassword?: () => void;
  
  // Keyboard props với custom types
  keyboardType?: KeyboardTypes;
  returnKeyType?: ReturnKeyTypes;
  onSubmitEditing?: () => void;
  blurOnSubmit?: boolean;
  autoFocus?: boolean;
  autoCapitalize?: AutoCapitalizeTypes;
  autoCorrect?: boolean;
  
  // Text input behavior props
  multiline?: boolean;
  numberOfLines?: number;
  textAlignVertical?: 'auto' | 'top' | 'bottom' | 'center';
  textAlign?: TextAlignTypes;
  selectTextOnFocus?: boolean;
  clearButtonMode?: 'never' | 'while-editing' | 'unless-editing' | 'always';
  maxLength?: number;
  
  // Additional behavior props
  caretHidden?: boolean;
  contextMenuHidden?: boolean;
  defaultValue?: string;
  
  // Event handlers
  onFocus?: () => void;
  onEndEditing?: (e: { nativeEvent: { text: string } }) => void;
  onSelectionChange?: (e: { nativeEvent: { selection: { start: number; end: number } } }) => void;
  onKeyPress?: (e: { nativeEvent: { key: string } }) => void;
  
  // Style props
  containerStyle?: any;
  inputStyle?: any;
  labelStyle?: any;
  errorStyle?: any;
}

export const CustomInput: React.FC<CustomInputProps> = React.memo(
  ({
    label,
    value,
    placeholder,
    onChangeText,
    onBlur,
    error,
    touched,
    editable = true,
    secureTextEntry,
    showPassword,
    toggleShowPassword,
    keyboardType,
    iconName,
    hint,
    required = false,
    multiline = false,
    numberOfLines = 1,
    textAlignVertical = 'center',
    selectTextOnFocus = false,
    clearButtonMode = 'never',
    // Các props mới
    returnKeyType = 'default',
    onSubmitEditing,
    blurOnSubmit = true,
    autoFocus = false,
  }) => {
    const { theme } = useTheme();

    // Tính toán chiều cao dựa trên multiline và numberOfLines
    const getInputHeight = () => {
      if (multiline && numberOfLines > 1) {
        const baseHeight = 20; // padding
        const lineHeight = 20;
        return baseHeight + (lineHeight * numberOfLines) + 16; // 16 cho padding top/bottom
      }
      return isTablet ? 60 : 56;
    };

    const inputWrapperStyle = [
      styles.inputWrapper,
      isTablet && styles.inputWrapperTablet,
      {
        backgroundColor: editable ? theme.surface : theme.disabled || '#f5f5f5',
        borderColor: error && touched ? theme.error : theme.border,
        borderWidth: error && touched ? 1.5 : 1,
        opacity: editable ? 1 : 0.6,
        height: getInputHeight(),
        alignItems: multiline ? ('flex-start' as const) : ('center' as const),
        ...(multiline && { paddingTop: 16 }),
      },
    ];

    const renderInputField = () => (
      <View
        style={[
          styles.inputFieldContainer,
          isTablet && styles.inputFieldTablet,
        ]}>
        <View style={inputWrapperStyle}>
          {iconName && !multiline && (
            <Icon
              name={iconName as any}
              size={20}
              color="#00D9FF"
              style={styles.inputIcon}
            />
          )}
          <TextInput
            style={[
              styles.textInput,
              { color: theme.text },
              multiline && styles.textInputMultiline,
            ]}
            placeholder={placeholder}
            placeholderTextColor={theme.textSecondary}
            value={value}
            onChangeText={onChangeText}
            onBlur={onBlur}
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
            autoCapitalize="none"
            autoCorrect={false}
            editable={editable}
            multiline={multiline}
            numberOfLines={numberOfLines}
            textAlignVertical={multiline ? textAlignVertical : 'center'}
            selectTextOnFocus={selectTextOnFocus}
            clearButtonMode={clearButtonMode}
            // Thêm các props keyboard mới
            returnKeyType={returnKeyType}
            onSubmitEditing={onSubmitEditing}
            blurOnSubmit={blurOnSubmit}
            autoFocus={autoFocus}
          />
          {toggleShowPassword && !multiline && (
            <TouchableOpacity
              onPress={toggleShowPassword}
              style={styles.eyeIcon}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Icon
                name={showPassword ? 'visibility' : 'visibility-off'}
                size={20}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
        {error && touched && (
          <View style={isTablet ? styles.errorMessageTablet : undefined}>
            <ErrorMessage message={error} />
          </View>
        )}
      </View>
    );

    const renderLabel = () => (
      <View style={styles.labelWrapper}>
        <Text
          style={[
            styles.inputLabel,
            isTablet && styles.inputLabelTablet,
            { color: theme.text },
          ]}>
          {label}
          {required && (
            <Text style={[styles.required, { color: theme.error }]}> *</Text>
          )}
        </Text>
        {hint && (
          <Text
            style={[
              styles.hintText,
              isTablet && styles.hintTextTablet,
              { color: theme.textSecondary },
            ]}>
            {hint}
          </Text>
        )}
      </View>
    );

    if (isTablet) {
      return (
        <View style={[styles.inputContainer, styles.inputContainerTablet]}>
          <View style={[
            styles.labelContainer,
            multiline && styles.labelContainerMultiline,
          ]}>
            {renderLabel()}
          </View>
          {renderInputField()}
        </View>
      );
    }

    // Mobile layout - giữ nguyên cấu trúc cũ
    return (
      <View style={styles.inputContainer}>
        {renderLabel()}
        {renderInputField()}
      </View>
    );
  },
);

export default CustomInput;

const styles = StyleSheet.create({
  // Styles chung
  inputContainer: {
    marginBottom: 20,
  },
  labelWrapper: {
    marginBottom: 8,
    marginLeft: 4,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  required: {
    fontSize: 14,
    fontWeight: '600',
  },
  hintText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 2,
    lineHeight: 16,
  },
  inputFieldContainer: {
    flex: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  textInputMultiline: {
    // Styles đặc biệt cho multiline input
    textAlignVertical: 'top',
    paddingTop: 0, // Reset padding để tránh conflict
  },
  eyeIcon: {
    padding: 4,
  },

  // Tablet specific styles
  inputContainerTablet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  labelContainer: {
    width: 140,
    paddingRight: 16,
    paddingTop: 16, // Căn chỉnh với input field
  },
  labelContainerMultiline: {
    paddingTop: 16, // Điều chỉnh padding top cho multiline
  },
  inputLabelTablet: {
    marginBottom: 0,
    marginLeft: 0,
    fontSize: 15,
    textAlign: 'right',
  },
  hintTextTablet: {
    textAlign: 'right',
    fontSize: 11,
  },
  inputFieldTablet: {
    flex: 1,
    minWidth: 0, // Đảm bảo flex hoạt động đúng
  },
  inputWrapperTablet: {
    height: 60, // Tăng chiều cao cho tablet
  },
  errorMessageTablet: {
    marginLeft: 0, // Reset margin cho tablet
  },
});