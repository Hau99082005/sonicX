import InputField from '@components/InputField';
import AppleIcon from '@ui/AppleIcon';
import FacebookIcon from '@ui/FacebookIcon';
import GoogleIcon from '@ui/GoogleIcon';
import { Formik } from 'formik';
import { FC, useEffect, useRef } from 'react';
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
      /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#\$%\^&\*])[a-zA-Z\d!@#\$%\^&\*]+$/,
      'Mật khẩu không được quá ngắn!',
    )
    .required('Password is required!'),
  confirmPassword: yup
    .string()
    .trim('Vui lòng nhập vào mật khẩu của bạn')
    .min(8, 'Mật khẩu không được quá ngắn!')
    .matches(
      /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#\$%\^&\*])[a-zA-Z\d!@#\$%\^&\*]+$/,
      'Mật khẩu không được quá ngắn!',
    )
    .oneOf([yup.ref('password')], 'Mật khẩu xác nhận không khớp!')
    .required('Confirm password is required!'),
});

interface Props {}
const initialValues = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
};

const BLUE = '#1565C0';
const BLUE_LIGHT = '#1E88E5';

const hapticMedium = () => Vibration.vibrate(10);
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

const Register: FC<Props> = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

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
      <Formik
        onSubmit={values => {
          console.log(values);
        }}
        initialValues={initialValues}
        validationSchema={registerSchema}
      >
        {({ handleSubmit, handleChange, errors, values, submitCount }) => {
          return (
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

                  <Text style={styles.title}>Tạo tài khoản</Text>
                  <Text style={styles.subtitle}>
                    Tham gia và khám phá âm nhạc
                  </Text>

                  <View style={styles.form}>
                    <InputField
                      label="Họ tên"
                      onChange={handleChange('name')}
                      value={values.name}
                      errorMessage={submitCount > 0 ? errors.name : ''}
                    />
                    <InputField
                      label="Email"
                      keyboardType="email-address"
                      onChange={handleChange('email')}
                      value={values.email}
                      errorMessage={submitCount > 0 ? errors.email : ''}
                    />
                    <InputField
                      label="Mật khẩu"
                      autoCapitalize="none"
                      secureTextEntry
                      onChange={handleChange('password')}
                      value={values.password}
                      errorMessage={submitCount > 0 ? errors.password : ''}
                    />
                    <InputField
                      label="Xác nhận mật khẩu"
                      autoCapitalize="none"
                      secureTextEntry
                      onChange={handleChange('confirmPassword')}
                      value={values.confirmPassword}
                      errorMessage={
                        submitCount > 0 ? errors.confirmPassword : ''
                      }
                    />
                  </View>

                  <Pressable
                    onPressIn={() =>
                      Animated.spring(buttonScale, {
                        toValue: 0.97,
                        useNativeDriver: true,
                        speed: 50,
                        bounciness: 4,
                      }).start()
                    }
                    onPressOut={() =>
                      Animated.spring(buttonScale, {
                        toValue: 1,
                        useNativeDriver: true,
                        speed: 50,
                        bounciness: 4,
                      }).start()
                    }
                    onPress={() => {
                      hapticMedium();
                      handleSubmit();
                    }}
                  >
                    <Animated.View
                      style={[
                        styles.button,
                        { transform: [{ scale: buttonScale }] },
                      ]}
                    >
                      <Text style={styles.buttonText}>Đăng Ký</Text>
                    </Animated.View>
                  </Pressable>

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
                    <Text style={styles.footerText}>Đã có tài khoản? </Text>
                    <Pressable>
                      <Text style={styles.footerLink}>Đăng nhập</Text>
                    </Pressable>
                  </View>
                </Animated.View>
              </ScrollView>
            </KeyboardAvoidingView>
          );
        }}
      </Formik>
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
  button: {
    backgroundColor: BLUE,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter',
    fontStyle: 'normal',
    letterSpacing: 0.4,
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
});

export default Register;
