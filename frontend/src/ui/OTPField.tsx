import colors from '@utils/colors';
import { FC } from 'react';
import { Text, StyleSheet, View, TextInput } from 'react-native';

interface Props {}

const OTPField: FC<Props> = props => {
  return <TextInput style={styles.input} />;
};
const styles = StyleSheet.create({
  input: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderColor: colors.SECONDARY,
    borderWidth: 2,
  },
});

export default OTPField;
