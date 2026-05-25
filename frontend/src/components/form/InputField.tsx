import colors from '@utils/colors';
import { useFormikContext } from 'formik';
import { FC, ReactNode, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from 'react-native';

interface Props {
  name: string;
  label?: string;
  value?: string;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  secureTextEntry?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  rightIcon?: ReactNode;
  onRightIconPress?(): void;
}

const InputField: FC<Props> = ({
  label,
  keyboardType,
  autoCapitalize,
  secureTextEntry,
  containerStyle,
  name,
  rightIcon,
  onRightIconPress
}) => {
  const { handleChange, values, errors, submitCount } =
    useFormikContext<{
      [key: string]: string;
    }>();
  const errorMessage = submitCount > 0 ? errors[name] : '';
  const floatAnim = useRef(new Animated.Value(0)).current;
  const borderAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  const hasValue = values[name]?.length > 0;

  const handleFocus = () => {
    Animated.parallel([
      Animated.timing(floatAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(borderAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handleBlur = () => {
    if (!hasValue) {
      Animated.timing(floatAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
    Animated.timing(borderAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };



  const labelTop = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 7],
  });
  const labelSize = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [15, 11],
  });
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
        <View style={styles.inputRow}>
          <Animated.View
            style={[
              styles.container,
              { borderColor: errorMessage ? colors.ERROR : borderColor },
            ]}
          >
            <Animated.Text
              style={[
                styles.label,
                {
                  top: labelTop,
                  fontSize: labelSize,
                  color: errorMessage ? colors.ERROR : labelColor,
                },
              ]}
            >
              {label}
            </Animated.Text>
            <TextInput
              ref={inputRef}
              style={[styles.input, rightIcon ? styles.inputWithIcon : null]}
              placeholderTextColor="#B0BEC5"
              keyboardType={keyboardType}
              autoCapitalize={autoCapitalize}
              secureTextEntry={secureTextEntry}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onChangeText={handleChange(name)}
              value={values[name]}
            />
          </Animated.View>
          {rightIcon ? (
            <Pressable onPress={onRightIconPress} style={styles.rightIcons}>
              {rightIcon}
            </Pressable>
          ) : null}
        </View>
        {errorMessage ? (
          <Animated.Text style={styles.errorMessage}>
            {errorMessage}
          </Animated.Text>
        ) : null}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: 16,
  },
  inputRow: {
    position: 'relative',
  },
  container: {
    borderWidth: 1.5,
    borderRadius: 12,
    height: 60,
    paddingHorizontal: 16,
    justifyContent: 'flex-end',
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  label: {
    position: 'absolute',
    left: 16,
    fontWeight: '500',
    fontFamily: 'Inter',
    letterSpacing: 0.1,
  },
  input: {
    color: '#0D1B2A',
    fontSize: 15,
    fontFamily: 'Inter',
    padding: 0,
    margin: 0,
    height: 24,
  },
  inputWithIcon: {
    paddingRight: 40,
  },
  errorMessage: {
    color: colors.ERROR,
    fontSize: 12,
    fontFamily: 'Inter',
    marginTop: 4,
    marginLeft: 4,
  },
  rightIcons: {
    width: 50,
    height: 60,
    position: 'absolute',
    top: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default InputField;
