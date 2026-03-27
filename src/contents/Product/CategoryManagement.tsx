import React, {useState} from 'react';
import {View} from 'react-native';
import CategoriesTree from './CategoriesTree';
import {categoryService} from '../../services';

export const CategoryManagement = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  return (
    <View>
      <CategoriesTree
        storeId="POS1755159103808U1M8"
        title="Category Management"
        showActiveOnly={true}
        refreshTrigger={refreshTrigger}
        onCategoryEdit={category => {
          // Handle edit
        }}
        onCategoryDelete={async category => {
          await categoryService.delete(category.id);
          setRefreshTrigger(prev => prev + 1);
        }}
      />
    </View>
  );
};
