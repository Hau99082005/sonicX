import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { FontAwesome5 } from '@react-native-vector-icons/fontawesome5';
import LinearGradient from 'react-native-linear-gradient';
import { BlurView } from '@react-native-community/blur';
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
  bg: 'rgba(8, 9, 18, 0.85)',
  surface: '#121421',
  border: 'rgba(255, 255, 255, 0.08)',
  active: '#FFFFFF',
  inactive: '#64748B',
  accent: '#7C3AED',
  accentGradient: ['#7C3AED', '#DB2777'],
};

const TAB_CONFIG: Record<string, { icon: string; label: string }> = {
  Home: { icon: 'home', label: 'Trang chủ' },
  Library: { icon: 'layer-group', label: 'Thư viện' },
  Videos: { icon: 'play', label: 'Video' },
  Favorites: { icon: 'heart', label: 'Yêu thích' },
  Profile: { icon: 'user', label: 'Hồ sơ' },
};

const CustomTabBar = ({ state, navigation }: BottomTabBarProps) => {
  const { currentAudio } = usePlayer();

  return (
    <View style={styles.container}>
      {currentAudio && (
        <View style={styles.playerWrap}>
          <MiniPlayer onPress={() => navigation.navigate('MusicPlayer', { audio: currentAudio })} />
        </View>
      )}
      
      <View style={styles.tabBarWrapper}>
        <View style={styles.blurContainer}>
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="dark"
            blurAmount={25}
            overlayColor="transparent"
          />
        </View>
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
                <View key={route.key} style={styles.centerTab}>
                  <TouchableOpacity
                    onPress={onPress}
                    activeOpacity={0.9}
                    style={styles.centerBtnWrapper}
                  >
                    <LinearGradient
                      colors={C.accentGradient}
                      style={styles.centerBtn}
                    >
                      <FontAwesome5
                        name="play"
                        iconStyle="solid"
                        size={22}
                        color="#fff"
                      />
                    </LinearGradient>
                  </TouchableOpacity>
                  <Text style={[styles.label, isFocused && styles.activeLabel, styles.centerLabel]}>
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
                <FontAwesome5
                  name={cfg.icon as any}
                  iconStyle="solid"
                  size={22}
                  color={color}
                />
                <Text style={[styles.label, isFocused && styles.activeLabel, { color }]}>
                  {cfg.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Library" component={Library} />
      <Tab.Screen name="Videos" component={Videos} />
      <Tab.Screen name="Favorites" component={Favorites} />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  playerWrap: {
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  tabBarWrapper: {
    marginHorizontal: 16,
    marginBottom: Platform.OS === 'ios' ? 40 : 28,
    height: 84,
    backgroundColor: 'transparent',
  },
  blurContainer: {
    ...StyleSheet.absoluteFill,
    borderRadius: 42,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
  },
  tabBar: {
    flexDirection: 'row',
    height: '100%',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: '100%',
  },
  centerTab: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBtnWrapper: {
    marginTop: -40,
    zIndex: 10,
  },
  centerBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 12,
    borderWidth: 5,
    borderColor: '#080912',
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: C.inactive,
  },
  centerLabel: {
    marginTop: 8,
  },
  activeLabel: {
    color: C.active,
  },
});

export default BottomTabNavigator;
