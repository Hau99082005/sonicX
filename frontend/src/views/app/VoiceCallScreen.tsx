import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  StatusBar,
  Animated,
} from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { getAvatarUrl } from '../../utils/helper';

const VoiceCallScreen = ({ route, navigation }: any) => {
  const { otherMember, conversation } = route.params || {};
  const { socket } = useSocket();
  const { profile } = useAuth();

  const calleeName = otherMember?.name || otherMember?.username || 'Người dùng';
  const calleeAvatar = getAvatarUrl(otherMember?.avatar, calleeName);

  const [callStatus, setCallStatus] = useState<'calling' | 'connected' | 'ended'>('calling');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<any>(null);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    ).start();

    if (socket) {
      socket.emit('call-user', {
        to: otherMember?._id,
        from: profile?.id,
        conversationId: conversation?._id,
        type: 'voice',
      });

      socket.on('call-accepted', () => {
        setCallStatus('connected');
        timerRef.current = setInterval(() => setElapsed(prev => prev + 1), 1000);
      });

      socket.on('call-ended', () => {
        setCallStatus('ended');
        clearInterval(timerRef.current);
        setTimeout(() => navigation.goBack(), 1500);
      });

      socket.on('call-rejected', () => {
        setCallStatus('ended');
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

  const handleHangUp = () => {
    socket?.emit('end-call', {
      to: otherMember?._id,
      conversationId: conversation?._id,
    });
    clearInterval(timerRef.current);
    navigation.goBack();
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const statusText =
    callStatus === 'calling'
      ? 'Đang gọi...'
      : callStatus === 'connected'
      ? formatTime(elapsed)
      : 'Cuộc gọi kết thúc';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <View style={styles.blurBg}>
        <Image source={{ uri: calleeAvatar }} style={styles.bgImage} blurRadius={25} />
        <View style={styles.bgOverlay} />
      </View>

      <View style={styles.topBar}>
        <TouchableOpacity style={styles.topBtn}>
          <FontAwesome5 name={'comment' as any} size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.callerSection}>
        <Animated.View style={[styles.avatarRing, { transform: [{ scale: pulseAnim }] }]}>
          <Image source={{ uri: calleeAvatar }} style={styles.avatar} />
        </Animated.View>
        <Text style={styles.calleeName}>{calleeName}</Text>
        <Text style={styles.callStatus}>{statusText}</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.ctrlBtn, isSpeaker && styles.ctrlBtnActive]}
          onPress={() => setIsSpeaker(!isSpeaker)}
        >
          <FontAwesome5 name={'volume-up' as any} size={22} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.ctrlBtn, isMuted && styles.ctrlBtnActive]}
          onPress={() => setIsMuted(!isMuted)}
        >
          <FontAwesome5 name={isMuted ? ('microphone-slash' as any) : ('microphone' as any)} size={22} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.hangUpBtn} onPress={handleHangUp}>
          <FontAwesome5 name={'phone-slash' as any} size={26} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  blurBg: { ...StyleSheet.absoluteFill },
  bgImage: { width: '100%', height: '100%', position: 'absolute' },
  bgOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  topBar: {
    paddingTop: 56,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  topBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -40,
  },
  avatarRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
    marginBottom: 20,
    overflow: 'hidden',
  },
  avatar: { width: '100%', height: '100%' },
  calleeName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  callStatus: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.75)',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
    gap: 28,
  },
  ctrlBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctrlBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  hangUpBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default VoiceCallScreen;
