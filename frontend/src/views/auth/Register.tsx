import Input from '@ui/Input';
import colors from '@utils/colors';
import { FC } from 'react';
import { StyleSheet, View, Text, TextInput, SafeAreaView } from 'react-native';

interface Props {}

const Register: FC<Props> = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.label}>Họ tên</Text>
        <Input
          placeholder="Vui lòng nhập vào tên của bạn"
          style={{borderColor: 'yellow'}}
        />
        <Text style={styles.label}>Email của bạn</Text>
        <TextInput
          placeholder="vui lòng nhập vào email của bạn"
          placeholderTextColor={colors.INACTIVE_CONTRAST}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Text style={styles.label}>Mật khẩu</Text>
        <TextInput
          placeholder="Vui lòng nhập vào mật khẩu của bạn"
          placeholderTextColor={colors.INACTIVE_CONTRAST}
          style={styles.input}
          autoCapitalize="none"
          secureTextEntry
        />
        <Text style={styles.label}>Xác nhận mật khẩu</Text>
        <TextInput
          placeholder="Vui lòng xác nhận mật khẩu của bạn"
          placeholderTextColor={colors.INACTIVE_CONTRAST}
          style={styles.input}
          autoCapitalize="none"
          secureTextEntry
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.BLUE,
  },
  text: {
    fontSize: 30,
    color: '#ffffff',
  },
  input: {
    borderWidth: 2,
    borderColor: colors.SECONDARY,
    height: 40,
    borderRadius: 20,
    color: colors.CONTRAST,
    padding: 20,
  },
  label: {
    color: colors.CONTRAST,
  },
  formContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
});

export default Register;
