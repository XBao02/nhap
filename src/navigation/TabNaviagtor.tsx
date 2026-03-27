import Icon from '@react-native-vector-icons/material-icons';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

import {HomeScreen, SettingsScreen} from '../screens';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({color, size}) => {
          let iconName = route.name === 'Home' ? 'home' : 'cog';
          return <Icon name={iconName as any} size={size} color={color} />;
        },
      })}>
      <Tab.Screen
        name="Home"
        component={(props: any) => (
          <HomeScreen/>
        )}
        options={{headerShown: false}}
      />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};


export default TabNavigator;