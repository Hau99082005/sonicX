import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Dimensions,
  PanResponder,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@react-native-vector-icons/fontawesome5';
import PagerView from 'react-native-pager-view';
import LinearGradient from 'react-native-linear-gradient';
import {
  Audio,
  toggleFavorite,
  checkIsFavorite,
  getSimilarAudios,
} from '@api/music';
import { RouteProp } from '@react-navigation/native';
import { usePlayer } from '../../context/PlayerContext';
import LyricsView from '../../components/LyricsView';

const { width } = Dimensions.get('window');
const ARTWORK_SIZE = width * 0.8;

const C = {
  bg: '#080912',
  surface: '#121421',
  card: '#1A1D2E',
  border: 'rgba(255, 255, 255, 0.06)',
  text: '#FFFFFF',
  sub: '#94A3B8',
  accent: '#7C3AED',
  accentGradient: ['#7C3AED', '#DB2777'],
  heart: '#FF5370',
};

type RootStackParamList = { MusicPlayer: { audio: Audio } };
interface Props {
  route: RouteProp<RootStackParamList, 'MusicPlayer'>;
  navigation: any;
}

const fmt = (s: number) => {
  if (!s || isNaN(s)) return '0:00';
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};

const MusicPlayer: React.FC<Props> = ({ route, navigation }) => {
  // #region debug-point H1:player-init
  fetch('http://127.0.0.1:7777/event', {
    method: 'POST',
    body: JSON.stringify({
      sessionId: 'invalid-hook-call',
      runId: 'pre',
      hypothesisId: 'H1',
      location: 'MusicPlayer.tsx:50',
      msg: '[DEBUG] MusicPlayer init',
    }),
  }).catch(() => {});
  // #endregion
  const { audio } = route.params;
  const player = usePlayer();

  const barWidth = useRef(width - 48);
  const isSeeking = useRef(false);

  const [isFavorite, setIsFavorite] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const pagerRef = useRef<PagerView>(null);

  const rotation = useRef(new Animated.Value(0)).current;
  const rotationDeg = useRef(0);
  const rotationAnim = useRef<Animated.CompositeAnimation | null>(null);

  const isPlaying = player.isPlaying;
  const isLoading = player.isLoading;
  const position = player.position;
  const duration = player.duration;

  useEffect(() => {
    if (audio._id !== player.currentAudio?._id) player.play(audio);
  }, [audio, player]);

  useEffect(() => {
    if (isPlaying && !isLoading) {
      const remaining = 360 - (rotationDeg.current % 360);
      rotationAnim.current = Animated.loop(
        Animated.sequence([
          Animated.timing(rotation, {
            toValue: rotationDeg.current + remaining,
            duration: (remaining / 360) * 15000,
            useNativeDriver: true,
          }),
          Animated.timing(rotation, {
            toValue: rotationDeg.current + remaining + 360,
            duration: 15000,
            useNativeDriver: true,
          }),
        ]),
      );
      rotationAnim.current.start();
    } else {
      rotationAnim.current?.stop();
      rotation.stopAnimation(val => {
        rotationDeg.current = val;
      });
    }
    return () => rotationAnim.current?.stop();
  }, [isPlaying, isLoading, rotation]);

  const spin = rotation.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
    extrapolate: 'extend',
  });
  const posterUrl =
    typeof audio.poster === 'string'
      ? audio.poster
      : (audio.poster as any)?.url ?? audio.image ?? '';

  useEffect(() => {
    getSimilarAudios(audio._id, audio.category)
      .then(() => {
        // ...
      })
      .catch(() => {})
      .finally(() => {});
    checkIsFavorite(audio._id)
      .then(res => setIsFavorite(res.data.result))
      .catch(() => {});
  }, [audio]);

  const toggleFav = async () => {
    try {
      const res = await toggleFavorite(audio._id);
      setIsFavorite(res.data.status === 'added');
    } catch {}
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: e => {
        isSeeking.current = true;
        player.seekRatio(e.nativeEvent.locationX / barWidth.current);
      },
      onPanResponderMove: e =>
        player.seekRatio(e.nativeEvent.locationX / barWidth.current),
      onPanResponderRelease: e => {
        player.seekRatio(e.nativeEvent.locationX / barWidth.current);
        isSeeking.current = false;
      },
    }),
  ).current;

  const pct = duration > 0 ? Math.min(position / duration, 1) : 0;

  return (
    <View style={styles.root}>
      <Image
        source={{ uri: posterUrl }}
        style={StyleSheet.absoluteFill}
        blurRadius={40}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: 'rgba(8,9,18,0.7)' },
        ]}
      />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <FontAwesome5
              name="chevron-down"
              iconStyle="solid"
              size={18}
              color="#fff"
            />
          </Pressable>
          <View style={styles.headerInfo}>
            <Text style={styles.headerSub}>ĐANG PHÁT TỪ</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {audio.category || 'SonicX'}
            </Text>
          </View>
          <Pressable style={styles.iconBtn}>
            <FontAwesome5
              name="ellipsis-h"
              iconStyle="solid"
              size={18}
              color="#fff"
            />
          </Pressable>
        </View>

        <PagerView
          ref={pagerRef}
          style={styles.pager}
          onPageSelected={e => setPageIndex(e.nativeEvent.position)}
        >
          <View key="1" style={styles.page}>
            <Animated.View
              style={[styles.artWrap, { transform: [{ rotate: spin }] }]}
            >
              <Image source={{ uri: posterUrl }} style={styles.artwork} />
            </Animated.View>
            <View style={styles.info}>
              <View style={styles.titleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title} numberOfLines={1}>
                    {audio.title}
                  </Text>
                  <Text style={styles.artist}>{audio.about || 'SonicX'}</Text>
                </View>
                <Pressable onPress={toggleFav}>
                  <FontAwesome5
                    name="heart"
                    iconStyle={isFavorite ? 'solid' : 'regular'}
                    size={24}
                    color={isFavorite ? C.heart : '#fff'}
                  />
                </Pressable>
              </View>

              <View style={styles.progressSection}>
                <View style={styles.barWrap} {...pan.panHandlers}>
                  <View style={styles.barBase}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${pct * 100}%` as any },
                      ]}
                    >
                      <View style={styles.knob} />
                    </View>
                  </View>
                </View>
                <View style={styles.timeRow}>
                  <Text style={styles.time}>{fmt(position)}</Text>
                  <Text style={styles.time}>{fmt(duration)}</Text>
                </View>
              </View>

              <View style={styles.controls}>
                <Pressable
                  onPress={() => player.setIsShuffle(!player.isShuffle)}
                >
                  <FontAwesome5
                    name="random"
                    iconStyle="solid"
                    size={18}
                    color={player.isShuffle ? C.accent : C.sub}
                  />
                </Pressable>
                <Pressable onPress={() => player.seek(0)}>
                  <FontAwesome5
                    name="step-backward"
                    iconStyle="solid"
                    size={24}
                    color="#fff"
                  />
                </Pressable>
                <Pressable onPress={() => player.togglePlay()}>
                  <LinearGradient
                    colors={C.accentGradient}
                    style={styles.playBtn}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <FontAwesome5
                        name={isPlaying ? 'pause' : 'play'}
                        iconStyle="solid"
                        size={22}
                        color="#fff"
                      />
                    )}
                  </LinearGradient>
                </Pressable>
                <Pressable onPress={() => player.seek(duration)}>
                  <FontAwesome5
                    name="step-forward"
                    iconStyle="solid"
                    size={24}
                    color="#fff"
                  />
                </Pressable>
                <Pressable
                  onPress={() => {
                    const nextMode = (player.repeatMode + 1) % 3;
                    player.setRepeatMode(nextMode === 1 ? 2 : nextMode); // Current context only supports 0 and 2
                  }}
                >
                  <FontAwesome5
                    name="redo"
                    iconStyle="solid"
                    size={18}
                    color={player.repeatMode !== 0 ? C.accent : C.sub}
                  />
                  {player.repeatMode === 2 && (
                    <Text style={styles.repeatOne}>1</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
          <View key="2" style={styles.page}>
            <LyricsView audio={audio} />
          </View>
        </PagerView>

        <View style={styles.footer}>
          <View style={styles.dotRow}>
            <View style={[styles.dot, pageIndex === 0 && styles.dotActive]} />
            <View style={[styles.dot, pageIndex === 1 && styles.dotActive]} />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 16,
  },
  headerInfo: { flex: 1, alignItems: 'center' },
  headerSub: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
  },
  headerTitle: { fontSize: 14, fontWeight: '700', color: '#fff', marginTop: 2 },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pager: { flex: 1 },
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  artWrap: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    borderRadius: ARTWORK_SIZE / 2,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  artwork: { flex: 1, borderRadius: (ARTWORK_SIZE - 16) / 2 },
  info: { width: '100%', marginTop: 40, gap: 32 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  title: { fontSize: 26, fontWeight: '800', color: '#fff' },
  artist: { fontSize: 16, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  progressSection: { gap: 12 },
  barWrap: { height: 20, justifyContent: 'center' },
  barBase: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
  },
  barFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
    position: 'relative',
  },
  knob: {
    position: 'absolute',
    right: -6,
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  time: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  repeatOne: {
    position: 'absolute',
    top: -8,
    right: -8,
    fontSize: 10,
    fontWeight: '800',
    color: C.accent,
  },
  footer: { paddingBottom: 20, alignItems: 'center' },
  dotRow: { flexDirection: 'row', gap: 8 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dotActive: { backgroundColor: '#fff', width: 20 },
});

export default MusicPlayer;
