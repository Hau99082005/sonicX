import colors from '@utils/colors';
import { FC } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';

const BLUE = '#1565C0';

interface Props {
  title?: string;
  onPress?(): void;
  onPressIn?(): void;
  onPressOut?(): void;
  buttonScale?: Animated.Value;
}

const AppButton: FC<Props> = ({ title, onPress, onPressIn, onPressOut, buttonScale }) => {
  const scaleStyle = buttonScale ? { transform: [{ scale: buttonScale }] } : {};

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[styles.container, scaleStyle]}>
        <Text style={styles.title}>{title}</Text>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
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
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter',
    letterSpacing: 0.4,
  },
});

export default AppButton;
