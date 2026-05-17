import React from 'react';
import { View, StyleSheet } from 'react-native';
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

const C = {
  bg: '#0C0C0C',
  border: '#1E1E1E',
  active: '#FFFFFF',
  inactive: '#555555',
};

const TAB_ICONS: Record<string, string> = {
  Home: 'home',
  Library: 'music',
  Favorites: 'heart',
  Profile: 'user',
};

const TAB_LABELS: Record<string, string> = {
  Home: 'Trang chủ',
  Library: 'Thư viện',
  Favorites: 'Yêu thích',
  Profile: 'Hồ sơ',
};

const BottomTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }: { route: RouteProp<TabParamList> }) => ({
      headerShown: false,
      tabBarActiveTintColor: C.active,
      tabBarInactiveTintColor: C.inactive,
      tabBarStyle: {
        backgroundColor: C.bg,
        borderTopColor: C.border,
        borderTopWidth: StyleSheet.hairlineWidth,
        height: 64,
        paddingBottom: 10,
        paddingTop: 10,
      },
      tabBarLabelStyle: {
        fontFamily: 'Inter-Regular',
        fontSize: 10,
        marginTop: 3,
      },
      tabBarIcon: ({ color, focused }: { focused: boolean; color: string; size: number }) => (
        <View style={focused ? styles.activeIndicator : undefined}>
          <FontAwesome5
            name={TAB_ICONS[route.name] as any}
            iconStyle="solid"
            size={18}
            color={color}
          />
        </View>
      ),
      tabBarLabel: TAB_LABELS[route.name],
    })}
  >
    <Tab.Screen name="Home" component={Home} />
    <Tab.Screen name="Library" component={Library} />
    <Tab.Screen name="Favorites" component={Favorites} />
    <Tab.Screen name="Profile" component={Profile} />
  </Tab.Navigator>
);

const styles = StyleSheet.create({
  activeIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default BottomTabNavigator;
