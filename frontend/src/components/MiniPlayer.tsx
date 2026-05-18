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
import { usePlayer } from '../context/PlayerContext';

const C = {
  bg: '#0D0F1E',
  card: '#13162B',
  border: '#1E2140',
  text: '#FFFFFF',
  sub: '#8A8FAD',
  accent: '#6C63FF',
  surface: '#1A1D35',
  danger: '#EF4444',
  green: '#22C55E',
};

const fmt = (s: number) => {
  if (!s || isNaN(s)) return '0:00';
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
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
    seek,
    durationRef,
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
  }, [currentAudio]);

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
  }, [isPlaying, isLoading]);

  const spin = rotation.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'], extrapolate: 'extend' });

  if (!currentAudio) return null;

  const poster =
    typeof currentAudio.poster === 'string'
      ? currentAudio.poster
      : (currentAudio.poster as any)?.url ?? currentAudio.image ?? '';

  const pct = duration > 0 ? Math.min(position / duration, 1) : 0;

  return (
    <>
      <Animated.View style={[styles.wrapper, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${pct * 100}%` as any }]} />
        </View>

        <Pressable style={styles.card} onPress={onPress}>
          <Animated.View style={[styles.artWrap, { transform: [{ rotate: spin }] }]}>
            {poster ? (
              <Image source={{ uri: poster }} style={styles.art} />
            ) : (
              <View style={[styles.art, styles.artEmpty]}>
                <FontAwesome5 name="music" iconStyle="solid" size={18} color={C.border} />
              </View>
            )}
          </Animated.View>

          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={1}>{currentAudio.title}</Text>
            <Text style={styles.artist} numberOfLines={1}>{currentAudio.about || 'SonicX'}</Text>
          </View>

          <View style={styles.extraBtns}>
            <Pressable
              style={[styles.extraBtn, sleepRemaining !== null && styles.extraBtnActive]}
              hitSlop={8}
              onPress={e => { e.stopPropagation(); setShowSleep(true); }}
            >
              <FontAwesome5
                name="moon"
                iconStyle="solid"
                size={13}
                color={sleepRemaining !== null ? C.accent : C.sub}
              />
              {sleepRemaining !== null && (
                <Text style={styles.sleepBadge}>{fmtSleep(sleepRemaining)}</Text>
              )}
            </Pressable>

            <Pressable
              style={[styles.extraBtn, rate !== 1 && styles.extraBtnActive]}
              hitSlop={8}
              onPress={e => { e.stopPropagation(); setShowSpeed(true); }}
            >
              <Text style={[styles.rateLabel, rate !== 1 && { color: C.accent }]}>
                {rate === 1 ? '1×' : `${rate}×`}
              </Text>
            </Pressable>
          </View>

          <View style={styles.controls}>
            <Pressable hitSlop={10} onPress={e => { e.stopPropagation(); seek(0); }} style={styles.ctrlBtn}>
              <FontAwesome5 name="step-backward" iconStyle="solid" size={16} color={C.text} />
            </Pressable>

            <Pressable hitSlop={10} onPress={e => { e.stopPropagation(); togglePlay(); }} style={styles.playBtn}>
              {isLoading ? (
                <ActivityIndicator size={16} color="#fff" />
              ) : (
                <FontAwesome5
                  name={isPlaying ? 'pause' : 'play'}
                  iconStyle="solid"
                  size={16}
                  color="#fff"
                  style={isPlaying ? undefined : { marginLeft: 2 }}
                />
              )}
            </Pressable>

            <Pressable hitSlop={10} onPress={e => { e.stopPropagation(); seek(durationRef.current); }} style={styles.ctrlBtn}>
              <FontAwesome5 name="step-forward" iconStyle="solid" size={16} color={C.text} />
            </Pressable>
          </View>
        </Pressable>
      </Animated.View>

      <Modal transparent visible={showSpeed} animationType="fade" onRequestClose={() => setShowSpeed(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowSpeed(false)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <FontAwesome5 name="tachometer-alt" iconStyle="solid" size={16} color={C.accent} />
              <Text style={styles.sheetTitle}>Tốc độ phát</Text>
            </View>
            <View style={styles.rateGrid}>
              {RATES.map(r => (
                <Pressable
                  key={r}
                  style={[styles.rateChip, rate === r && styles.rateChipActive]}
                  onPress={() => { setRate(r); setShowSpeed(false); }}
                >
                  <Text style={[styles.rateChipText, rate === r && styles.rateChipTextActive]}>
                    {r === 1 ? '1× Bình thường' : `${r}×`}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal transparent visible={showSleep} animationType="fade" onRequestClose={() => setShowSleep(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowSleep(false)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <FontAwesome5 name="moon" iconStyle="solid" size={16} color={C.accent} />
              <Text style={styles.sheetTitle}>Hẹn giờ tắt nhạc</Text>
            </View>
            {sleepRemaining !== null && (
              <View style={styles.sleepActiveRow}>
                <FontAwesome5 name="clock" iconStyle="solid" size={14} color={C.green} />
                <Text style={styles.sleepActiveText}>Tắt sau {fmtSleep(sleepRemaining)}</Text>
                <Pressable
                  style={styles.cancelSleepBtn}
                  onPress={() => { setSleepTimer(null); setShowSleep(false); }}
                >
                  <FontAwesome5 name="times-circle" iconStyle="solid" size={14} color={C.danger} />
                  <Text style={styles.cancelSleepText}>Hủy</Text>
                </Pressable>
              </View>
            )}
            <View style={styles.sleepGrid}>
              {SLEEP_OPTIONS.map(m => (
                <Pressable
                  key={m}
                  style={[styles.sleepChip, sleepMinutes === m && styles.sleepChipActive]}
                  onPress={() => { setSleepTimer(m); setShowSleep(false); }}
                >
                  <FontAwesome5 name="moon" iconStyle="solid" size={12} color={sleepMinutes === m ? '#fff' : C.sub} />
                  <Text style={[styles.sleepChipText, sleepMinutes === m && styles.sleepChipTextActive]}>
                    {m} phút
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: C.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
  },
  progressBar: {
    height: 2,
    backgroundColor: C.surface,
  },
  progressFill: {
    height: 2,
    backgroundColor: C.accent,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  artWrap: {
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  art: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.surface,
  },
  artEmpty: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '700',
    color: C.text,
    lineHeight: 18,
  },
  artist: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '400',
    color: C.sub,
    lineHeight: 15,
  },
  extraBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  extraBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: C.surface,
  },
  extraBtnActive: {
    backgroundColor: 'rgba(108,99,255,0.15)',
  },
  sleepBadge: {
    fontFamily: 'Inter',
    fontSize: 9,
    fontWeight: '700',
    color: C.accent,
  },
  rateLabel: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '700',
    color: C.sub,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ctrlBtn: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: C.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  sheetTitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
  },
  rateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  rateChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  rateChipActive: {
    backgroundColor: C.accent,
    borderColor: C.accent,
  },
  rateChipText: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '600',
    color: C.sub,
  },
  rateChipTextActive: {
    color: '#fff',
  },
  sleepActiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(34,197,94,0.08)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.2)',
  },
  sleepActiveText: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '600',
    color: C.green,
    flex: 1,
  },
  cancelSleepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cancelSleepText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
    color: C.danger,
  },
  sleepGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sleepChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  sleepChipActive: {
    backgroundColor: C.accent,
    borderColor: C.accent,
  },
  sleepChipText: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '600',
    color: C.sub,
  },
  sleepChipTextActive: {
    color: '#fff',
  },
});

export default MiniPlayer;
