import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useTheme } from '../context/ThemeContext';
import Chats from '@views/app/Chats';
import People from '@views/app/People';
import Discover from '@views/app/Discover';
import Profile from '../views/app/Profile';

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
          height: Platform.OS === 'ios' ? 95 : 85,
          paddingBottom: Platform.OS === 'ios' ? 35 : 20,
          paddingTop: 12,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName = 'comment';
          if (route.name === 'People') iconName = 'users';
          if (route.name === 'Discover') iconName = 'compass';
          if (route.name === 'Profile') iconName = 'user-circle';
          return (
            <FontAwesome5
              name={iconName as any}
              size={24}
              color={color}
              {...({ solid: true } as any)}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Chats" component={Chats} options={{ tabBarLabel: 'Đoạn chat' }} />
      <Tab.Screen name="People" component={People} options={{ tabBarLabel: 'Danh bạ' }} />
      <Tab.Screen name="Discover" component={Discover} options={{ tabBarLabel: 'Khám phá' }} />
      <Tab.Screen name="Profile" component={Profile} options={{ tabBarLabel: 'Cá nhân' }} />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
