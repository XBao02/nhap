import React from 'react';
import {
  DashboardHeader,
  RevenueChart,
  InventoryTable,
  TopSellingList,
} from './components';
import useDashboard from './useDashboard';
import {useMainLayout} from '../../hooks';

export const DashboardContent: React.FC = () => {
  const {revenueData, inventoryData, topSellingData} = useDashboard();

  const {isSidebarOpen} = useMainLayout();

  return (
    <>
      <DashboardHeader />
      <RevenueChart data={revenueData} isSidebarOpen={isSidebarOpen} />
      <InventoryTable data={inventoryData} />
      <TopSellingList data={topSellingData} />
    </>
  );
};

export default DashboardContent;
