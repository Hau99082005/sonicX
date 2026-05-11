import AppButton from '@ui/AppButton';
import { useFormikContext } from 'formik';
import { FC, useRef } from 'react';
import { Animated, Vibration } from 'react-native';

interface Props {
  title: string;
}

const hapticMedium = () => Vibration.vibrate(10);

const SubmitBtn: FC<Props> = () => {
  const buttonScale = useRef(new Animated.Value(1)).current;
  const { handleSubmit } = useFormikContext();

  return (
    <AppButton
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
      title="Đăng Ký"
      buttonScale={buttonScale}
    />
  );
};
export default SubmitBtn;
