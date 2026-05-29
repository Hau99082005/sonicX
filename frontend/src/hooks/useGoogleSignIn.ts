import { useState } from 'react';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { googleSignInApi } from '@api/auth';
import Toast from 'react-native-toast-message';
import Config from 'react-native-config';
import { useAuth } from '../context/AuthContext';

const GOOGLE_WEB_CLIENT_ID = Config.GOOGLE_WEB_CLIENT_ID || '739589186628-rpv9rta58toreqlv3mls1jpms763668b.apps.googleusercontent.com';

try {
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    offlineAccess: true,
    forceCodeForRefreshToken: true,
  });
} catch (error) {
  console.error('GoogleSignin configure error:', error);
}

export const useGoogleSignIn = () => {
  const [loading, setLoading] = useState(false);
  const { updateAuth } = useAuth();

  const signInWithGoogle = async () => {
    try {
      setLoading(true);

      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();
      const idToken = tokens.idToken;

      if (!idToken) {
        Toast.show({
          type: 'error',
          text1: 'Lỗi',
          text2: 'Không lấy được token từ Google',
        });
        return;
      }

      const { data } = await googleSignInApi(idToken);

      await updateAuth(data.token, data.profile);

      if (data.message) {
        Toast.show({
          type: 'info',
          text1: 'Tài khoản mới',
          text2: data.message,
          visibilityTime: 4000,
        });
      } else {
        Toast.show({
          type: 'success',
          text1: 'Đăng nhập thành công!',
          text2: `Chào mừng, ${data.profile.name}!`,
          visibilityTime: 2000,
        });
      }
    } catch (error: any) {
      const code = String(error?.code ?? '');

      if (code === String(statusCodes.SIGN_IN_CANCELLED)) return;

      if (code === String(statusCodes.IN_PROGRESS)) {
        Toast.show({
          type: 'info',
          text1: 'Đang xử lý',
          text2: 'Vui lòng chờ...',
        });
        return;
      }

      if (code === String(statusCodes.PLAY_SERVICES_NOT_AVAILABLE)) {
        Toast.show({
          type: 'error',
          text1: 'Lỗi',
          text2: 'Google Play Services không khả dụng',
        });
        return;
      }

      if (code === '10') {
        Toast.show({
          type: 'error',
          text1: 'Lỗi cấu hình Google (10)',
          text2: 'SHA-1 hoặc Client ID chưa đúng. Kiểm tra Firebase Console.',
          visibilityTime: 5000,
        });
        return;
      }

      const serverMsg = error?.response?.data?.error;
      const msg = serverMsg || error?.message || 'Đăng nhập Google thất bại';
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: msg,
        visibilityTime: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  return { signInWithGoogle, loading };
};
