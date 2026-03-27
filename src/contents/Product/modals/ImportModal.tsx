import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { useTheme } from '../../../styles/ThemeContext';
import { GoogleSheetParams } from '../../../services';
import { useLanguage } from '../../../i18n';

interface ImportModalProps {
  title?: string;
  visible?: boolean;
  importFormData: GoogleSheetParams;
  importLoading: boolean;
  onClose: () => void;
  onImport: (parms: GoogleSheetParams) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  title = 'Import từ GoogleSheet',
  importFormData,
  importLoading,
  onClose,
  onImport,
}) => {
  const { theme } = useTheme();
  const { t } = useLanguage();

  // Local state để quản lý form realtime
  const [localFormData, setLocalFormData] =
    useState<GoogleSheetParams>(importFormData);

  // Đồng bộ local với props nếu props thay đổi (hiếm xảy ra trong public modal)
  useEffect(() => {
    setLocalFormData(importFormData);
  }, [importFormData]);

  const handleImport = () => {
    onImport(localFormData); // Truyền localFormData về component cha
  };

  // Update local state và sync với cha
  const handleFieldChange = (
    field: keyof GoogleSheetParams,
    value: string | number,
  ) => {
    setLocalFormData(prev => ({ ...prev, [field]: value }));
  };

  // Helper cho startFromRow
  const handleStartRowChange = (text: string) => {
    if (text === '') {
      handleFieldChange('startFromRow', ''); // Cho phép rỗng tạm thời
      return;
    }
    const num = parseInt(text, 10);
    if (!isNaN(num) && num >= 1) {
      handleFieldChange('startFromRow', num);
    }
  };

  // Validate khi blur cho startFromRow
  const handleStartRowBlur = () => {
    const current = localFormData.startFromRow;
    if (!current || isNaN(Number(current)) || Number(current) < 1) {
      handleFieldChange('startFromRow', 3); // Reset default nếu invalid
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.background,
            borderBottomColor: theme.border,
          },
        ]}>
        <TouchableOpacity
          onPress={() => !importLoading && onClose()}
          disabled={importLoading}
          style={[styles.cancelButton, { backgroundColor: 'transparent' }]}>
          <Text
            style={[
              styles.cancelButtonText,
              { color: theme.textSecondary },
              importLoading && styles.disabledText,
            ]}>
            {t('button.close', 'close')}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.text }]}>{title}</Text>

        <TouchableOpacity
          onPress={handleImport}
          disabled={importLoading}
          style={[styles.importButton, { backgroundColor: theme.primary }]}>
          <Text
            style={[
              styles.importButtonText,
              importLoading && styles.disabledText,
            ]}>
            {importLoading
              ? t('button.loading', 'Loading...')
              : t('button.import', 'Import')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        bounces={false}>
        {/* Form Fields */}
        <View style={styles.formContainer}>
          {/* Google Sheet Link */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>
              Đường dẫn Google Sheet *
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              value={localFormData.googleSheetLink} // Sử dụng local state
              onChangeText={text => handleFieldChange('googleSheetLink', text)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={3}
              editable={!importLoading}
              textAlignVertical="top"
              autoCapitalize="none"
              autoCorrect={false}
              selectTextOnFocus={true}
              clearButtonMode="while-editing"
            />
            <Text style={[styles.inputHelper, { color: theme.textSecondary }]}>
              Nhập link Google Sheet ở chế độ public
            </Text>
          </View>

          {/* Sheet Names */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>
              Tên các sheet *
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              value={localFormData.sheets} // Sử dụng local state
              onChangeText={text => handleFieldChange('sheets', text)}
              placeholder="categories, products"
              placeholderTextColor={theme.textSecondary}
              editable={!importLoading}
              autoCapitalize="none"
              autoCorrect={false}
              selectTextOnFocus={true}
              clearButtonMode="while-editing"
            />
            <Text style={[styles.inputHelper, { color: theme.textSecondary }]}>
              Các tên sheet cách nhau bởi dấu phẩy
            </Text>
          </View>

          {/* Start Row */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>
              Dòng bắt đầu
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              value={localFormData.startFromRow.toString()} // Sử dụng local state
              onChangeText={handleStartRowChange}
              onBlur={handleStartRowBlur} // Validate khi blur
              placeholder="3"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
              editable={!importLoading}
              clearButtonMode="while-editing"
            />
            <Text style={[styles.inputHelper, { color: theme.textSecondary }]}>
              Dòng bắt đầu là dòng dữ liệu (mặc định là 3 để bỏ qua header)
            </Text>
          </View>
        </View>

        {/* Loading indicator */}
        {importLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Đang import dữ liệu từ Google Sheet...
            </Text>
            <Text style={[styles.loadingSubText, { color: theme.textSecondary }]}>
              Vui lòng đợi, quá trình này có thể mất vài giây
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

// Styles giữ nguyên

export const styles = StyleSheet.create({
  // Base container styles
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },

  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    minHeight: 56,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '500',
  },
  importButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#007AFF',
    minWidth: 80,
    alignItems: 'center',
  },
  importButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  disabledText: {
    opacity: 0.5,
  },

  // Content styles
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },

  // Form styles
  formContainer: {
    paddingVertical: 16,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: 44,
    color: '#212529',
  },
  inputHelper: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
    lineHeight: 16,
  },

  // Sample data styles
  sampleDataContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    marginTop: 4,
  },
  sampleDataText: {
    fontSize: 12,
    color: '#495057',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 16,
  },

  // Section styles (for instructions)
  section: {
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },

  // Instruction styles
  instructionItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  instructionIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  instructionContent: {
    flex: 1,
  },
  instructionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  instructionText: {
    fontSize: 13,
    color: '#6c757d',
    lineHeight: 18,
  },

  // Loading styles
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    fontWeight: '500',
  },
  loadingSubText: {
    marginTop: 8,
    fontSize: 14,
    color: '#adb5bd',
    textAlign: 'center',
  },

  // FAQ styles (from HelpModal - for consistency)
  faqItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  answer: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
  },

  // Contact button styles (from HelpModal - for consistency)
  contactButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
