import { useFormikContext } from 'formik';
import { FC, useEffect, useRef } from 'react';
import {
  Text,
  StyleSheet,
  View,
  Pressable,
  Animated,
  Vibration,
} from 'react-native';

interface Props {
  title: string;
}

const BLUE = '#1565C0';
const BLUE_LIGHT = '#1E88E5';
const hapticMedium = () => Vibration.vibrate(10);

const SubmitBtn: FC<Props> = props => {
  const buttonScale = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const { handleSubmit } = useFormikContext();

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
        style={[styles.button, { transform: [{ scale: buttonScale }] }]}
      >
        <Text style={styles.buttonText}>Đăng Ký</Text>
      </Animated.View>
    </Pressable>
  );
};
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 30 },
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
});

export default SubmitBtn;
