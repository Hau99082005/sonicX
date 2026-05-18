import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import type { RouteProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome5 } from '@react-native-vector-icons/fontawesome5';
import Home from '../views/app/Home';
import Library from '../views/app/Library';
import Favorites from '../views/app/Favorites';
import Profile from '../views/app/Profile';
import MiniPlayer from '../components/MiniPlayer';
import { usePlayer } from '../context/PlayerContext';

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
          const color = isFocused ? C.active : C.inactive;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity key={route.key} style={styles.tabItem} onPress={onPress} activeOpacity={0.7}>
              <FontAwesome5
                name={TAB_ICONS[route.name] as any}
                iconStyle="solid"
                size={18}
                color={color}
              />
              <Text style={[styles.tabLabel, { color }]}>{TAB_LABELS[route.name]}</Text>
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
    <Tab.Screen name="Favorites" component={Favorites} />
    <Tab.Screen name="Profile" component={Profile} />
  </Tab.Navigator>
);

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: C.bg,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: C.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
    height: 64,
    paddingBottom: 10,
    paddingTop: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabLabel: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '400',
    marginTop: 2,
  },
});

export default BottomTabNavigator;
