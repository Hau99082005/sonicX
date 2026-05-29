import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { registerUser } from '../../api/auth';
import Toast from 'react-native-toast-message';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useAuth } from '../../context/AuthContext';
import { Formik } from 'formik';
import * as yup from 'yup';

const registerSchema = yup.object().shape({
  name: yup.string().required('Họ và tên là bắt buộc'),
  username: yup
    .string()
    .min(3, 'Tên người dùng phải ít nhất 3 ký tự')
    .required('Tên người dùng là bắt buộc'),
  email: yup.string().email('Email không hợp lệ').required('Email là bắt buộc'),
  password: yup
    .string()
    .min(6, 'Mật khẩu phải ít nhất 6 ký tự')
    .required('Mật khẩu là bắt buộc'),
});

const Register = () => {
  const { theme } = useTheme();
  const { updateAuth } = useAuth();
  const navigation = useNavigation<any>();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (values: any) => {
    setLoading(true);
    try {
      const { data } = await registerUser(values);
      await updateAuth(data.token, data.user);
      Toast.show({ type: 'success', text1: 'Thành công', text2: 'Chào mừng bạn đến với SonicX!' });
    } catch (error: any) {
      const msg = error?.response?.data?.error || 'Đăng ký thất bại!';
      Toast.show({ type: 'error', text1: 'Lỗi', text2: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <FontAwesome5 name="arrow-left" size={22} color={theme.primary} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Tạo tài khoản</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Tham gia cùng cộng đồng SonicX ngay hôm nay!
          </Text>
        </View>

        <Formik
          initialValues={{ name: '', username: '', email: '', password: '' }}
          validationSchema={registerSchema}
          onSubmit={handleRegister}
        >
          {({
            handleChange,
            handleBlur,
            handleSubmit,
            values,
            errors,
            touched,
          }) => (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: theme.surface,
                      borderColor: touched.name && errors.name ? '#FF4D4F' : 'transparent',
                      borderWidth: 1,
                    },
                  ]}
                >
                  <FontAwesome5
                    name="user"
                    size={18}
                    color={theme.textSecondary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="Họ và tên"
                    placeholderTextColor={theme.textSecondary}
                    style={[styles.input, { color: theme.text }]}
                    value={values.name}
                    onChangeText={handleChange('name')}
                    onBlur={handleBlur('name')}
                  />
                </View>
                {touched.name && errors.name && (
                  <Text style={styles.errorText}>{errors.name}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: theme.surface,
                      borderColor: touched.username && errors.username ? '#FF4D4F' : 'transparent',
                      borderWidth: 1,
                    },
                  ]}
                >
                  <FontAwesome5
                    name="at"
                    size={18}
                    color={theme.textSecondary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="Tên người dùng"
                    placeholderTextColor={theme.textSecondary}
                    style={[styles.input, { color: theme.text }]}
                    value={values.username}
                    onChangeText={handleChange('username')}
                    onBlur={handleBlur('username')}
                    autoCapitalize="none"
                  />
                </View>
                {touched.username && errors.username && (
                  <Text style={styles.errorText}>{errors.username}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: theme.surface,
                      borderColor: touched.email && errors.email ? '#FF4D4F' : 'transparent',
                      borderWidth: 1,
                    },
                  ]}
                >
                  <FontAwesome5
                    name="envelope"
                    size={18}
                    color={theme.textSecondary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="Email"
                    placeholderTextColor={theme.textSecondary}
                    style={[styles.input, { color: theme.text }]}
                    value={values.email}
                    onChangeText={handleChange('email')}
                    onBlur={handleBlur('email')}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
                {touched.email && errors.email && (
                  <Text style={styles.errorText}>{errors.email}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: theme.surface,
                      borderColor: touched.password && errors.password ? '#FF4D4F' : 'transparent',
                      borderWidth: 1,
                    },
                  ]}
                >
                  <FontAwesome5
                    name="lock"
                    size={18}
                    color={theme.textSecondary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="Mật khẩu"
                    placeholderTextColor={theme.textSecondary}
                    style={[styles.input, { color: theme.text }]}
                    value={values.password}
                    onChangeText={handleChange('password')}
                    onBlur={handleBlur('password')}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <FontAwesome5
                      name={showPassword ? "eye" : "eye-slash"}
                      size={18}
                      color={theme.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
                {touched.password && errors.password && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.registerBtn,
                  { backgroundColor: theme.primary, opacity: loading ? 0.7 : 1 },
                ]}
                onPress={() => handleSubmit()}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.registerBtnText}>Đăng ký</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </Formik>

        <View style={styles.footer}>
          <Text style={{ color: theme.textSecondary, fontSize: 15 }}>Đã có tài khoản? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 15 }}>
              Đăng nhập
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 28, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 40 },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -10,
    marginBottom: 20,
  },
  header: { marginBottom: 35 },
  title: { fontSize: 34, fontWeight: '800', marginBottom: 10, letterSpacing: -1 },
  subtitle: { fontSize: 17, lineHeight: 26, opacity: 0.7 },
  form: { marginBottom: 25 },
  inputGroup: { marginBottom: 18 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingHorizontal: 16,
    height: 60,
  },
  inputIcon: { marginRight: 14, width: 22, textAlign: 'center' },
  eyeIcon: { padding: 10, marginRight: -10 },
  input: { flex: 1, fontSize: 16, height: '100%', fontWeight: '500' },
  errorText: { color: '#FF4D4F', fontSize: 13, marginTop: 6, marginLeft: 16, fontWeight: '500' },
  registerBtn: {
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    shadowColor: '#0084FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  registerBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 15 },
});

export default Register;
