import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useLanguage} from '../../../i18n';
import { useTheme } from '../../../styles/ThemeContext';
import { isTablet } from '../../../utils';

interface User {
  id: string;
  username?: string;
  full_name?: string;
  email?: string;
  avatar?: string;
  last_login?: string;
}

interface ChangeUserModalProps {
  users: User[];
  selectedUserId: string;
  onSelectUser: (user: User) => void;
  onClose: () => void;
  onAddNewUser: () => void;
  isLoading: boolean;
}

export const ChangeUserModal: React.FC<ChangeUserModalProps> = ({
  users,
  selectedUserId,
  onSelectUser,
  onClose,
  onAddNewUser,
  isLoading,
}) => {
  const { t } = useLanguage();
  const { theme, isDark } = useTheme();

  const styles = {
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold' as const,
      color: theme.text,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      backgroundColor: theme.surface,
    },
    closeText: {
      fontSize: 18,
      fontWeight: 'bold' as const,
      color: theme.textSecondary,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    loadingText: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: 12,
    },
    userList: {
      flex: 1,
    },
    userItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      padding: 16,
      marginVertical: 4,
      borderRadius: 12,
      borderWidth: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
    },
    userAvatarContainer: {
      position: 'relative' as const,
      marginRight: 16,
    },
    userAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
    },
    userAvatarDefault: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    userAvatarText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: 'bold' as const,
    },
    selectedIndicator: {
      position: 'absolute' as const,
      top: -4,
      right: -4,
      width: 20,
      height: 20,
      borderRadius: 10,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      backgroundColor: theme.accent,
    },
    selectedCheckmark: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: 'bold' as const,
    },
    userInfo: {
      flex: 1,
    },
    userDisplayName: {
      fontSize: 16,
      fontWeight: '600' as const,
      marginBottom: 2,
      color: theme.text,
    },
    userEmail: {
      fontSize: 14,
      marginBottom: 2,
      color: theme.textSecondary,
    },
    userLastLogin: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    addUserButton: {
      marginTop: 16,
      marginBottom: 20,
      borderRadius: 12,
      borderWidth: 1,
      borderStyle: 'dashed' as const,
      borderColor: theme.border,
      overflow: 'hidden' as const,
    },
    addUserButtonGradient: {
      paddingVertical: 16,
      paddingHorizontal: 24,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    addUserButtonText: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: theme.accent,
    },
  };

  const renderUserItem = ({ item }: { item: User }) => {
    const isSelected = item.id === selectedUserId;
    const displayName = item.full_name || item.username || item.email || item.id;
    const displayEmail = item.email || `${item.id}@gmail.com`;

    return (
      <TouchableOpacity
        style={[
          styles.userItem,
          {
            backgroundColor: isSelected ? theme.accent + '20' : theme.surface,
            borderColor: isSelected ? theme.accent : theme.border,
          },
        ]}
        onPress={() => onSelectUser(item)}
      >
        <View style={styles.userAvatarContainer}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.userAvatar} />
          ) : (
            <LinearGradient
              colors={[theme.accent, theme.primary]}
              style={styles.userAvatarDefault}
            >
              <Text style={styles.userAvatarText}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
          )}
          {isSelected && (
            <View style={styles.selectedIndicator}>
              <Text style={styles.selectedCheckmark}>✓</Text>
            </View>
          )}
        </View>
        
        <View style={styles.userInfo}>
          <Text style={styles.userDisplayName}>
            {displayName}
          </Text>
          <Text style={styles.userEmail}>
            {displayEmail}
          </Text>
          {item.last_login && (
            <Text style={styles.userLastLogin}>
              {t('login.lastLogin')}: {new Date(item.last_login).toLocaleDateString()}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {t('login.selectUser')}
        </Text>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={onClose}
        >
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={styles.loadingText}>
              {t('login.loadingUsers')}
            </Text>
          </View>
        ) : (
          <>
            <FlatList
              data={users}
              renderItem={renderUserItem}
              keyExtractor={(item) => item.id}
              style={styles.userList}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 8 }}
            />

            {/* Add New User Button */}
            <TouchableOpacity
              style={styles.addUserButton}
              onPress={onAddNewUser}
            >
              <LinearGradient
                colors={[theme.accent + '20', theme.primary + '20']}
                style={styles.addUserButtonGradient}
              >
                <Text style={styles.addUserButtonText}>
                  + {t('login.addNewUser')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

export default ChangeUserModal;