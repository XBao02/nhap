import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useTheme } from '../../styles/ThemeContext';
import { isTablet } from '../../utils';

interface CustomDropdownProps {
  title: string;
  placeholder: string;
  data: string[];
  onSelect: (selectedItem: string, index: number) => void;
  defaultValue?: string | null;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  title,
  placeholder,
  data,
  onSelect,
  defaultValue,
}) => {
  const { theme } = useTheme();
  const [isOpened, setIsOpened] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(defaultValue || null);

  if (data.length === 0) return null;

  const handleSelect = (item: string, index: number) => {
    setSelectedItem(item);
    setIsOpened(false);
    onSelect(item, index);
  };

  const toggleDropdown = () => {
    setIsOpened(!isOpened);
  };

  // Simple arrow component to replace Icon
  const ArrowIcon = ({ isUp }: { isUp: boolean }) => (
    <View style={styles.arrowContainer}>
      <Text style={[styles.arrowText, { color: theme.text }]}>
        {isUp ? '▲' : '▼'}
      </Text>
    </View>
  );

  const dropdownMaxHeight = Platform.OS === 'windows' ? 200 : 250;

  return (
    <View style={[styles.sectionContainer, { backgroundColor: theme.surface }]}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>

      <View style={styles.dropdownContainer}>
        {/* Dropdown Button */}
        <TouchableOpacity
          style={[
            styles.dropdownButtonStyle,
            {
              backgroundColor: theme.inputBackground,
              borderColor: theme.border,
            },
            isOpened && styles.dropdownButtonOpen,
          ]}
          onPress={toggleDropdown}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.dropdownButtonTxtStyle,
              { color: selectedItem ? theme.text : theme.textSecondary }
            ]}
          >
            {selectedItem || placeholder}
          </Text>
          <ArrowIcon isUp={isOpened} />
        </TouchableOpacity>

        {/* Dropdown Menu */}
        {isOpened && (
          <View
            style={[
              styles.dropdownMenuStyle,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                maxHeight: dropdownMaxHeight,
              },
            ]}
          >
            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={Platform.OS !== 'windows'}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              scrollEventThrottle={16}
              bounces={false}
            >
              {data.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dropdownItemStyle,
                    {
                      backgroundColor: selectedItem === item
                        ? theme.selectedBackground || 'rgba(0, 217, 255, 0.1)'
                        : 'transparent',
                    },
                  ]}
                  onPress={() => handleSelect(item, index)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dropdownItemTxtStyle, { color: theme.text }]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    padding: isTablet ? 24 : 16,
    marginVertical: 8,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      windows: {
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  sectionTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  dropdownButtonStyle: {
    width: '100%',
    height: isTablet ? 56 : 50,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  dropdownButtonOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  dropdownButtonTxtStyle: {
    flex: 1,
    fontSize: isTablet ? 18 : 16,
    fontWeight: '500',
    textAlign: 'left',
  },
  arrowContainer: {
    paddingLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: 'bold',
  },
  dropdownMenuStyle: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    zIndex: 1000,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
      windows: {
        // Windows specific styling for dropdown
      },
    }),
  },
  scrollView: {
    maxHeight: 200,
  },
  dropdownItemStyle: {
    width: '100%',
    flexDirection: 'row',
    paddingHorizontal: 12,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: 12,
    minHeight: 44,
  },
  dropdownItemTxtStyle: {
    flex: 1,
    fontSize: isTablet ? 18 : 16,
    fontWeight: '500',
    textAlign: 'left',
  },
});