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
  Easing,
  Vibration,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import Svg, { Circle } from 'react-native-svg';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { Video } from 'react-native-video';
import { Camera, useCameraDevice, useCameraPermission, useMicrophonePermission } from 'react-native-vision-camera';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { getAvatarUrl } from '../../utils/helper';
import { sendMessage } from '../../api/chat';

const { width, height } = Dimensions.get('window');
const CALL_TIMEOUT = 30000;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const VideoCallScreen = ({ route, navigation }: any) => {
  const { otherMember, conversation, isIncoming } = route.params || {};
  const { socket } = useSocket();
  const { profile } = useAuth();
  const isFocused = useIsFocused();

  const calleeName = otherMember?.name || otherMember?.username || 'Người dùng';
  const calleeAvatar = getAvatarUrl(otherMember?.avatar, calleeName);
  const myAvatar = getAvatarUrl(profile?.avatar, profile?.name);

  const [callStatus, setCallStatus] = useState<'calling' | 'connected' | 'ended'>(
    isIncoming ? 'connected' : 'calling',
  );
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [cameraType, setCameraType] = useState<'front' | 'back'>('front');
  const [elapsed, setElapsed] = useState(0);
  const [playCallingSound, setPlayCallingSound] = useState(false);
  const [playEndSound, setPlayEndSound] = useState(false);

  const { hasPermission: hasCameraPermission, requestPermission: requestCameraPermission } = useCameraPermission();
  const { hasPermission: hasMicrophonePermission, requestPermission: requestMicrophonePermission } = useMicrophonePermission();
  const device = useCameraDevice(cameraType as any);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<any>(null);
  const statusRef = useRef<'calling' | 'connected' | 'ended'>(isIncoming ? 'connected' : 'calling');
  const [canPlaySound, setCanPlaySound] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setCanPlaySound(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkPermissions = async () => {
      const cameraStatus = await requestCameraPermission();
      const microStatus = await requestMicrophonePermission();
      if (cameraStatus && microStatus) {
        setIsReady(true);
      }
    };
    checkPermissions();
  }, []);

  useEffect(() => {
    statusRef.current = callStatus;
    if (callStatus === 'calling') {
      setPlayCallingSound(true);
    } else {
      setPlayCallingSound(false);
    }
  }, [callStatus]);

  useEffect(() => {
    console.log('VideoCallScreen mounted');
    Animated.loop(
      Animated.timing(rippleAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ).start();

    if (socket) {
      if (!isIncoming) {
        console.log('Emitting call-user video');
        socket.emit('call-user', {
          to: otherMember?._id,
          from: profile?.id,
          conversationId: conversation?._id,
          type: 'video',
        });
      }

      // Start timer immediately
      timerRef.current = setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);

      if (!isIncoming) {
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
      }

      socket.on('call-accepted', () => {
        setCallStatus('connected');
        progressAnim.stopAnimation();
        setElapsed(0);
      });

      socket.on('call-ended', () => {
        setCallStatus('ended');
        clearInterval(timerRef.current);
        setPlayEndSound(true);
        setTimeout(() => navigation.goBack(), 1500);
      });

      socket.on('call-rejected', () => {
        setCallStatus('ended');
        clearInterval(timerRef.current);
        setPlayEndSound(true);
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
    // Vibration.vibrate([0, 500, 200, 500]);
    setPlayEndSound(true);

    socket?.emit('end-call', {
      to: otherMember?._id,
      conversationId: conversation?._id,
    });

    try {
      const messageData = {
        conversationId: conversation?._id,
        message: 'Cuộc gọi video nhỡ',
        type: 'text',
        meta: { missed: true, callType: 'video' },
      };
      const newMsg = await sendMessage(messageData);

      // Phát qua socket để ChatWindow cập nhật ngay lập tức
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
    console.log('Handling hang up');
    setCanPlaySound(false);
    socket?.emit('end-call', {
      to: otherMember?._id,
      conversationId: conversation?._id,
    });
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeout(() => {
      navigation.goBack();
    }, 100);
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

  const [isCameraActive, setIsCameraActive] = useState(false);

  useEffect(() => {
    if (isReady && !isCameraOff && device != null && isFocused) {
      const timer = setTimeout(() => {
        setIsCameraActive(true);
      }, 500);
      return () => {
        clearTimeout(timer);
        setIsCameraActive(false);
      };
    } else {
      setIsCameraActive(false);
    }
  }, [isReady, isCameraOff, device, isFocused]);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Main Video/Background */}
      {isReady && device && !isCameraOff ? (
        <Camera
          style={StyleSheet.absoluteFill as any}
          device={device}
          isActive={isCameraActive}
          video={true}
          audio={true}
          onError={(error: any) => {
            console.error('Camera Error:', error);
            setIsCameraActive(false);
            if (error.code === 'session/camera-error') {
              setIsCameraOff(true);
            }
          }}
          {...({} as any)}
        />
      ) : (
        <View style={styles.remoteVideo}>
          <Image
            source={{ uri: calleeAvatar }}
            style={StyleSheet.absoluteFill}
            blurRadius={10}
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)' }]} />
        </View>
      )}
      <View style={styles.remoteOverlay} />

      <View style={styles.topBar}>
        <TouchableOpacity style={styles.topBtn}>
          <FontAwesome5 name={'comment' as any} size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.topBtn}
          onPress={() => setCameraType(prev => prev === 'front' ? 'back' : 'front')}
        >
          <FontAwesome5 name={'sync-alt' as any} size={20} color="#fff" />
        </TouchableOpacity>
      </View>

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

      <View style={styles.localVideoWrapper}>
        {callStatus === 'connected' ? (
          <View style={styles.remoteSmallView}>
            <Image source={{ uri: calleeAvatar }} style={styles.avatarSmall} />
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>
        ) : (
          <View style={[styles.localVideo, styles.localVideoOff]}>
            <Image
              source={{ uri: myAvatar }}
              style={[StyleSheet.absoluteFill, { borderRadius: 12 }]}
              blurRadius={5}
            />
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12 },
              ]}
            />
            <FontAwesome5 name={'user' as any} size={24} color="#fff" />
          </View>
        )}
      </View>

      <View style={styles.bottomBar}>
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.ctrlBtn, isMuted && styles.ctrlBtnActive]}
            onPress={() => setIsMuted(!isMuted)}
          >
            <FontAwesome5
              name={
                isMuted ? ('microphone-slash' as any) : ('microphone' as any)
              }
              size={20}
              color="#fff"
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.hangUpBtn} onPress={handleHangUp}>
            <FontAwesome5 name={'phone-alt' as any} size={22} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
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
  container: { flex: 1, backgroundColor: '#1c1c2e' },
  hiddenVideo: { width: 1, height: 1, position: 'absolute', opacity: 0, bottom: -100 },
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
    zIndex: 20,
  },
  topBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
  },
  avatarContainer: {
    width: 260,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 25,
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
  localVideoWrapper: {
    position: 'absolute',
    top: 120,
    right: 20,
    width: 100,
    height: 150,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    zIndex: 30,
    backgroundColor: '#000',
  },
  localVideo: {
    width: '100%',
    height: '100%',
  },
  localVideoOff: {
    backgroundColor: '#2a2a3e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  remoteSmallView: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSmall: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  liveIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ff3b30',
    marginRight: 4,
  },
  liveText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 80,
    paddingTop: 20,
    backgroundColor: 'transparent',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
  },
  ctrlBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctrlBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  hangUpBtn: {
    width: 68,
    height: 64,
    borderRadius: 34,
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

export default VideoCallScreen;
