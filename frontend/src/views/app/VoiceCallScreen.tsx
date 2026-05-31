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
import Svg, { Circle } from 'react-native-svg';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Video from 'react-native-video';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { getAvatarUrl } from '../../utils/helper';
import { sendMessage } from '../../api/chat';

const CALL_TIMEOUT = 30000;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const VoiceCallScreen = ({ route, navigation }: any) => {
  const { otherMember, conversation } = route.params || {};
  const { socket } = useSocket();
  const { profile } = useAuth();

  const calleeName = otherMember?.name || otherMember?.username || 'Người dùng';
  const calleeAvatar = getAvatarUrl(otherMember?.avatar, calleeName);

  const [callStatus, setCallStatus] = useState<'calling' | 'connected' | 'ended'>(
    'calling',
  );
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [playCallingSound, setPlayCallingSound] = useState(false);
  const [playEndSound, setPlayEndSound] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<any>(null);
  const statusRef = useRef<'calling' | 'connected' | 'ended'>('calling');

  useEffect(() => {
    statusRef.current = callStatus;
    if (callStatus === 'calling') {
      setPlayCallingSound(true);
    } else {
      setPlayCallingSound(false);
    }
  }, [callStatus]);

  useEffect(() => {
    Animated.loop(
      Animated.timing(rippleAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ).start();

    if (socket) {
      socket.emit('call-user', {
        to: otherMember?._id,
        from: profile?.id,
        conversationId: conversation?._id,
        type: 'voice',
      });

      timerRef.current = setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);

      Animated.timing(progressAnim, {
        toValue: 1,
        duration: CALL_TIMEOUT,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && statusRef.current === 'calling') {
          handleMissedCall();
        }
      });

      socket.on('call-accepted', () => {
        setCallStatus('connected');
        progressAnim.stopAnimation();
        setElapsed(0);
      });

      socket.on('call-ended', () => {
        setCallStatus('ended');
        clearInterval(timerRef.current);
        setTimeout(() => navigation.goBack(), 1500);
      });

      socket.on('call-rejected', () => {
        setCallStatus('ended');
        clearInterval(timerRef.current);
        setTimeout(() => navigation.goBack(), 1500);
      });
    }

    return () => {
      clearInterval(timerRef.current);
      socket?.off('call-accepted');
      socket?.off('call-ended');
      socket?.off('call-rejected');
    };
  }, [socket]);

  const handleMissedCall = async () => {
    setCallStatus('ended');
    Vibration.vibrate([0, 500, 200, 500]);
    setPlayEndSound(true);

    socket?.emit('end-call', {
      to: otherMember?._id,
      conversationId: conversation?._id,
    });

    try {
      const messageData = {
        conversationId: conversation?._id,
        message: 'Cuộc gọi thoại nhỡ',
        type: 'text',
        meta: { missed: true, callType: 'voice' },
      };
      const newMsg = await sendMessage(messageData);
      
      socket?.emit('send-message', {
        conversationId: conversation?._id,
        message: newMsg,
      });
    } catch (error) {
      console.log('Error sending missed call message:', error);
    }

    setTimeout(() => navigation.goBack(), 1000);
  };

  const handleHangUp = () => {
    socket?.emit('end-call', {
      to: otherMember?._id,
      conversationId: conversation?._id,
    });
    clearInterval(timerRef.current);
    navigation.goBack();
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
      .toString()
      .padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const statusText =
    callStatus === 'ended' ? 'Cuộc gọi kết thúc' : formatTime(elapsed);

  const radius = 65;
  const stroke = 4;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

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
          <Animated.View
            style={[
              styles.ripple,
              {
                transform: [{ scale: rippleAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2] }) }],
                opacity: rippleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0] }),
              },
            ]}
          />
          <View style={styles.concentricRing3} />
          <View style={styles.concentricRing2} />
          <View style={styles.concentricRing1} />
          
          {callStatus === 'calling' && (
            <Svg
              height={radius * 2}
              width={radius * 2}
              style={styles.progressCircle}
            >
              <Circle
                stroke="rgba(255,255,255,0.1)"
                fill="transparent"
                strokeWidth={stroke}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
              <AnimatedCircle
                stroke="#fff"
                fill="transparent"
                strokeWidth={stroke}
                strokeDasharray={circumference + ' ' + circumference}
                strokeDashoffset={strokeDashoffset as any}
                strokeLinecap="round"
                r={normalizedRadius}
                cx={radius}
                cy={radius}
                transform={`rotate(-90 ${radius} ${radius})`}
              />
            </Svg>
          )}
          <View style={styles.avatarRing}>
            <Image source={{ uri: calleeAvatar }} style={styles.avatar} />
          </View>
        </View>
        <Text style={styles.calleeName}>{calleeName}</Text>
        <Text style={styles.callStatus}>{statusText}</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.addBtn}>
          <FontAwesome5 name={'plus' as any} size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.ctrlBtn, isMuted && styles.ctrlBtnActive]}
          onPress={() => setIsMuted(!isMuted)}
        >
          <FontAwesome5
            name={isMuted ? ('microphone-slash' as any) : ('microphone' as any)}
            size={20}
            color="#fff"
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.ctrlBtn}>
          <FontAwesome5 name={'video' as any} size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.hangUpBtn} onPress={handleHangUp}>
          <FontAwesome5 name={'phone-alt' as any} size={22} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
        </TouchableOpacity>
      </View>

      {/* Âm thanh cuộc gọi */}
      {playCallingSound && (
        <Video
          source={{ uri: 'calling_sound' }}
          paused={false}
          repeat={true}
          audioOnly={true}
          playInBackground={true}
          playWhenInactive={true}
          {...({} as any)}
        />
      )}
      {playEndSound && (
        <Video
          source={{ uri: 'call_end' }}
          paused={false}
          repeat={false}
          audioOnly={true}
          onEnd={() => setPlayEndSound(false)}
          {...({} as any)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1c1c2e' },
  callerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  avatarContainer: {
    width: 260,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 60,
  },
  ripple: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  concentricRing1: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  concentricRing2: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  concentricRing3: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255,255,255,0.01)',
  },
  progressCircle: {
    position: 'absolute',
    top: 65,
    left: 65,
    zIndex: 10,
  },
  avatarRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    overflow: 'hidden',
    zIndex: 5,
  },
  avatar: { width: '100%', height: '100%' },
  calleeName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  callStatus: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.5)',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
    gap: 24,
  },
  addBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#2ecc71',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2ecc71',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  ctrlBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctrlBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  hangUpBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e74c3c',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#e74c3c',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
});

export default VoiceCallScreen;
