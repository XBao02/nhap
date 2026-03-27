import React from 'react';
import {View, Text, TouchableOpacity, ScrollView, StyleSheet} from 'react-native';
import {useTheme} from '../../../styles/ThemeContext';
import Icon from '@react-native-vector-icons/material-icons';
import {styles} from './modalStyles';

interface FeedbackModalProps {
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({onClose}) => {
  const {theme} = useTheme();

  return (
    <View style={[styles.container, {backgroundColor: theme.background}]}>
      {/* Header */}
      <View style={[styles.header, {borderBottomColor: theme.border}]}>
        <Text style={[styles.headerTitle, {color: theme.text}]}>
          Send Feedback
        </Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Icon name="close" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.description, {color: theme.textSecondary}]}>
          We'd love to hear your feedback! Let us know what you think about the app.
        </Text>

        <TouchableOpacity
          style={[styles.feedbackButton, {backgroundColor: theme.primary}]}
          onPress={() => {
            // Handle feedback logic
            console.log('Opening feedback form...');
          }}>
          <Text style={styles.feedbackButtonText}>
            Rate App
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.feedbackButton, {backgroundColor: theme.secondary}]}
          onPress={() => {
            // Handle suggestion logic
            console.log('Opening suggestion form...');
          }}>
          <Text style={styles.feedbackButtonText}>
            Send Suggestion
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};