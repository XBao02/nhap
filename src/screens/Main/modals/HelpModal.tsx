import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { styles } from './modalStyles';
import { useTheme } from '../../../styles/ThemeContext';
import Icon from '@react-native-vector-icons/material-icons';

interface HelpModalProps {
  title?: string;
  showContactForm?: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({
  title = 'Help & Support',
  showContactForm = false,
  onClose,
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {title}
        </Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Icon name="close" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        bounces={false}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Frequently Asked Questions
          </Text>

          <View style={[styles.faqItem, { borderBottomColor: theme.border }]}>
            <Text style={[styles.question, { color: theme.text }]}>
              How do I reset my password?
            </Text>
            <Text style={[styles.answer, { color: theme.textSecondary }]}>
              Go to Settings -- Account -- Change Password to reset your password.
            </Text>
          </View>

          <View style={[styles.faqItem, { borderBottomColor: theme.border }]}>
            <Text style={[styles.question, { color: theme.text }]}>
              How do I contact support?
            </Text>
            <Text style={[styles.answer, { color: theme.textSecondary }]}>
              You can contact our support team through the contact form below or email us at support@example.com
            </Text>
          </View>
        </View>

        {showContactForm && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Contact Support
            </Text>
            <TouchableOpacity
              style={[styles.contactButton, { backgroundColor: theme.primary }]}
              onPress={() => {
                // Handle contact form logic
                console.log('Opening contact form...');
              }}>
              <Text style={styles.contactButtonText}>
                Open Contact Form
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};