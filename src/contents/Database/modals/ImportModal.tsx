import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../../styles/ThemeContext';
import { GoogleSheetParams } from '../../../services';
import { useLanguage } from '../../../i18n';
import { CustomInput } from '../../../components/common';

interface ImportModalProps {
  title?: string;
  visible?: boolean;
  importFormData: GoogleSheetParams;
  importLoading: boolean;
  selectedDbKey: string;
  onClose: () => void;
  onImport: (params: GoogleSheetParams) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  title,
  importFormData,
  importLoading,
  selectedDbKey,
  onClose,
  onImport,
}) => {
  const { theme } = useTheme();
  const { t } = useLanguage();

  // Local state để quản lý form realtime
  const [localFormData, setLocalFormData] =
    useState<GoogleSheetParams>(importFormData);

  // Đồng bộ local với props nếu props thay đổi
  useEffect(() => {
    setLocalFormData(importFormData);
  }, [importFormData]);

  const handleImport = () => {
    onImport(localFormData);
  };

  // Update local state
  const handleFieldChange = (
    field: keyof GoogleSheetParams,
    value: string | number,
  ) => {
    setLocalFormData(prev => ({ ...prev, [field]: value }));
  };

  // Helper cho startFromRow
  const handleStartRowChange = (text: string) => {
    if (text === '') {
      handleFieldChange('startFromRow', '');
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
      handleFieldChange('startFromRow', 3);
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
            {t('button.close', 'Close')}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {title} ➤ {selectedDbKey}
        </Text>

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
          {/* Required fields notice */}
          <View
            style={[
              styles.noticeContainer,
              {
                backgroundColor: theme.background,
                borderLeftColor: theme.accent,
                borderColor: theme.border,
              },
            ]}>
            <Text style={[styles.noticeText, { color: theme.error }]}>
              {t('database.import.requiredNotice', 'Fields with (*) are required')}
            </Text>
          </View>

          {/* Google Sheet Link */}
          <View style={styles.fieldContainer}>
            <CustomInput
              label={t('database.import.googleSheetLink', 'Google Sheet Link')}
              value={localFormData.googleSheetLink}
              placeholder={t(
                'database.import.googleSheetLinkPlaceholder',
                'https://docs.google.com/spreadsheets/d/...',
              )}
              onChangeText={text => handleFieldChange('googleSheetLink', text)}
              editable={!importLoading}
              hint={t(
                'database.import.googleSheetLinkHint',
                'Enter the Google Sheet link in public mode',
              )}
              required={true}
              multiline={true}
              numberOfLines={3}
              textAlignVertical="top"
              selectTextOnFocus={true}
              clearButtonMode="while-editing"
            />
          </View>

          {/* Sheet Names */}
          <View style={styles.fieldContainer}>
            <CustomInput
              label={t('database.import.sheets', 'Sheet Names')}
              value={localFormData.sheets}
              placeholder={t(
                'database.import.sheetsPlaceholder',
                'categories, products',
              )}
              onChangeText={text => handleFieldChange('sheets', text)}
              editable={!importLoading}
              hint={t(
                'database.import.sheetsHint',
                'Sheet names separated by commas',
              )}
              required={true}
              selectTextOnFocus={true}
              clearButtonMode="while-editing"
            />
          </View>

          {/* Start Row */}
          <View style={styles.fieldContainer}>
            <CustomInput
              label={t('database.import.startFromRow', 'Start From Row')}
              value={localFormData.startFromRow.toString()}
              placeholder={t('database.import.startFromRowPlaceholder', '3')}
              onChangeText={handleStartRowChange}
              onBlur={handleStartRowBlur}
              keyboardType="numeric"
              editable={!importLoading}
              hint={t(
                'database.import.startFromRowHint',
                'Starting row for data (default is 3 to skip header)',
              )}
              required={false}
              clearButtonMode="while-editing"
            />
          </View>

          {/* Instructions Section */}
          <View style={styles.instructionsSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {t('database.intructions.title', 'Instructions')}
            </Text>

            <View
              style={[
                styles.instructionItem,
                { borderBottomColor: theme.border },
              ]}>
              <Text style={[styles.instructionNumber, { color: theme.primary }]}>
                1
              </Text>
              <View style={styles.instructionContent}>
                <Text style={[styles.instructionTitle, { color: theme.text }]}>
                  {t('database.intructions.step1.title', 'Prepare Google Sheet')}
                </Text>
                <Text
                  style={[
                    styles.instructionText,
                    { color: theme.textSecondary },
                  ]}>
                  {t(
                    'database.intructions.step1.text',
                    'Make sure your Google Sheet is shared as public or accessible via link',
                  )}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.instructionItem,
                { borderBottomColor: theme.border },
              ]}>
              <Text style={[styles.instructionNumber, { color: theme.primary }]}>
                2
              </Text>
              <View style={styles.instructionContent}>
                <Text style={[styles.instructionTitle, { color: theme.text }]}>
                  {t('database.intructions.step2.title', 'Format Data')}
                </Text>
                <Text
                  style={[
                    styles.instructionText,
                    { color: theme.textSecondary },
                  ]}>
                  {t(
                    'database.intructions.step2.text',
                    'Ensure the first row contains column headers matching your database schema',
                  )}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.instructionItem,
                { borderBottomColor: theme.border },
              ]}>
              <Text style={[styles.instructionNumber, { color: theme.primary }]}>
                3
              </Text>
              <View style={styles.instructionContent}>
                <Text style={[styles.instructionTitle, { color: theme.text }]}>
                  {t('database.intructions.step3.title', 'Copy Link')}
                </Text>
                <Text
                  style={[
                    styles.instructionText,
                    { color: theme.textSecondary },
                  ]}>
                  {t(
                    'database.intructions.step3.text',
                    'Copy the full URL of your Google Sheet and paste it above',
                  )}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Loading indicator */}
        {importLoading && (
          <View
            style={[
              styles.loadingContainer,
              {
                backgroundColor: theme.background,
                borderColor: theme.border,
              },
            ]}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              {t('database.import.loading.text', 'Importing data from Google Sheet...')}
            </Text>
            <Text style={[styles.loadingSubText, { color: theme.textSecondary }]}>
              {t(
                'database.import.loading.subText',
                'Please wait, this process may take a few seconds',
              )}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  // Base container styles
  container: {
    flex: 1,
  },

  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    minHeight: 56,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  importButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
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

  // Notice styles
  noticeContainer: {
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderWidth: 1,
  },
  noticeText: {
    fontSize: 13,
    fontStyle: 'italic',
  },

  // Field container
  fieldContainer: {
    marginBottom: 16,
  },

  // Instructions section
  instructionsSection: {
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    alignItems: 'flex-start',
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 12,
    marginTop: 2,
  },
  instructionContent: {
    flex: 1,
  },
  instructionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  instructionText: {
    fontSize: 13,
    lineHeight: 18,
  },

  // Loading styles
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
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
    textAlign: 'center',
    fontWeight: '500',
  },
  loadingSubText: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
});

export default ImportModal;
