import React from 'react';
import {
  HomeScreen,
  InitializationScreen,
  SetupDatabaseScreen,
  UserProfileScreen,
  DatabaseScreen,
  LoginScreen,
  MainScreen,
} from '../screens';
import {AppGuard, PermissionGuard, PermissionGuardProps} from '../guards';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

// Screen configurations with their requirements
const screenConfigs: Record<string, PermissionGuardProps> = {
  Home: {
    component: HomeScreen,
    requireSetup: false,
    requireAuth: false,
    requireDatabase: false,
  },
  Initialization: {
    component: InitializationScreen,
    requireSetup: false,
    requireAuth: false,
    requireDatabase: false,
  },
  SetupDatabase: {
    component: SetupDatabaseScreen,
    requireSetup: false,
    requireAuth: false,
    requireDatabase: false,
  },
  UserProfile: {
    component: UserProfileScreen,
    requireSetup: false,
    requireAuth: false,
    requireDatabase: false,
  },
  Login: {
    component: LoginScreen,
    requireSetup: true,
    requireAuth: false,
    requireDatabase: true,
  },
  Main: {
    component: MainScreen,
    requireSetup: true,
    requireAuth: true,
    requireDatabase: true,
    requiredRoles: ['employee', 'manager', 'owner'],
  },
  Database: {
    component: DatabaseScreen,
    requireSetup: false,
    requireAuth: false,
    requireDatabase: false,
    requiredRoles: ['manager', 'owner', 'admin_store', 'admin_enterprise'],
  },
};

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{headerShown: false}}
      />
      {/*  <Stack.Screen
        name="Home"
        component={(props: any) => <HomeScreen />}
        options={{title: 'Home', headerShown: false}}
      /> */}
      <Stack.Screen
        name="Initialization"
        component={InitializationScreen}
        options={{headerShown: false}}
      />
      {/* <Stack.Screen
        name="Initialization"
        component={(props: any) => <InitializationScreen />}
        options={{title: 'Initialization', headerShown: false}}
        /> */}
      <Stack.Screen
        name="SetupDatabase"
        component={SetupDatabaseScreen}
        options={{headerShown: false}}
      />

      {/*  <Stack.Screen
        name="SetupDatabase"
        component={(props: any) => <SetupDatabaseScreen />}
        options={{title: 'SetupDatabase', headerShown: false}}
      /> */}

      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{headerShown: false}}
      />
      {/*  <Stack.Screen
        name="UserProfile"
        component={(props: any) => <UserProfileScreen />}
        options={{title: 'UserProfile', headerShown: false}}
        /> */}

      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{headerShown: false}}
      />
      {/* <Stack.Screen
        name="Login"
        component={(props: any) => <LoginScreen />}
        options={{title: 'Login', headerShown: false}}
        /> */}

      <Stack.Screen
        name="Database"
        component={DatabaseScreen}
        options={{headerShown: false}}
      />
      {/* <Stack.Screen
        name="Database"
        component={(props: any) => <DatabaseScreen />}
        options={{title: 'Database', headerShown: false}}
      /> */}
      <Stack.Screen
        name="Main"
        component={MainScreen}
        options={{headerShown: false, gestureEnabled: false}} // Tắt gesture để tránh pop
      />
      {/* <Stack.Screen
        name="Main"
        component={(props: any) => <MainScreen />}
        options={{title: 'Main', headerShown: false}}
      /> */}
      {/* {Object.entries(screenConfigs).map(([name, config]) => (
          <Stack.Screen
            key={name}
            name={name}
            component={() => (
              <AppGuard
                requireSetup={config.requireSetup}
                requireAuth={config.requireAuth}
                requireDatabase={config.requireDatabase}>
                <PermissionGuard
                  requiredRoles={config.requiredRoles}
                  allowEmpty={!config.requiredRoles}
                  component={config.component}></PermissionGuard>
              </AppGuard>
            )}
            options={{title: `${name}`, headerShown: false}}
          />
        ))} */}
    </Stack.Navigator>
  );
};

export default AppNavigator;
