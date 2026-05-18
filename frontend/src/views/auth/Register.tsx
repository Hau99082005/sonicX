import Form from '@components/form';
import InputField from '@components/form/InputField';
import SubmitBtn from '@components/form/SubmitBtn';
import GoogleIcon from '@ui/GoogleIcon';
import { useNavigation } from '@react-navigation/native';
import { registerUser } from '@api/auth';
import { FC, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as yup from 'yup';
import PasswordVisibilityIcon from '@ui/PasswordVisibilityIcon';
import Toast from 'react-native-toast-message';
import { useGoogleSignIn } from '../../hooks/useGoogleSignIn';

const registerSchema = yup.object({
  name: yup
    .string()
    .trim('Vui lòng nhập vào họ tên')
    .min(3, 'Invalid name!')
    .required('Name is required!'),
  email: yup
    .string()
    .trim('Vui lòng nhập vào email của bạn')
    .email('Invalid email!')
    .required('Email is required!'),
  password: yup
    .string()
    .trim('Vui lòng nhập vào mật khẩu của bạn')
    .min(8, 'Mật khẩu không được quá ngắn!')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      'Mật khẩu phải có ít nhất 8 ký tự, 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt (@$!%*?&)',
    )
    .required('Password is required!'),
});

interface Props {}
const initialValues = { name: '', email: '', password: '' };

const BLUE_LIGHT = '#1E88E5';

const GoogleButton: FC<{ onPress: () => void; loading: boolean }> = ({
  onPress,
  loading,
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: false,
        }),
        Animated.timing(glow, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const borderColor = glow.interpolate({
    inputRange: [0, 1],
    outputRange: ['#DDE3EA', '#EA433540'],
  });

  const shadowOpacity = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.06, 0.18],
  });

  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      onPressIn={() =>
        Animated.spring(scale, {
          toValue: 0.97,
          useNativeDriver: true,
          speed: 60,
          bounciness: 2,
        }).start()
      }
      onPressOut={() =>
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 60,
          bounciness: 4,
        }).start()
      }
    >
      <Animated.View
        style={[
          styles.googleBtn,
          {
            transform: [{ scale }],
            borderColor,
            shadowOpacity,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#EA4335" />
        ) : (
          <GoogleIcon size={22} />
        )}
        <Text style={styles.googleBtnText}>
          {loading ? 'Đang xử lý...' : 'Tiếp tục với Google'}
        </Text>
      </Animated.View>
    </Pressable>
  );
};

const Register: FC<Props> = () => {
  const navigation = useNavigation<any>();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const [secureEntry, setSecureEntry] = useState(true);
  const { signInWithGoogle, loading: googleLoading } = useGoogleSignIn();

  const tooglePassword = () => setSecureEntry(!secureEntry);

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
        onSubmit={async (values: {
          name: string;
          email: string;
          password: string;
        }) => {
          try {
            const { data } = await registerUser({
              name: values.name,
              email: values.email,
              password: values.password,
            });
            Toast.show({
              type: 'success',
              text1: 'Đăng ký thành công!',
              text2: 'Vui lòng kiểm tra email để lấy mã xác thực.',
              visibilityTime: 3000,
            });
            navigation.navigate('Verification', { userId: data.user.id });
          } catch (error: any) {
            const msg =
              error?.response?.data?.error ||
              error?.message ||
              'Đăng ký thất bại, vui lòng thử lại.';
            Toast.show({
              type: 'error',
              text1: 'Đăng ký thất bại',
              text2: msg,
              visibilityTime: 3000,
            });
          }
        }}
        initialValues={initialValues}
        validationSchema={registerSchema}
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
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
              ]}
            >
              <View style={styles.logoContainer}>
                <Image
                  source={require('../../../assets/icons/logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>

              <Text style={styles.title}>Tạo tài khoản</Text>
              <Text style={styles.subtitle}>Tham gia và khám phá âm nhạc</Text>

              <View style={styles.form}>
                <InputField name="name" label="Họ tên" />
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

              <SubmitBtn title="Đăng Ký" />

              <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>hoặc tiếp tục với</Text>
                <View style={styles.divider} />
              </View>

              <GoogleButton
                onPress={signInWithGoogle}
                loading={googleLoading}
              />

              <View style={styles.footer}>
                <Text style={styles.footerText}>Đã có tài khoản? </Text>
                <Pressable onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.footerLink}>Đăng nhập</Text>
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
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingVertical: 48 },
  inner: { paddingHorizontal: 28 },
  logoContainer: { alignItems: 'center', marginBottom: 28 },
  logo: { width: 100, height: 100, borderRadius: 20 },
  title: {
    fontSize: 26,
    fontWeight: '700',
    fontFamily: 'Inter',
    color: '#0D1B2A',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.1,
  },
  subtitle: {
    fontSize: 15,
    color: '#7A8A9A',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontStyle: 'italic',
    marginBottom: 32,
    letterSpacing: 0.2,
  },
  form: { marginBottom: 8 },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
  },
  divider: { flex: 1, height: 1, backgroundColor: '#DDE3EA' },
  dividerText: {
    color: '#9AAABB',
    fontSize: 13,
    fontFamily: 'Inter',
    fontStyle: 'italic',
    letterSpacing: 0.3,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    height: 54,
    borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
    shadowColor: '#EA4335',
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 10,
    elevation: 3,
  },
  googleBtnText: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '600',
    color: '#0D1B2A',
    letterSpacing: 0.2,
  },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  footerText: { color: '#7A8A9A', fontSize: 14, fontFamily: 'Inter' },
  footerLink: {
    color: BLUE_LIGHT,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
});

export default Register;
