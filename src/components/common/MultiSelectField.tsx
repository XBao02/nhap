import React from 'react';
import {View, Text,StyleSheet} from 'react-native';
import {useLanguage} from '../../i18n';
import {useTheme} from '../../styles/ThemeContext';
import {MultiSelect} from 'react-native-element-dropdown';
import Icon from '@react-native-vector-icons/material-icons';

interface MultiSelectFieldProps<T> {
  data: T[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  titleKey: string;
  placeholderKey: string;
  labelField: keyof T | string;
  valueField: keyof T | string;
  selectedKey?: string;
  noneKey?: string;
  showSelectedList?: boolean;
}

export const MultiSelectField = <T extends Record<string, any>>({
  data,
  selectedValues,
  onChange,
  titleKey,
  placeholderKey,
  labelField,
  valueField,
  selectedKey,
  noneKey,
  showSelectedList,
}: MultiSelectFieldProps<T>) => {
  const {t} = useLanguage();
  const {theme} = useTheme();

  return (
    <View style={[styles.sectionContainer, {backgroundColor: theme.surface}]}>
      <Text style={[styles.sectionTitle, {color: theme.text}]}>
        {t(titleKey)}
      </Text>
      <MultiSelect
        data={data}
        value={selectedValues}
        onChange={onChange}
        style={[styles.dropdown, {borderColor: theme.border}]}
        containerStyle={{backgroundColor: theme.surface}}
        itemTextStyle={{color: theme.text}}
        placeholderStyle={{color: theme.textSecondary}}
        selectedTextStyle={{color: theme.accent}}
        activeColor={theme.selectedBackground}
        labelField={labelField as string}
        valueField={valueField as string}
        placeholder={t(placeholderKey)}
        renderLeftIcon={
          () => (
            <Icon
              name="list"
              size={24}
              color={theme.accent}
              style={{ marginRight: 10 }}
            />
          )
        }
        renderSelectedItem={(item, unSelect) => (
            <View
              style={[styles.selectedItem, { backgroundColor: theme.selectedBackground }]}
            >
              <Text style={[styles.selectedItemText, { color: theme.text }]}>
                {item[labelField]}
              </Text>
              <Icon
                name="close"
                size={18}
                color={theme.accent}
                onPress={() => unSelect && unSelect(item)}
              />
            </View>
          )
        }
      />
      {showSelectedList && selectedKey && noneKey && (
        <Text style={[styles.selectedText, {color: theme.textSecondary}]}>
          {t(selectedKey)}:{' '}
          {selectedValues.length > 0
            ? data
                .filter(item => selectedValues.includes(item[valueField]))
                .map(item => item[labelField])
                .join(', ')
            : t(noneKey)}
        </Text>
      )}
    </View>
  );
};

export default MultiSelectField;


const styles = StyleSheet.create({
  sectionContainer: {
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkboxLabel: {
    fontSize: 16,
    marginLeft: 8,
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginVertical: 4,
  },
  selectedItemText: {
    fontSize: 14,
    marginRight: 6,
  },
  selectedText: {
    fontSize: 14,
    marginTop: 8,
  },
});