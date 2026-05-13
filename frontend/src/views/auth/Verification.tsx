import { FC, useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  Animated,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Vibration,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const BLUE_LIGHT = '#1E88E5';
const BLUE = '#1565C0';
const OTP_LENGTH = 6;

const hapticMedium = () => Vibration.vibrate(10);

interface Props {}

const Verification: FC<Props> = () => {
  const navigation = useNavigation<any>();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));

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

  const handleChange = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = () => {
    hapticMedium();
    const code = otp.join('');
    console.log('OTP:', code);
  };

  const handleResend = () => {
    setOtp(Array(OTP_LENGTH).fill(''));
    inputRefs.current[0]?.focus();
    console.log('Resend OTP');
  };

  return (
    <SafeAreaView style={styles.container}>
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
            <Text style={styles.title}>Xác minh email</Text>
            <Text style={styles.subtitle}>
              Vui lòng kiểm tra email của bạn và nhập mã OTP bên dưới.
            </Text>
            <View style={styles.otpRow}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={ref => {
                    inputRefs.current[index] = ref;
                  }}
                  style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                  value={digit}
                  onChangeText={text => handleChange(text, index)}
                  onKeyPress={({ nativeEvent }) =>
                    handleKeyPress(nativeEvent.key, index)
                  }
                  keyboardType="number-pad"
                  maxLength={1}
                  textAlign="center"
                  selectionColor={BLUE_LIGHT}
                />
              ))}
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
              onPress={handleSubmit}
            >
              <Animated.View
                style={[
                  styles.submitBtn,
                  { transform: [{ scale: buttonScale }] },
                ]}
              >
                <Text style={styles.submitBtnText}>Xác nhận</Text>
              </Animated.View>
            </Pressable>
            <View style={styles.actionsRow}>
              <Pressable
                style={styles.actionBtn}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.actionText}>Quay lại</Text>
              </Pressable>
              <Pressable style={styles.actionBtn} onPress={handleResend}>
                <Text style={styles.actionText}>Gửi lại OTP</Text>
              </Pressable>
            </View>{' '}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    marginBottom: 40,
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 36,
  },
  otpBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#DDE3EA',
    backgroundColor: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    color: '#0D1B2A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  otpBoxFilled: {
    borderColor: BLUE_LIGHT,
    backgroundColor: '#EEF5FD',
  },
  submitBtn: {
    width: '100%',
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
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter',
    letterSpacing: 0.4,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    color: BLUE_LIGHT,
    fontSize: 13,
    fontWeight: '600',
  },
});

export default Verification;
