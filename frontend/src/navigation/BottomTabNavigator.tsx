import React from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import Chats from '@views/app/Chats';
import People from '@views/app/People';
import Discover from '@views/app/Discover';
import Profile from '../views/app/Profile';

const Tab = createBottomTabNavigator();

const BadgeIcon = ({ name, color, size, count }: { name: string; color: string; size: number; count: number }) => (
  <View style={{ width: size + 10, height: size + 10, alignItems: 'center', justifyContent: 'center' }}>
    <FontAwesome5 name={name as any} size={size} color={color} {...({ solid: true } as any)} />
    {count > 0 && (
      <View style={[badgeStyles.badge, { backgroundColor: '#FF4D4F' }]}>
        <Text style={badgeStyles.badgeText}>{count > 99 ? '99+' : String(count)}</Text>
      </View>
    )}
  </View>
);

const badgeStyles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
});

const BottomTabNavigator = () => {
  const { theme } = useTheme();
  const { unreadCount } = useNotifications();

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
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600', marginTop: 4 },
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Chats') {
            return <BadgeIcon name="comment" color={color} size={24} count={unreadCount} />;
          }
          let iconName = 'users';
          if (route.name === 'Discover') iconName = 'compass';
          if (route.name === 'Profile') iconName = 'user-circle';
          return <FontAwesome5 name={iconName as any} size={24} color={color} {...({ solid: true } as any)} />;
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
