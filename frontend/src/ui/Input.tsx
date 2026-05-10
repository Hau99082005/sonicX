import { FC } from 'react';
import { StyleSheet, TextInput, TextInputProps } from 'react-native';

interface Props extends TextInputProps {}

const Input: FC<Props> = props => {
  return (
    <TextInput
      {...props}
      placeholderTextColor="rgba(255,255,255,0.3)"
      style={[styles.input, props.style]}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    color: '#FFFFFF',
    paddingHorizontal: 16,
    fontSize: 15,
  },
});

export default Input;
