import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { getAvatarUrl } from '../../utils/helper';

const { width, height } = Dimensions.get('window');

const VideoCallScreen = ({ route, navigation }: any) => {
  const { otherMember, conversation } = route.params || {};
  const { socket } = useSocket();
  const { profile } = useAuth();

  const calleeName = otherMember?.name || otherMember?.username || 'Người dùng';
  const calleeAvatar = getAvatarUrl(otherMember?.avatar, calleeName);
  const myAvatar = getAvatarUrl(profile?.avatar, profile?.name);

  const [callStatus, setCallStatus] = useState<'calling' | 'connected' | 'ended'>('calling');
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<any>(null);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    ).start();

    if (socket) {
      socket.emit('call-user', {
        to: otherMember?._id,
        from: profile?.id,
        conversationId: conversation?._id,
        type: 'video',
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
      ? 'Đang kết nối...'
      : callStatus === 'connected'
      ? formatTime(elapsed)
      : 'Cuộc gọi kết thúc';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <Image source={{ uri: calleeAvatar }} style={styles.remoteVideo} blurRadius={callStatus !== 'connected' ? 20 : 0} />
      <View style={styles.remoteOverlay} />

      <View style={styles.topBar}>
        <TouchableOpacity style={styles.topBtn}>
          <FontAwesome5 name={'comment' as any} size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.topBtn}>
          <FontAwesome5 name={'camera-rotate' as any} size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {callStatus !== 'connected' && (
        <View style={styles.callerSection}>
          <Animated.View style={[styles.avatarRing, { transform: [{ scale: pulseAnim }] }]}>
            <Image source={{ uri: calleeAvatar }} style={styles.avatar} />
          </Animated.View>
          <Text style={styles.calleeName}>{calleeName}</Text>
          <Text style={styles.callStatus}>{statusText}</Text>
        </View>
      )}

      {callStatus === 'connected' && (
        <View style={styles.connectedInfo}>
          <Text style={styles.connectedName}>{calleeName}</Text>
          <Text style={styles.connectedTimer}>{statusText}</Text>
        </View>
      )}

      <View style={styles.localVideoWrapper}>
        {isCameraOff ? (
          <View style={[styles.localVideo, styles.localVideoOff]}>
            <FontAwesome5 name={'video-slash' as any} size={20} color="#fff" />
          </View>
        ) : (
          <Image source={{ uri: myAvatar }} style={styles.localVideo} />
        )}
      </View>

      <View style={styles.bottomBar}>
        <View style={styles.controls}>
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

          <TouchableOpacity style={styles.hangUpBtn} onPress={handleHangUp}>
            <FontAwesome5 name={'phone-slash' as any} size={26} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.ctrlBtn, isCameraOff && styles.ctrlBtnActive]}
            onPress={() => setIsCameraOff(!isCameraOff)}
          >
            <FontAwesome5
              name={isCameraOff ? ('video-slash' as any) : ('video' as any)}
              size={20}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  remoteVideo: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  remoteOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  topBar: {
    paddingTop: 56,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    marginTop: -60,
  },
  avatarRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
    marginBottom: 16,
    overflow: 'hidden',
  },
  avatar: { width: '100%', height: '100%' },
  calleeName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
  callStatus: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
  },
  connectedInfo: {
    position: 'absolute',
    top: 110,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  connectedName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  connectedTimer: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  localVideoWrapper: {
    position: 'absolute',
    top: 110,
    right: 20,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  localVideo: {
    width: 100,
    height: 140,
    borderRadius: 12,
  },
  localVideoOff: {
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 50,
    paddingTop: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
  },
  ctrlBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctrlBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  hangUpBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default VideoCallScreen;
