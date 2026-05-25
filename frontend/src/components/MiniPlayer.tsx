import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { FontAwesome5 } from '@react-native-vector-icons/fontawesome5';
import { BlurView } from '@react-native-community/blur';
import { usePlayer } from '../context/PlayerContext';

const C = {
  bg: 'rgba(18, 20, 33, 0.8)',
  surface: '#121421',
  card: '#1A1D2E',
  border: 'rgba(255, 255, 255, 0.1)',
  text: '#FFFFFF',
  sub: '#94A3B8',
  accent: '#7C3AED',
  danger: '#EF4444',
  green: '#22C55E',
};

const fmtSleep = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
};

const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];
const SLEEP_OPTIONS = [5, 15, 30, 60];

interface Props {
  onPress: () => void;
}

const MiniPlayer: React.FC<Props> = ({ onPress }) => {
  const {
    currentAudio,
    isPlaying,
    isLoading,
    position,
    duration,
    togglePlay,
    rate,
    setRate,
    sleepMinutes,
    sleepRemaining,
    setSleepTimer,
  } = usePlayer();

  const rotation = useRef(new Animated.Value(0)).current;
  const rotationDeg = useRef(0);
  const rotationAnim = useRef<Animated.CompositeAnimation | null>(null);
  const slideAnim = useRef(new Animated.Value(100)).current;

  const [showSpeed, setShowSpeed] = useState(false);
  const [showSleep, setShowSleep] = useState(false);

  useEffect(() => {
    if (currentAudio) {
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 14 }).start();
    }
  }, [currentAudio, slideAnim]);

  useEffect(() => {
    if (isPlaying && !isLoading) {
      const remaining = 360 - (rotationDeg.current % 360);
      rotationAnim.current = Animated.loop(
        Animated.sequence([
          Animated.timing(rotation, { toValue: rotationDeg.current + remaining, duration: (remaining / 360) * 10000, useNativeDriver: true }),
          Animated.timing(rotation, { toValue: rotationDeg.current + remaining + 360, duration: 10000, useNativeDriver: true }),
        ]),
      );
      rotationAnim.current.start();
    } else {
      rotationAnim.current?.stop();
      rotation.stopAnimation(val => { rotationDeg.current = val; });
    }
    return () => { rotationAnim.current?.stop(); };
  }, [isPlaying, isLoading, rotation]);

  const spin = rotation.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'], extrapolate: 'extend' });

  if (!currentAudio) return null;

  const poster = typeof currentAudio.poster === 'string' ? currentAudio.poster : (currentAudio.poster as any)?.url ?? currentAudio.image ?? '';
  const pct = duration > 0 ? Math.min(position / duration, 1) : 0;

  return (
    <>
      <Animated.View style={[styles.wrapper, { transform: [{ translateY: slideAnim }] }]}>
        <BlurView style={StyleSheet.absoluteFill} blurType="dark" blurAmount={25} overlayColor="transparent" />
        <Pressable style={styles.card} onPress={onPress}>
          <Animated.View style={[styles.artWrap, { transform: [{ rotate: spin }] }]}>
            <Image source={{ uri: poster }} style={styles.art} />
          </Animated.View>

          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={1}>{currentAudio.title}</Text>
            <Text style={styles.artist} numberOfLines={1}>{currentAudio.about || 'SonicX'}</Text>
          </View>

          <View style={styles.actions}>
            <Pressable 
              style={[styles.actionBtn, sleepRemaining !== null && styles.activeAction]} 
              onPress={e => { e.stopPropagation(); setShowSleep(true); }}
            >
              <FontAwesome5 name="moon" size={12} color={sleepRemaining !== null ? C.accent : C.sub} />
              {sleepRemaining !== null && <Text style={styles.activeText}>{fmtSleep(sleepRemaining)}</Text>}
            </Pressable>

            <Pressable 
              style={[styles.actionBtn, rate !== 1 && styles.activeAction]} 
              onPress={e => { e.stopPropagation(); setShowSpeed(true); }}
            >
              <Text style={[styles.rateText, rate !== 1 && { color: C.accent }]}>{rate}x</Text>
            </Pressable>

            <TouchableOpacity style={styles.playBtn} onPress={e => { e.stopPropagation(); togglePlay(); }}>
              {isLoading ? (
                <ActivityIndicator size={18} color="#fff" />
              ) : (
                <FontAwesome5 name={isPlaying ? 'pause' : 'play'} iconStyle="solid" size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
        <View style={styles.progressContainer}>
          <View style={[styles.progressFill, { width: `${pct * 100}%` as any }]} />
        </View>
      </Animated.View>

      <Modal transparent visible={showSpeed} animationType="fade">
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowSpeed(false)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Tốc độ phát</Text>
            <View style={styles.grid}>
              {RATES.map(r => (
                <Pressable key={r} style={[styles.chip, rate === r && styles.activeChip]} onPress={() => { setRate(r); setShowSpeed(false); }}>
                  <Text style={[styles.chipText, rate === r && styles.activeChipText]}>{r}x</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal transparent visible={showSleep} animationType="fade">
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowSleep(false)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Hẹn giờ tắt</Text>
            <View style={styles.grid}>
              {SLEEP_OPTIONS.map(m => (
                <Pressable key={m} style={[styles.chip, sleepMinutes === m && styles.activeChip]} onPress={() => { setSleepTimer(m); setShowSleep(false); }}>
                  <Text style={[styles.chipText, sleepMinutes === m && styles.activeChipText]}>{m} phút</Text>
                </Pressable>
              ))}
            </View>
            {sleepRemaining !== null && (
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setSleepTimer(null); setShowSleep(false); }}>
                <Text style={styles.cancelText}>Hủy hẹn giờ</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    height: 72,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  artWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    padding: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  art: {
    flex: 1,
    borderRadius: 22,
  },
  info: {
    flex: 1,
    marginLeft: 12,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
  },
  artist: {
    fontSize: 12,
    color: C.sub,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  activeAction: {
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
  },
  activeText: {
    fontSize: 10,
    color: C.accent,
    fontWeight: '600',
  },
  rateText: {
    fontSize: 12,
    color: C.sub,
    fontWeight: '600',
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: C.accent,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
    gap: 20,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.text,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    minWidth: 80,
    alignItems: 'center',
  },
  activeChip: {
    backgroundColor: C.accent,
    borderColor: C.accent,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.sub,
  },
  activeChipText: {
    color: '#fff',
  },
  cancelBtn: {
    marginTop: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: {
    color: C.danger,
    fontSize: 14,
    fontWeight: '700',
  },
});

export default MiniPlayer;
