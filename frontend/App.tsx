import Login from './src/views/auth/Login';
import Register from './src/views/auth/Register';
import LostPassword from './src/views/auth/LostPassword';
import Verification from './src/views/auth/Verification';
import Settings from './src/views/app/Settings';
import EditProfile from './src/views/app/EditProfile';
import ChatWindow from './src/views/app/ChatWindow';
import ConversationInfo from './src/views/app/ConversationInfo';
import CreateGroup from './src/views/app/CreateGroup';
import VoiceCallScreen from './src/views/app/VoiceCallScreen';
import VideoCallScreen from './src/views/app/VideoCallScreen';
import IncomingCallScreen from './src/views/app/IncomingCallScreen';
import BottomTabNavigator from './src/navigation/BottomTabNavigator';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useState, useRef } from 'react';
import Toast from 'react-native-toast-message';
import { ActivityIndicator, View, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { SocketProvider, useSocket } from './src/context/SocketContext';
import { navigationRef } from './src/navigation/navigationRef';
import { Video } from 'react-native-video';

const Stack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();

const GlobalCallSound = () => {
  const { socket } = useSocket();
  const [soundSource, setSoundSource] = useState<any>(null);
  const [isLoop, setIsLoop] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (socket && isReady) {
      const handleIncomingCall = () => {
        try {
          setSoundSource(require('./assets/sounds/Nhac-chuong-cuoc-goi-Facebook-Messenger-www_nhacchuongvui_com.mp3') as any);
          setIsLoop(true);
        } catch (err) {
          console.log('Error loading incoming sound:', err);
        }
      };

      const handleOutgoingCall = () => {
        try {
          setSoundSource(require('./assets/sounds/Nhac-chuong-cuoc-goi-Facebook-Messenger-www_nhacchuongvui_com.mp3') as any);
          setIsLoop(true);
        } catch (err) {
          console.log('Error loading outgoing sound:', err);
        }
      };

      const stopSound = () => {
        setSoundSource(null);
      };

      const handleEndCall = () => {
        try {
          setSoundSource(require('./assets/sounds/Nhac-chuong-iPhone-remix-TikTok-www_nhacchuongvui_com.mp3') as any);
          setIsLoop(false);
          setTimeout(() => setSoundSource(null), 3000);
        } catch (err) {
          console.log('Error loading end sound:', err);
          setSoundSource(null);
        }
      };

      socket.on('incoming-call', handleIncomingCall);
      socket.on('out-going-call', handleOutgoingCall); // Sự kiện tự động phát âm thanh khi gọi đi
      socket.on('call-accepted', stopSound);
      socket.on('call-rejected', stopSound);
      socket.on('call-ended', handleEndCall);

      return () => {
        socket.off('incoming-call', handleIncomingCall);
        socket.off('out-going-call', handleOutgoingCall);
        socket.off('call-accepted', stopSound);
        socket.off('call-rejected', stopSound);
        socket.off('call-ended', handleEndCall);
      };
    }
  }, [socket]);

  if (!soundSource) return null;

  return (
    <View 
      pointerEvents="none"
      style={{ 
        position: 'absolute', 
        width: 1, 
        height: 1, 
        overflow: 'hidden', 
        opacity: 0,
        zIndex: -1 
      }}
    >
      <Video
        source={soundSource}
        repeat={isLoop}
        paused={false}
        volume={1.0}
        muted={false}
        playInBackground={false}
        ignoreSilentSwitch="ignore"
        {...({
          audioOnly: true,
          useTextureView: false, // Sử dụng SurfaceView để ổn định hơn trên Emulator
          disableFocus: false,
          shutterColor: 'transparent',
        } as any)}
        style={{ width: '100%', height: '100%' }}
        onError={(e: any) => console.log('Global Sound Error:', e)}
      />
    </View>
  );
};

const AppContent = () => {
  const { token, isLoading } = useAuth();
  const { theme } = useTheme();
  const { socket } = useSocket();

  useEffect(() => {
    if (socket) {
      socket.on('incoming-call', (data: { from: any; conversationId: string; type: 'voice' | 'video' }) => {
        navigationRef.navigate('IncomingCall', {
          caller: data.from,
          conversationId: data.conversationId,
          type: data.type,
        });
      });

      return () => {
        socket.off('incoming-call');
      };
    }
  }, [socket]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.background,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar
        barStyle={theme.text === '#FFFFFF' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />
      <Stack.Navigator
        initialRouteName={token ? 'MainApp' : 'Auth'}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
        }}
      >
        {token ? (
          <Stack.Group>
            <Stack.Screen name="MainApp" component={BottomTabNavigator} />
            <Stack.Screen
              name="ChatWindow"
              component={ChatWindow}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="ConversationInfo"
              component={ConversationInfo}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="CreateGroup"
              component={CreateGroup}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen name="Settings" component={Settings} />
            <Stack.Screen name="EditProfile" component={EditProfile} />
            <Stack.Screen
              name="VoiceCall"
              component={VoiceCallScreen}
              options={{ animation: 'fade', gestureEnabled: false }}
            />
            <Stack.Screen
              name="VideoCall"
              component={VideoCallScreen}
              options={{ animation: 'fade', gestureEnabled: false }}
            />
            <Stack.Screen
              name="IncomingCall"
              component={IncomingCallScreen}
              options={{ animation: 'fade', gestureEnabled: false }}
            />
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
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
      }}
    >
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
            <GlobalCallSound />
            <AppContent />
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
      <Toast />
    </SafeAreaProvider>
  );
};

export default App;
