import Login from './src/views/auth/Login';
import Register from './src/views/auth/Register';
import LostPassword from './src/views/auth/LostPassword';
import Verification from './src/views/auth/Verification';
import Settings from './src/views/app/Settings';
import EditProfile from './src/views/app/EditProfile';
import ChatWindow from './src/views/app/ChatWindow';
import BottomTabNavigator from './src/navigation/BottomTabNavigator';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import Toast from 'react-native-toast-message';
import { ActivityIndicator, View, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { SocketProvider } from './src/context/SocketContext';

const Stack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();

const AppContent = () => {
  const { token, isLoading } = useAuth();
  const { theme } = useTheme();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle={theme.text === '#FFFFFF' ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
      <Stack.Navigator
        initialRouteName={token ? 'MainApp' : 'Auth'}
        screenOptions={{ 
          headerShown: false, 
          contentStyle: { backgroundColor: theme.background } 
        }}
      >
        {token ? (
          <Stack.Group>
            <Stack.Screen name="MainApp" component={BottomTabNavigator} />
            <Stack.Screen name="ChatWindow" component={ChatWindow} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="Settings" component={Settings} />
            <Stack.Screen name="EditProfile" component={EditProfile} />
          </Stack.Group>
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const AuthNavigator = () => {
  const { theme } = useTheme();
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }}>
      <AuthStack.Screen name="Login" component={Login} />
      <AuthStack.Screen name="Register" component={Register} />
      <AuthStack.Screen name="LostPassword" component={LostPassword} />
      <AuthStack.Screen name="Verification" component={Verification} />
    </AuthStack.Navigator>
  );
};

const App = () => {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <AppContent />
          </SocketProvider>
          <Toast />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

export default App;
