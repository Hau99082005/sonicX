import Login from '@views/auth/Login';
import Register from '@views/auth/Register';
import LostPassword from '@views/auth/LostPassword';
import Verification from '@views/auth/Verification';
import MusicPlayer from '@views/app/MusicPlayer';
import AdminDashboard from '@views/admin/AdminDashboard';
import AudioForm from '@views/admin/AudioForm';
import Settings from '@views/app/Settings';
import BottomTabNavigator from '@navigation/BottomTabNavigator';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { enableScreens } from 'react-native-screens';
import Toast from 'react-native-toast-message';
import { getToken } from '@utils/storage';
import { ActivityIndicator, View, StatusBar } from 'react-native';
import { PlayerProvider } from './src/context/PlayerContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { authManager } from './src/utils/auth';

// enableScreens();

const Stack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();

const COLORS = {
  background: '#000000',
  primary: '#7C3AED',
};

const AuthNavigator = () => {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.background } }}>
      <AuthStack.Screen name="Login" component={Login} />
      <AuthStack.Screen name="Register" component={Register} />
      <AuthStack.Screen name="LostPassword" component={LostPassword} />
      <AuthStack.Screen name="Verification" component={Verification} />
    </AuthStack.Navigator>
  );
};

const App = () => {
  // #region debug-point H1:app-init
  fetch("http://127.0.0.1:7777/event",{method:"POST",body:JSON.stringify({sessionId:"invalid-hook-call",runId:"pre",hypothesisId:"H1",location:"App.tsx:42",msg:"[DEBUG] App component init"})}).catch(()=>{});
  // #endregion
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);

  useEffect(() => {
    // #region debug-point H1:app-effect
    fetch("http://127.0.0.1:7777/event",{method:"POST",body:JSON.stringify({sessionId:"invalid-hook-call",runId:"pre",hypothesisId:"H1",location:"App.tsx:47",msg:"[DEBUG] App useEffect mount"})}).catch(()=>{});
    // #endregion
    const unsubscribe = authManager.subscribe((token) => {
      setUserToken(token);
    });
    bootstrapAsync();
    return () => unsubscribe();
  }, []);

  const bootstrapAsync = async () => {
    try {
      const token = await getToken();
      setUserToken(token);
    } catch (e) {
      console.error('App: Error restoring token:', e);
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
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <PlayerProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName={userToken ? 'MainApp' : 'Auth'}
            screenOptions={{ 
              headerShown: false, 
              contentStyle: { backgroundColor: COLORS.background } 
            }}
          >
            {userToken ? (
              <Stack.Group>
                <Stack.Screen name="MainApp" component={BottomTabNavigator} />
                <Stack.Screen name="MusicPlayer" component={MusicPlayer as any} options={{ animation: 'slide_from_bottom' }} />
                <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
                <Stack.Screen name="AudioForm" component={AudioForm} />
                <Stack.Screen name="Settings" component={Settings} />
              </Stack.Group>
            ) : (
              <Stack.Screen name="Auth" component={AuthNavigator} options={{ animation: 'none' }} />
            )}
          </Stack.Navigator>
          <Toast />
        </NavigationContainer>
      </PlayerProvider>
    </SafeAreaProvider>
  );
};

export default App;
