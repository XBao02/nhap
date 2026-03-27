import React from 'react';
import {useLanguage} from '../../../i18n';
import {MultiSelectField} from '../../../components/common';
import {isTablet} from '../../../utils';

interface Industry {
  id: string;
  name: string;
}

interface IndustrySelectorProps {
  industries: Industry[];
  selectedIndustries: string[];
  onIndustryChange: (industryIds: string[]) => void;
}

const IndustrySelector: React.FC<IndustrySelectorProps> = ({
  industries,
  selectedIndustries,
  onIndustryChange,
}) => {
  const {t} = useLanguage();
  // Chuyển đổi industries thành định dạng phù hợp với MultiSelect
  const dropdownData = industries.map(industry => ({
    label: t(industry.name),
    value: industry.id,
  }));

  return (
    <MultiSelectField
      data={dropdownData}
      selectedValues={selectedIndustries}
      onChange={onIndustryChange}
      titleKey="settings.industryTitle"
      placeholderKey="settings.selectIndustries"
      labelField="label"
      valueField="value"
      selectedKey="settings.selected"
      noneKey="settings.none"
      showSelectedList={isTablet}
    />
  );
};

export default IndustrySelector;
