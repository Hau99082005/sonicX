import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { loginUser } from '../../api/auth';
import Toast from 'react-native-toast-message';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useGoogleSignIn } from '../../hooks/useGoogleSignIn';
import GoogleIcon from '../../ui/GoogleIcon';

const Login = () => {
  const { theme } = useTheme();
  const { updateAuth } = useAuth();
  const navigation = useNavigation<any>();
  const { signInWithGoogle, loading: googleLoading } = useGoogleSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password)
      return Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Vui lòng điền đầy đủ thông tin!',
      });
    setLoading(true);
    try {
      const { data } = await loginUser({ email, password });
      await updateAuth(data.token, data.profile);
      Toast.show({
        type: 'success',
        text1: 'Thành công',
        text2: 'Chào mừng bạn quay lại!',
      });
    } catch (error: any) {
      const msg = error?.response?.data?.error || 'Đăng nhập thất bại!';
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
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={[styles.logo, { backgroundColor: theme.primary }]}>
            <FontAwesome5
              name={'comment' as any}
              size={40}
              color="#fff"
              {...({ solid: true } as any)}
            />
          </View>
          <Text style={[styles.appName, { color: theme.text }]}>
            SonicX Chat
          </Text>
        </View>

        <View style={styles.form}>
          <View
            style={[styles.inputWrapper, { backgroundColor: theme.surface }]}
          >
            <FontAwesome5
              name="user"
              size={18}
              color={theme.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              placeholder="Email hoặc tên người dùng"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text }]}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />
          </View>

          <View
            style={[styles.inputWrapper, { backgroundColor: theme.surface }]}
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
              value={password}
              onChangeText={setPassword}
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

          <TouchableOpacity
            style={[styles.loginBtn, { backgroundColor: theme.primary, opacity: loading ? 0.7 : 1 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginBtnText}>Đăng nhập</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('LostPassword')}>
            <Text style={[styles.forgotPass, { color: theme.primary }]}>
              Quên mật khẩu?
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.socialBtn, { backgroundColor: theme.surface }]}
            onPress={signInWithGoogle}
            disabled={googleLoading}
          >
            <GoogleIcon />
            <Text style={[styles.socialText, { color: theme.text }]}>
              {googleLoading ? 'Đang kết nối...' : 'Tiếp tục với Google'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={{ color: theme.textSecondary, fontSize: 15 }}>
              Chưa có tài khoản?{' '}
            </Text>
            <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 15 }}>
              Đăng ký ngay
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 28, justifyContent: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: 50 },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#0084FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  appName: { fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  form: { marginBottom: 30 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingHorizontal: 16,
    height: 60,
    marginBottom: 16,
  },
  inputIcon: { marginRight: 14, width: 22, textAlign: 'center' },
  eyeIcon: { padding: 10, marginRight: -10 },
  input: { flex: 1, fontSize: 16, height: '100%', fontWeight: '500' },
  loginBtn: {
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#0084FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  loginBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  forgotPass: { textAlign: 'center', marginTop: 15, fontWeight: '700', fontSize: 15 },
  footer: { alignItems: 'center' },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 60,
    borderRadius: 18,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  socialText: { marginLeft: 12, fontSize: 16, fontWeight: '700' },
  registerLink: { flexDirection: 'row', alignItems: 'center' },
});

export default Login;
