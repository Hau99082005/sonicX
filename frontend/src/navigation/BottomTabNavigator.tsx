import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import type { RouteProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome5 } from '@react-native-vector-icons/fontawesome5';
import Home from '../views/app/Home';
import Library from '../views/app/Library';
import Videos from '../views/app/Videos';
import Favorites from '../views/app/Favorites';
import Profile from '../views/app/Profile';
import MiniPlayer from '../components/MiniPlayer';
import { usePlayer } from '../context/PlayerContext';

type TabParamList = {
  Home: undefined;
  Library: undefined;
  Videos: undefined;
  Favorites: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

const C = {
  bg: '#0D0F1E',
  surface: '#161829',
  border: '#1E2140',
  active: '#FFFFFF',
  inactive: '#4A4F6A',
  accent: '#6C63FF',
  accentGlow: 'rgba(108,99,255,0.35)',
};

const TAB_CONFIG: Record<string, { icon: string; label: string }> = {
  Home: { icon: 'home', label: 'Trang chủ' },
  Library: { icon: 'music', label: 'Thư viện' },
  Videos: { icon: 'play-circle', label: 'Video' },
  Favorites: { icon: 'heart', label: 'Yêu thích' },
  Profile: { icon: 'user', label: 'Hồ sơ' },
};

const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const { currentAudio } = usePlayer();
  const nav = useNavigation<any>();

  return (
    <View style={styles.wrapper}>
      {currentAudio && (
        <MiniPlayer onPress={() => nav.navigate('MusicPlayer', { audio: currentAudio })} />
      )}
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const isCenter = route.name === 'Videos';
          const cfg = TAB_CONFIG[route.name];

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          if (isCenter) {
            return (
              <View key={route.key} style={styles.centerTabWrap}>
                <TouchableOpacity
                  style={[styles.centerBtn, isFocused && styles.centerBtnActive]}
                  onPress={onPress}
                  activeOpacity={0.85}
                >
                  <FontAwesome5
                    name="play-circle"
                    iconStyle="solid"
                    size={26}
                    color="#fff"
                  />
                </TouchableOpacity>
                <Text style={[styles.centerLabel, isFocused && { color: C.accent }]}>
                  {cfg.label}
                </Text>
              </View>
            );
          }

          const color = isFocused ? C.active : C.inactive;

          return (
            <TouchableOpacity
              key={route.key}
              style={styles.tabItem}
              onPress={onPress}
              activeOpacity={0.7}
            >
              <View style={styles.tabIconWrap}>
                {isFocused && <View style={styles.activeIndicator} />}
                <FontAwesome5
                  name={cfg.icon as any}
                  iconStyle="solid"
                  size={18}
                  color={color}
                />
              </View>
              <Text style={[styles.tabLabel, { color }]}>{cfg.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const BottomTabNavigator = () => (
  <Tab.Navigator
    tabBar={props => <CustomTabBar {...props} />}
    screenOptions={({ route }: { route: RouteProp<TabParamList> }) => ({
      headerShown: false,
    })}
  >
    <Tab.Screen name="Home" component={Home} />
    <Tab.Screen name="Library" component={Library} />
    <Tab.Screen name="Videos" component={Videos} />
    <Tab.Screen name="Favorites" component={Favorites} />
    <Tab.Screen name="Profile" component={Profile} />
  </Tab.Navigator>
);

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: C.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: C.bg,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 8,
  },
  tabIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 28,
    marginTop: 8,
  },
  activeIndicator: {
    position: 'absolute',
    top: -10,
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: C.accent,
  },
  tabLabel: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  centerTabWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 6,
  },
  centerBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 10,
  },
  centerBtnActive: {
    backgroundColor: '#7C75FF',
    shadowOpacity: 0.7,
  },
  centerLabel: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '500',
    color: C.inactive,
    letterSpacing: 0.2,
  },
});

export default BottomTabNavigator;
