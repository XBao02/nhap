import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useTheme } from '../../../styles/ThemeContext';
import { useLanguage } from '../../../i18n';
import { NavigationService } from '../../../registries';
import { isTablet } from '../../../utils';

interface UrlInputModalProps {
  title?: string;
  initialUrl?: string;
  onConfirm: (url: string) => void;
  onCancel?: () => void;
}

export const UrlInputModal: React.FC<UrlInputModalProps> = ({
  title = 'Nhập URL ảnh',
  initialUrl = '',
  onConfirm,
  onCancel,
}) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [urlInput, setUrlInput] = useState(initialUrl);

  useEffect(() => {
    setUrlInput(initialUrl);
  }, [initialUrl]);

  const handleConfirm = () => {
    const trimmedUrl = urlInput.trim();
    
    if (!trimmedUrl) {
      Alert.alert('Lỗi', 'Vui lòng nhập URL của ảnh');
      return;
    }

    // Basic URL validation
    try {
      new URL(trimmedUrl);
    } catch (error) {
      Alert.alert('Lỗi', 'URL không hợp lệ. Vui lòng kiểm tra lại.');
      return;
    }

    onConfirm(trimmedUrl);
    NavigationService.hideModal();
  };

  const handleCancel = () => {
    setUrlInput(initialUrl);
    onCancel?.();
    NavigationService.hideModal();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
          <Icon name="close" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.label, { color: theme.text }]}>
          URL ảnh:
        </Text>
        <TextInput
          style={[
            styles.urlInput,
            {
              backgroundColor: theme.inputBackground,
              borderColor: theme.border,
              color: theme.text,
            },
          ]}
          placeholder="https://example.com/image.jpg"
          value={urlInput}
          onChangeText={setUrlInput}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          multiline={true}
          returnKeyType="done"
          onSubmitEditing={handleConfirm}
        />

        <Text style={[styles.hint, { color: theme.textSecondary }]}>
          Nhập URL của ảnh bạn muốn tải về. Hỗ trợ các định dạng: JPG, PNG, GIF, WebP
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[
            styles.button,
            styles.cancelButton,
            { backgroundColor: theme.backgroundSecondary },
          ]}
          onPress={handleCancel}>
          <Text style={[styles.cancelButtonText, { color: theme.text }]}>
            Hủy
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.confirmButton,
            { backgroundColor: theme.primary },
          ]}
          onPress={handleConfirm}>
          <View style={styles.buttonContent}>
            <Icon name="download" size={20} color="white" />
            <Text style={styles.confirmButtonText}>Tải ảnh</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    margin: 20,
    maxWidth: isTablet ? 500 : '90%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 0,
  },
  title: {
    fontSize: isTablet ? 22 : 20,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
  },
  label: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  urlInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: isTablet ? 16 : 14,
    minHeight: isTablet ? 100 : 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  hint: {
    fontSize: isTablet ? 14 : 12,
    lineHeight: isTablet ? 20 : 18,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  confirmButton: {
    // backgroundColor will be set by theme.primary
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cancelButtonText: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: '600',
  },
  confirmButtonText: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: '600',
    color: 'white',
  },
});

export default UrlInputModal;