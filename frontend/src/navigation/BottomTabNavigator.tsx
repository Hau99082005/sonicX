import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { RouteProp } from '@react-navigation/native';
import { FontAwesome5 } from '@react-native-vector-icons/fontawesome5';
import Home from '../views/app/Home';
import Library from '../views/app/Library';
import Favorites from '../views/app/Favorites';
import Profile from '../views/app/Profile';

type TabParamList = {
  Home: undefined;
  Library: undefined;
  Favorites: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

const COLORS = {
  primary: '#2563EB',
  background: '#0A0D14',
  surface: '#13172A',
  border: '#1E2235',
  text: '#F1F5F9',
  textSecondary: '#64748B',
};

const TAB_ICONS: Record<string, string> = {
  Home: 'home',
  Library: 'music',
  Favorites: 'heart',
  Profile: 'user',
};

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }: { route: RouteProp<TabParamList> }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          paddingBottom: 10,
          paddingTop: 10,
          height: 68,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter-Medium',
          fontSize: 11,
          marginTop: 2,
        },
        tabBarIcon: ({ color, size }: { focused: boolean; color: string; size: number }) => (
          <FontAwesome5
            name={TAB_ICONS[route.name] as any}
            iconStyle="solid"
            size={size - 2}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen name="Home" component={Home} options={{ tabBarLabel: 'Trang chủ' }} />
      <Tab.Screen name="Library" component={Library} options={{ tabBarLabel: 'Thư viện' }} />
      <Tab.Screen name="Favorites" component={Favorites} options={{ tabBarLabel: 'Yêu thích' }} />
      <Tab.Screen name="Profile" component={Profile} options={{ tabBarLabel: 'Hồ sơ' }} />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
