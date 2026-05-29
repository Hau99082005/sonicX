import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'auth-token';
const USER_KEY = 'auth-profile';

export const saveToken = async (token: string) => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error('Error saving token:', error);
  }
};

export const getToken = async () => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

export const removeToken = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error removing token:', error);
  }
};

export const saveProfile = async (profile: any) => {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error('Error saving profile:', error);
  }
};

export const getProfile = async () => {
  try {
    const profile = await AsyncStorage.getItem(USER_KEY);
    return profile ? JSON.parse(profile) : null;
  } catch (error) {
    console.error('Error getting profile:', error);
    return null;
  }
};

export const clearAuth = async () => {
  try {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  } catch (error) {
    console.error('Error clearing auth:', error);
  }
};
