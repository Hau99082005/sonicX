import { FC, useRef, useState } from 'react';
import {
  Animated,
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from 'react-native';

interface Props {
  label?: string;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  secureTextEntry?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

const InputField: FC<Props> = ({
  label,
  keyboardType,
  autoCapitalize,
  secureTextEntry,
  containerStyle,
}) => {
  const [hasValue, setHasValue] = useState(false);
  const floatAnim = useRef(new Animated.Value(0)).current;
  const borderAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  const handleFocus = () => {
    Animated.parallel([
      Animated.timing(floatAnim, { toValue: 1, duration: 200, useNativeDriver: false }),
      Animated.timing(borderAnim, { toValue: 1, duration: 200, useNativeDriver: false }),
    ]).start();
  };

  const handleBlur = () => {
    if (!hasValue) {
      Animated.timing(floatAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
    }
    Animated.timing(borderAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  };

  const labelTop = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [18, 7] });
  const labelSize = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [15, 11] });
  const labelColor = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#9AAABB', '#1565C0'],
  });
  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#DDE3EA', '#1565C0'],
  });

  return (
    <TouchableWithoutFeedback onPress={() => inputRef.current?.focus()}>
      <View style={[styles.wrapper, containerStyle]}>
        <Animated.View style={[styles.container, { borderColor }]}>
          <Animated.Text style={[styles.label, { top: labelTop, fontSize: labelSize, color: labelColor }]}>
            {label}
          </Animated.Text>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholderTextColor="#B0BEC5"
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            secureTextEntry={secureTextEntry}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChangeText={text => setHasValue(text.length > 0)}
          />
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: 16,
  },
  container: {
    borderWidth: 1.5,
    borderRadius: 12,
    height: 60,
    paddingHorizontal: 16,
    justifyContent: 'flex-end',
    paddingBottom: 10,
    position: 'relative',
    backgroundColor: '#FFFFFF',
  },
  label: {
    position: 'absolute',
    left: 16,
    fontWeight: '500',
    fontFamily: "Inter",
    letterSpacing: 0.1,
  },
  input: {
    color: '#0D1B2A',
    fontSize: 15,
    fontFamily: "Inter",
    padding: 0,
    margin: 0,
    height: 24,
  },
});

export default InputField;
