import { useState, useRef } from 'react';
import { Animated, Dimensions } from 'react-native';
import { isTablet } from '../../utils';

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  status: 'sufficient' | 'low';
}

interface TopSellingItem {
  id: string;
  name: string;
  sold: number;
  revenue: number;
}

const useDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(isTablet);
  const contentMargin = useRef(new Animated.Value(isTablet ? 250 : 0)).current;
  const screenWidth = Dimensions.get('window').width;

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const newValue = !prev;
      if (isTablet) {
        Animated.timing(contentMargin, {
          toValue: newValue ? 250 : 0,
          duration: 400,
          useNativeDriver: false,
        }).start();
      }
      return newValue;
    });
  };

  // Dữ liệu demo
  const revenueData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{ data: [1200, 1500, 1800, 1400, 1600, 2000, 2200] }],
  };

  const inventoryData: InventoryItem[] = [
    { id: '1', name: 'Coffee Beans', quantity: 50, status: 'sufficient' },
    { id: '2', name: 'Milk', quantity: 20, status: 'low' },
    { id: '3', name: 'Sugar', quantity: 100, status: 'sufficient' },
    { id: '4', name: 'Cups', quantity: 30, status: 'low' },
    { id: '5', name: 'Syrup', quantity: 80, status: 'sufficient' },
  ];

  const topSellingData: TopSellingItem[] = [
    { id: '1', name: 'Espresso', sold: 150, revenue: 450000 },
    { id: '2', name: 'Latte', sold: 120, revenue: 360000 },
    { id: '3', name: 'Cappuccino', sold: 100, revenue: 300000 },
    { id: '4', name: 'Americano', sold: 80, revenue: 240000 },
    { id: '5', name: 'Mocha', sold: 70, revenue: 210000 },
  ];

  return {
    isSidebarOpen,
    toggleSidebar,
    contentMargin,
    revenueData,
    inventoryData,
    topSellingData,
    screenWidth,
  };
};

export default useDashboard;