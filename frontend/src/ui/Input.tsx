import colors from '@utils/colors';
import { FC } from 'react';
import { StyleSheet, TextInput, TextInputProps } from 'react-native';

interface Props extends TextInputProps {}

const Input: FC<Props> = props => {
  return (
    <TextInput
      {...props}
      placeholderTextColor={colors.INACTIVE_CONTRAST}
      style={[styles.input, props.style]}
    />
  );
};
const styles = StyleSheet.create({
  input: {
    borderWidth: 2,
    borderColor: colors.SECONDARY,
    height: 40,
    borderRadius: 20,
    color: colors.CONTRAST,
    padding: 20,
  },
});

export default Input;
