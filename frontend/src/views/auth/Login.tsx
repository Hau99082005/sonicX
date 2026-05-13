import Form from '@components/form';
import InputField from '@components/form/InputField';
import AppleIcon from '@ui/AppleIcon';
import FacebookIcon from '@ui/FacebookIcon';
import GoogleIcon from '@ui/GoogleIcon';
import { FC, useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { loginUser } from '@api/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  Vibration,
  View,
} from 'react-native';
import * as yup from 'yup';
import PasswordVisibilityIcon from '@ui/PasswordVisibilityIcon';
import SignInBtn from '@components/form/SignInBtn';
import Toast from 'react-native-toast-message';

const loginSchema = yup.object({
  email: yup
    .string()
    .trim('Vui lòng nhập vào email của bạn')
    .email('Invalid email!')
    .required('Email is required!'),
  password: yup
    .string()
    .trim('Vui lòng nhập vào mật khẩu của bạn')
    .min(8, 'Mật khẩu không được quá ngắn!')
    .required('Password is required!'),
});

interface Props {}
const initialValues = {
  email: '',
  password: '',
};

const BLUE_LIGHT = '#1E88E5';

const hapticLight = () => Vibration.vibrate(5);

const SocialButton: FC<{ onPress: () => void; children: React.ReactNode }> = ({
  onPress,
  children,
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() =>
        Animated.spring(scale, {
          toValue: 0.93,
          useNativeDriver: true,
          speed: 50,
          bounciness: 4,
        }).start()
      }
      onPressOut={() =>
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 50,
          bounciness: 4,
        }).start()
      }
    >
      <Animated.View style={[styles.socialButton, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

const Login: FC<Props> = () => {
  const navigation = useNavigation<any>();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const [secureEntry, setSecureEntry] = useState(true);

  const tooglePassword = () => {
    setSecureEntry(!secureEntry);
  };
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Form
        onSubmit={async (values: {email: string; password: string}) => {
          try {
            const { data } = await loginUser({
              email: values.email,
              password: values.password,
            });
            await AsyncStorage.setItem('auth-token', data.token);
            await AsyncStorage.setItem('auth-profile', JSON.stringify(data.profile));
            Toast.show({
              type: 'success',
              text1: 'Đăng nhập thành công!',
              text2: `Chào mừng trở lại, ${data.profile.name}!`,
              visibilityTime: 3000,
            });
          } catch (error: any) {
            const serverMsg = error?.response?.data?.error;
            const networkMsg = error?.message;
            const msg = serverMsg || networkMsg || 'Đăng nhập thất bại, vui lòng thử lại.';
            Toast.show({
              type: 'error',
              text1: 'Đăng nhập thất bại',
              text2: msg,
              visibilityTime: 3000,
            });
          }
        }}
        initialValues={initialValues}
        validationSchema={loginSchema}
      >
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              style={[
                styles.inner,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <View style={styles.logoContainer}>
                <Image
                  source={require('../../../assets/icons/logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>

              <Text style={styles.title}>Đăng nhập</Text>
              <Text style={styles.subtitle}>
                Chào mừng trở lại với thế giới âm nhạc SonicX
              </Text>

              <View style={styles.form}>
                <InputField
                  label="Email"
                  name="email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <InputField
                  label="Mật khẩu"
                  autoCapitalize="none"
                  secureTextEntry={secureEntry}
                  name="password"
                  rightIcon={
                    <PasswordVisibilityIcon privateIcon={secureEntry} />
                  }
                  onRightIconPress={tooglePassword}
                />
              </View>
              <Pressable
                style={styles.forgotPassword}
                onPress={() => navigation.navigate('LostPassword')}
              >
                <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
              </Pressable>
              <SignInBtn title="Đăng nhập" />

              <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>hoặc tiếp tục với</Text>
                <View style={styles.divider} />
              </View>

              <View style={styles.socialRow}>
                <SocialButton onPress={hapticLight}>
                  <GoogleIcon size={22} />
                </SocialButton>
                <SocialButton onPress={hapticLight}>
                  <AppleIcon size={22} color="#111111" />
                </SocialButton>
                <SocialButton onPress={hapticLight}>
                  <FacebookIcon size={22} />
                </SocialButton>
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Chưa có tài khoản? </Text>
                <Pressable onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.footerLink}>Đăng Ký</Text>
                </Pressable>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Form>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 48,
  },
  inner: {
    paddingHorizontal: 28,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    fontFamily: 'Inter',
    fontStyle: 'normal',
    color: '#0D1B2A',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.1,
  },
  subtitle: {
    fontSize: 16,
    color: '#7A8A9A',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontStyle: 'italic',
    marginBottom: 32,
    letterSpacing: 0.2,
  },
  form: {
    marginBottom: 8,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#DDE3EA',
  },
  dividerText: {
    color: '#9AAABB',
    fontSize: 14,
    fontFamily: 'Inter',
    fontStyle: 'italic',
    letterSpacing: 0.3,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  socialButton: {
    width: 58,
    height: 58,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DDE3EA',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    color: '#7A8A9A',
    fontSize: 14,
  },
  footerLink: {
    color: BLUE_LIGHT,
    fontSize: 14,
    fontWeight: '600',
  },
  marginBottom: {
    marginBottom: 20,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 18,
  },
  forgotPasswordText: {
    color: BLUE_LIGHT,
    fontSize: 14,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
  },
});   

export default Login;
