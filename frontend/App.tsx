import Login from '@views/auth/Login';
import Register from '@views/auth/Register';
import LostPassword from '@views/auth/LostPassword';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { enableScreens } from 'react-native-screens';

enableScreens();

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Register" component={Register} />
        <Stack.Screen name="LostPassword" component={LostPassword} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
