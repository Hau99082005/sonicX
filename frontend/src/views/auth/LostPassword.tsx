import Form from '@components/form';
import InputField from '@components/form/InputField';
import SendEmailBtn from '@components/form/SendEmailBtn';
import { FC, useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
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
  View,
} from 'react-native';
import * as yup from 'yup';

const BLUE_LIGHT = '#1E88E5';

const lostPasswordSchema = yup.object({
  email: yup
    .string()
    .trim('Vui lòng nhập vào email của bạn')
    .email('Invalid email!')
    .required('Email is required!'),
});

const initialValues = { email: '' };

interface Props {}

const LostPassword: FC<Props> = () => {
  const navigation = useNavigation<any>();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Form
        onSubmit={values => {
          console.log(values);
        }}
        initialValues={initialValues}
        validationSchema={lostPasswordSchema}
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

              <Text style={styles.title}>Quên mật khẩu</Text>
              <Text style={styles.subtitle}>
                Nhập email của bạn để nhận hướng dẫn đặt lại mật khẩu.
              </Text>

              <View style={styles.form}>
                <InputField
                  label="Email"
                  name="email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <SendEmailBtn title="Gửi email" />

              <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
                <Text style={styles.backBtnText}>Quay lại đăng nhập</Text>
              </Pressable>
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
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  form: {
    marginBottom: 24,
  },
  backBtn: {
    alignSelf: 'center',
    marginTop: 16,
  },
  backBtnText: {
    color: BLUE_LIGHT,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LostPassword;
