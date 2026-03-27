import React from 'react';
import {useLanguage} from '../../../i18n';
import {MultiSelectField} from '../../../components/common';
import {isTablet} from '../../../utils';

interface Role {
  id: string;
  name: string;
}

interface RoleSelectorProps {
  roles: Role[];
  selectedRoles: string[];
  onRoleChange: (roleIds: string[]) => void;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({
  roles,
  selectedRoles,
  onRoleChange,
}) => {
  const {t} = useLanguage();
  const dropdownData = roles.map(role => ({
    label: t(role.name),
    value: role.id,
  }));

  return (
    <MultiSelectField
      data={dropdownData}
      selectedValues={selectedRoles}
      onChange={onRoleChange}
      titleKey="settings.roleTitle"
      placeholderKey="settings.selectRoles"
      labelField="label"
      valueField="value"
      selectedKey="settings.selected"
      noneKey="settings.none"
      showSelectedList={isTablet}
    />
  );
};

export default RoleSelector;
