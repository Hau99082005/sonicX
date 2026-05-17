import Login from '@views/auth/Login';
import Register from '@views/auth/Register';
import LostPassword from '@views/auth/LostPassword';
import Verification from '@views/auth/Verification';
import MusicPlayer from '@views/app/MusicPlayer';
import BottomTabNavigator from '@navigation/BottomTabNavigator';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { enableScreens } from 'react-native-screens';
import Toast from 'react-native-toast-message';
import { getToken } from '@utils/storage';
import { ActivityIndicator, View } from 'react-native';

enableScreens();

const Stack = createNativeStackNavigator();

const COLORS = {
  background: '#0A0D14',
  primary: '#2563EB',
};

export let appLogout: () => void = () => {};
export let appLogin: (token: string) => void = () => {};

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);

  useEffect(() => {
    appLogout = () => setUserToken(null);
    appLogin = (token: string) => setUserToken(token);
    bootstrapAsync();
  }, []);

  const bootstrapAsync = async () => {
    try {
      const token = await getToken();
      setUserToken(token);
    } catch (e) {
      console.error('Error restoring token:', e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={userToken ? 'MainApp' : 'Auth'}
        screenOptions={{ headerShown: false }}
      >
        {userToken ? (
          <>
            <Stack.Screen name="MainApp" component={BottomTabNavigator} />
            <Stack.Screen name="MusicPlayer" component={MusicPlayer as any} options={{ animation: 'slide_from_bottom' }} />
          </>
        ) : (
          <Stack.Group screenOptions={{ animation: 'none' }}>
            <Stack.Screen name="Auth" component={AuthNavigator} />
          </Stack.Group>
        )}
      </Stack.Navigator>
      <Toast />
    </NavigationContainer>
  );
};

const AuthNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Register" component={Register} />
      <Stack.Screen name="LostPassword" component={LostPassword} />
      <Stack.Screen name="Verification" component={Verification} />
    </Stack.Navigator>
  );
};

export default App;
