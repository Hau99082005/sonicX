import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  StatusBar,
  Animated,
  Easing,
  Vibration,
} from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { Video } from 'react-native-video';
import { useSocket } from '../../context/SocketContext';
import { getAvatarUrl } from '../../utils/helper';

const IncomingCallScreen = ({ route, navigation }: any) => {
  const { caller, conversationId, type } = route.params || {};
  const { socket } = useSocket();

  const callerName = caller?.name || caller?.username || 'Người dùng';
  const callerAvatar = getAvatarUrl(caller?.avatar, callerName);

  const rippleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rippleAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ).start();

    // Tạm thời tắt rung để kiểm tra crash
    // Vibration.vibrate([500, 1000, 500, 1000], true);

    const handleCallEnded = () => {
      // Vibration.cancel();
      navigation.goBack();
    };

    socket?.on('call-ended', handleCallEnded);

    return () => {
      Vibration.cancel();
      socket?.off('call-ended', handleCallEnded);
    };
  }, [socket]);

  const handleAccept = () => {
    Vibration.cancel();
    socket?.emit('accept-call', { to: caller?._id, conversationId });
    setTimeout(() => {
      navigation.replace(type === 'video' ? 'VideoCall' : 'VoiceCall', {
        otherMember: caller,
        conversation: { _id: conversationId },
        isIncoming: true,
      });
    }, 100);
  };

  const handleReject = () => {
    Vibration.cancel();
    socket?.emit('reject-call', { to: caller?._id, conversationId });
    setTimeout(() => {
      navigation.goBack();
    }, 100);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <View style={styles.callerSection}>
        <View style={styles.avatarContainer}>
          <Animated.View
            style={[
              styles.ripple,
              {
                transform: [{ scale: rippleAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.5] }) }],
                opacity: rippleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] }),
              },
            ]}
          />
          <View style={styles.avatarRing}>
            <Image source={{ uri: callerAvatar }} style={styles.avatar} />
          </View>
        </View>
        <Text style={styles.callerName}>{callerName}</Text>
        <Text style={styles.callStatus}>Cuộc gọi {type === 'video' ? 'video' : 'thoại'} đến...</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={[styles.btn, styles.rejectBtn]} onPress={handleReject}>
          <FontAwesome5 name="phone-slash" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.acceptBtn]} onPress={handleAccept}>
          <FontAwesome5 name="phone" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1c1c2e', justifyContent: 'center' },
  hiddenVideo: { width: 1, height: 1, position: 'absolute', opacity: 0, bottom: -100 },
  callerSection: { alignItems: 'center', marginBottom: 100 },
  avatarContainer: { width: 150, height: 150, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  ripple: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.2)' },
  avatarRing: { width: 100, height: 100, borderRadius: 50, overflow: 'hidden', borderWidth: 2, borderColor: '#fff' },
  avatar: { width: '100%', height: '100%' },
  callerName: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  callStatus: { fontSize: 18, color: 'rgba(255,255,255,0.6)' },
  controls: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 50 },
  btn: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center' },
  rejectBtn: { backgroundColor: '#ff3b30' },
  acceptBtn: { backgroundColor: '#4cd964' },
});

export default IncomingCallScreen;
