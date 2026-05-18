import React, { useRef, useState, useEffect, useCallback } from 'react';
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
  ScrollView,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@react-native-vector-icons/fontawesome5';
import PagerView from 'react-native-pager-view';
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
const ARTWORK_SIZE = width - 48;

const C = {
  bg: '#0C0C0C',
  surface: '#1A1A1A',
  line: '#2A2A2A',
  text: '#FFFFFF',
  sub: '#777777',
  accent: '#6C63FF',
  heart: '#FF4444',
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
  const { audio } = route.params;
  const player = usePlayer();

  const barWidth = useRef(width - 48);
  const isSeeking = useRef(false);

  const [isFavorite, setIsFavorite] = useState(false);
  const [isFavLoading, setIsFavLoading] = useState(false);
  const [similarTracks, setSimilarTracks] = useState<Audio[]>([]);
  const [similarLoading, setSimilarLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const pagerRef = useRef<PagerView>(null);

  const fadeArt = useRef(new Animated.Value(0)).current;
  const scaleArt = useRef(new Animated.Value(0.96)).current;
  const fadeBody = useRef(new Animated.Value(0)).current;
  const slideBody = useRef(new Animated.Value(16)).current;
  const scalePlay = useRef(new Animated.Value(1)).current;

  const rotation = useRef(new Animated.Value(0)).current;
  const rotationDeg = useRef(0);
  const rotationAnim = useRef<Animated.CompositeAnimation | null>(null);

  const isPlaying = player.isPlaying;
  const isLoading = player.isLoading;
  const position = player.position;
  const duration = player.duration;
  const repeatMode = player.repeatMode;
  const isShuffle = player.isShuffle;

  useEffect(() => {
    if (audio._id !== player.currentAudio?._id) {
      player.play(audio);
    }
  }, [audio._id]);

  const startRotation = useCallback(() => {
    const remaining = 360 - (rotationDeg.current % 360);
    const firstDuration = (remaining / 360) * 12000;
    rotationAnim.current = Animated.loop(
      Animated.sequence([
        Animated.timing(rotation, {
          toValue: rotationDeg.current + remaining,
          duration: firstDuration,
          useNativeDriver: true,
        }),
        Animated.timing(rotation, {
          toValue: rotationDeg.current + remaining + 360,
          duration: 12000,
          useNativeDriver: true,
        }),
      ]),
    );
    rotationAnim.current.start();
  }, [rotation]);

  const stopRotation = useCallback(() => {
    rotationAnim.current?.stop();
    rotation.stopAnimation(val => {
      rotationDeg.current = val;
    });
  }, [rotation]);

  useEffect(() => {
    if (isPlaying && !isLoading) {
      startRotation();
    } else {
      stopRotation();
    }
    return () => {
      rotationAnim.current?.stop();
    };
  }, [isPlaying, isLoading, startRotation, stopRotation]);

  const spin = rotation.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
    extrapolate: 'extend',
  });

  const posterUrl: string =
    typeof audio.poster === 'string'
      ? audio.poster
      : (audio.poster as any)?.url ?? audio.image ?? '';

  useEffect(() => {
    getSimilarAudios(audio._id, audio.category)
      .then(res => setSimilarTracks(res.data.audios ?? []))
      .catch(() => setSimilarTracks([]))
      .finally(() => setSimilarLoading(false));
  }, [audio._id, audio.category]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeArt, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleArt, {
        toValue: 1,
        tension: 60,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(fadeBody, {
        toValue: 1,
        duration: 350,
        delay: 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideBody, {
        toValue: 0,
        duration: 300,
        delay: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    checkIsFavorite(audio._id)
      .then(res => setIsFavorite(res.data.result))
      .catch(() => setIsFavorite(false));
  }, [audio._id]);

  const toggleFav = useCallback(async () => {
    if (isFavLoading) return;
    setIsFavLoading(true);
    try {
      const res = await toggleFavorite(audio._id);
      setIsFavorite(res.data.status === 'added');
    } catch {
      Alert.alert('Lỗi', 'Không thể cập nhật yêu thích. Vui lòng thử lại.');
    } finally {
      setIsFavLoading(false);
    }
  }, [isFavLoading, audio._id]);

  const openMenu = useCallback(() => {
    Alert.alert(
      audio.title,
      [
        audio.about ? `Mô tả: ${audio.about}` : null,
        audio.category ? `Thể loại: ${audio.category}` : null,
        audio.duration ? `Thời lượng: ${fmt(audio.duration)}` : null,
        audio.likes ? `${audio.likes.length} lượt thích` : null,
      ]
        .filter(Boolean)
        .join('\n') || 'Không có thông tin',
      [
        {
          text: 'Chia sẻ',
          onPress: () =>
            Share.share({ message: `Đang nghe: ${audio.title} trên SonicX` }),
        },
        { text: 'Đóng', style: 'cancel' },
      ],
    );
  }, [audio]);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: e => {
        isSeeking.current = true;
        player.seekRatio(e.nativeEvent.locationX / barWidth.current);
      },
      onPanResponderMove: e => {
        player.seekRatio(e.nativeEvent.locationX / barWidth.current);
      },
      onPanResponderRelease: e => {
        player.seekRatio(e.nativeEvent.locationX / barWidth.current);
        setTimeout(() => {
          isSeeking.current = false;
        }, 300);
      },
    }),
  ).current;

  const tapPlay = () => {
    player.togglePlay();
    Animated.sequence([
      Animated.spring(scalePlay, {
        toValue: 0.88,
        useNativeDriver: true,
        speed: 60,
        bounciness: 2,
      }),
      Animated.spring(scalePlay, {
        toValue: 1,
        useNativeDriver: true,
        speed: 60,
        bounciness: 6,
      }),
    ]).start();
  };

  const pct = duration > 0 ? Math.min(position / duration, 1) : 0;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={styles.headerBtn}
        >
          <FontAwesome5 name="chevron-left" iconStyle="solid" size={18} color={C.text} />
        </Pressable>

        <View style={styles.pageDots}>
          <Pressable onPress={() => pagerRef.current?.setPage(0)}>
            <View style={[styles.dot, pageIndex === 0 && styles.dotActive]} />
          </Pressable>
          <Pressable onPress={() => pagerRef.current?.setPage(1)}>
            <View style={[styles.dot, pageIndex === 1 && styles.dotActive]} />
          </Pressable>
        </View>

        <Pressable hitSlop={12} style={styles.headerBtn} onPress={openMenu}>
          <FontAwesome5 name="ellipsis-v" iconStyle="solid" size={18} color={C.text} />
        </Pressable>
      </View>

      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        onPageSelected={e => setPageIndex(e.nativeEvent.position)}
      >
        <View key="player" style={{ flex: 1 }}>
          <Animated.View
            style={[
              styles.artContainer,
              { opacity: fadeArt, transform: [{ scale: scaleArt }, { rotate: spin }] },
            ]}
          >
            <View style={styles.artWrapper}>
              {posterUrl ? (
                <Image source={{ uri: posterUrl }} style={styles.artwork} />
              ) : (
                <View style={[styles.artwork, styles.artworkEmpty]}>
                  <FontAwesome5 name="music" iconStyle="solid" size={64} color={C.line} />
                </View>
              )}
            </View>
          </Animated.View>

          <Animated.View
            style={[styles.content, { opacity: fadeBody, transform: [{ translateY: slideBody }] }]}
          >
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              <View style={styles.infoSection}>
                <View style={styles.infoRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title} numberOfLines={1}>{audio.title}</Text>
                    <Text style={styles.artist} numberOfLines={1}>{audio.about || 'SonicX'}</Text>
                  </View>
                  <Pressable onPress={toggleFav} hitSlop={12} style={styles.favoriteBtn} disabled={isFavLoading}>
                    {isFavLoading ? (
                      <ActivityIndicator size={18} color={C.sub} />
                    ) : (
                      <FontAwesome5
                        name="heart"
                        iconStyle={isFavorite ? 'solid' : 'regular'}
                        size={22}
                        color={isFavorite ? C.heart : C.sub}
                      />
                    )}
                  </Pressable>
                </View>
              </View>

              <View style={styles.progressSection}>
                <View
                  style={styles.trackContainer}
                  onLayout={e => { barWidth.current = e.nativeEvent.layout.width; }}
                  {...pan.panHandlers}
                >
                  <View style={styles.trackBar}>
                    <View style={[styles.trackProgress, { width: `${pct * 100}%` }]} />
                    <View style={[styles.trackThumb, { left: `${Math.min(pct * 100, 97)}%` as any }]} />
                  </View>
                </View>
                <View style={styles.timeContainer}>
                  <Text style={styles.timeText}>{fmt(position)}</Text>
                  <Text style={styles.timeText}>{fmt(duration)}</Text>
                </View>
              </View>

              <View style={styles.controlsSection}>
                <Pressable hitSlop={14} onPress={() => player.setIsShuffle(!isShuffle)} style={[styles.controlButton, isShuffle && styles.controlButtonActive]}>
                  <FontAwesome5 name="random" size={16} color={isShuffle ? C.accent : C.sub} iconStyle="solid" />
                </Pressable>
                <Pressable hitSlop={14} onPress={() => player.seek(0)} style={styles.skipButton}>
                  <FontAwesome5 name="step-backward" size={20} color={C.text} iconStyle="solid" />
                </Pressable>
                <Animated.View style={{ transform: [{ scale: scalePlay }] }}>
                  <Pressable style={styles.playButton} onPress={tapPlay}>
                    {isLoading ? (
                      <ActivityIndicator color={C.bg} size={20} />
                    ) : (
                      <FontAwesome5
                        name={isPlaying ? 'pause' : 'play'}
                        size={24}
                        color={C.bg}
                        iconStyle="solid"
                        style={isPlaying ? undefined : { marginLeft: 3 }}
                      />
                    )}
                  </Pressable>
                </Animated.View>
                <Pressable hitSlop={14} onPress={() => player.seek(player.durationRef.current)} style={styles.skipButton}>
                  <FontAwesome5 name="step-forward" size={20} color={C.text} iconStyle="solid" />
                </Pressable>
                <Pressable hitSlop={14} onPress={() => player.setRepeatMode((repeatMode + 1) % 3)} style={[styles.controlButton, repeatMode > 0 && styles.controlButtonActive]}>
                  <View style={styles.repeatIconContainer}>
                    <FontAwesome5 name="redo" size={16} color={repeatMode > 0 ? C.accent : C.sub} iconStyle="solid" />
                    {repeatMode === 2 && <Text style={styles.repeatOneLabel}>1</Text>}
                  </View>
                </Pressable>
              </View>

              <View style={styles.statsSection}>
                <View style={styles.statItem}>
                  <FontAwesome5 name="heart" size={16} color={C.sub} iconStyle="solid" />
                  <Text style={styles.statLabel}>{audio.likes?.length ?? 0} lượt thích</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <FontAwesome5 name="tag" size={16} color={C.sub} iconStyle="solid" />
                  <Text style={styles.statLabel} numberOfLines={1}>{audio.category ?? 'Chưa phân loại'}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <FontAwesome5 name="clock" size={16} color={C.sub} iconStyle="solid" />
                  <Text style={styles.statLabel}>{audio.duration ? fmt(audio.duration) : fmt(duration)}</Text>
                </View>
              </View>

              <View style={styles.similarSection}>
                <View style={styles.similarHeader}>
                  <Text style={styles.similarTitle}>Bài hát tương tự</Text>
                  <Pressable onPress={() => navigation.navigate('Home')}>
                    <Text style={styles.seeAll}>Xem tất cả</Text>
                  </Pressable>
                </View>
                {similarLoading ? (
                  <ActivityIndicator color={C.accent} style={{ paddingVertical: 32 }} />
                ) : similarTracks.length === 0 ? (
                  <View style={styles.similarEmpty}>
                    <FontAwesome5 name="music" size={28} color={C.line} iconStyle="solid" />
                    <Text style={styles.similarEmptyText}>Không có bài hát tương tự</Text>
                  </View>
                ) : (
                  similarTracks.map((item, index) => {
                    const itemPoster = typeof item.poster === 'string' ? item.poster : (item.poster as any)?.url ?? item.image ?? '';
                    return (
                      <Pressable
                        key={String(item._id)}
                        style={[styles.trackRow, index < similarTracks.length - 1 && styles.trackRowBorder]}
                        onPress={() => navigation.replace('MusicPlayer', { audio: item })}
                      >
                        <View style={styles.trackIndexWrap}>
                          <Text style={styles.trackIndex}>{index + 1}</Text>
                        </View>
                        <View style={styles.trackThumbWrap}>
                          {itemPoster ? (
                            <Image source={{ uri: itemPoster }} style={styles.trackThumbImg} />
                          ) : (
                            <View style={[styles.trackThumbImg, styles.trackThumbEmpty]}>
                              <FontAwesome5 name="music" size={14} color={C.line} iconStyle="solid" />
                            </View>
                          )}
                        </View>
                        <View style={styles.trackInfo}>
                          <Text style={styles.trackTitle} numberOfLines={1}>{item.title}</Text>
                          <View style={styles.trackMeta}>
                            <FontAwesome5 name="tag" size={10} color={C.sub} iconStyle="solid" />
                            <Text style={styles.trackCategory} numberOfLines={1}>{item.category ?? 'Khác'}</Text>
                            {item.likes && item.likes.length > 0 && (
                              <>
                                <View style={styles.trackMetaDot} />
                                <FontAwesome5 name="heart" size={10} color={C.sub} iconStyle="solid" />
                                <Text style={styles.trackCategory}>{item.likes.length}</Text>
                              </>
                            )}
                          </View>
                        </View>
                        <FontAwesome5 name="play-circle" size={20} color={C.accent} iconStyle="solid" />
                      </Pressable>
                    );
                  })
                )}
              </View>
            </ScrollView>
          </Animated.View>
        </View>

        <View key="lyrics" style={{ flex: 1 }}>
          <View style={styles.lyricsHeader}>
            <Text style={styles.lyricsTitle} numberOfLines={1}>{audio.title}</Text>
            <Text style={styles.lyricsArtist} numberOfLines={1}>{audio.about || 'SonicX'}</Text>
          </View>
          <LyricsView audio={audio} onSeek={t => player.seek(t)} />
          <View style={styles.lyricsControls}>
            <View
              style={styles.miniTrackContainer}
              onLayout={e => { barWidth.current = e.nativeEvent.layout.width; }}
              {...pan.panHandlers}
            >
              <View style={styles.trackBar}>
                <View style={[styles.trackProgress, { width: `${pct * 100}%` }]} />
                <View style={[styles.trackThumb, { left: `${Math.min(pct * 100, 97)}%` as any }]} />
              </View>
            </View>
            <View style={styles.miniTimeRow}>
              <Text style={styles.timeText}>{fmt(position)}</Text>
              <Text style={styles.timeText}>{fmt(duration)}</Text>
            </View>
            <View style={styles.miniButtons}>
              <Pressable hitSlop={14} onPress={() => player.seek(0)} style={styles.skipButton}>
                <FontAwesome5 name="step-backward" size={18} color={C.text} iconStyle="solid" />
              </Pressable>
              <Animated.View style={{ transform: [{ scale: scalePlay }] }}>
                <Pressable style={styles.playButton} onPress={tapPlay}>
                  {isLoading ? (
                    <ActivityIndicator color={C.bg} size={20} />
                  ) : (
                    <FontAwesome5
                      name={isPlaying ? 'pause' : 'play'}
                      size={22}
                      color={C.bg}
                      iconStyle="solid"
                      style={isPlaying ? undefined : { marginLeft: 3 }}
                    />
                  )}
                </Pressable>
              </Animated.View>
              <Pressable hitSlop={14} onPress={() => player.seek(player.durationRef.current)} style={styles.skipButton}>
                <FontAwesome5 name="step-forward" size={18} color={C.text} iconStyle="solid" />
              </Pressable>
            </View>
          </View>
        </View>
      </PagerView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageDots: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.line },
  dotActive: { width: 20, backgroundColor: C.accent },
  artContainer: {
    alignSelf: 'center',
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  artWrapper: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    borderRadius: ARTWORK_SIZE / 2,
    overflow: 'hidden',
    backgroundColor: C.surface,
  },
  artwork: { width: '100%', height: '100%' },
  artworkEmpty: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: C.surface,
  },
  content: { flex: 1, paddingHorizontal: 24 },
  scrollContent: { paddingBottom: 32 },
  infoSection: { marginBottom: 20 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  favoriteBtn: { marginLeft: 12, paddingTop: 4 },
  title: {
    fontFamily: 'Inter',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
    color: C.text,
    marginBottom: 6,
    letterSpacing: 0.4,
  },
  artist: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500',
    color: C.sub,
    lineHeight: 21,
    letterSpacing: 0.3,
  },
  progressSection: { marginBottom: 28 },
  trackContainer: { height: 28, justifyContent: 'center' },
  trackBar: { height: 4, backgroundColor: C.line, borderRadius: 2 },
  trackProgress: { height: 4, backgroundColor: C.accent, borderRadius: 2 },
  trackThumb: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: C.text,
    top: '50%' as any,
    marginTop: -7,
    marginLeft: -7,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 2,
  },
  timeText: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '500',
    color: C.sub,
  },
  controlsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  controlButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
  },
  controlButtonActive: { backgroundColor: C.line },
  skipButton: {
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
  statsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    paddingVertical: 20,
    backgroundColor: C.surface,
    borderRadius: 12,
    marginBottom: 32,
  },
  statItem: { alignItems: 'center', flex: 1, gap: 8 },
  statLabel: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '500',
    color: C.sub,
  },
  statDivider: { width: 1, height: 24, backgroundColor: C.line },
  similarSection: { marginBottom: 24 },
  similarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  similarTitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
    letterSpacing: 0.4,
    color: C.text,
  },
  seeAll: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    letterSpacing: 0.3,
    color: C.accent,
  },
  repeatIconContainer: { alignItems: 'center', justifyContent: 'center' },
  repeatOneLabel: {
    position: 'absolute',
    fontFamily: 'Inter',
    fontSize: 8,
    fontWeight: '700',
    color: C.accent,
    bottom: -6,
    right: -6,
  },
  similarEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  similarEmptyText: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '400',
    color: C.sub,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  trackRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.line,
  },
  trackIndexWrap: { width: 20, alignItems: 'center' },
  trackIndex: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '500',
    color: C.sub,
  },
  trackThumbWrap: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  trackThumbImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.surface,
  },
  trackThumbEmpty: { justifyContent: 'center', alignItems: 'center' },
  trackInfo: { flex: 1, gap: 4 },
  trackTitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
    lineHeight: 20,
  },
  trackMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trackCategory: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '400',
    color: C.sub,
  },
  trackMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: C.sub,
    marginHorizontal: 2,
  },
  lyricsHeader: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
    alignItems: 'center',
  },
  lyricsTitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
    textAlign: 'center',
  },
  lyricsArtist: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '400',
    color: C.sub,
    marginTop: 3,
    textAlign: 'center',
  },
  lyricsControls: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: C.bg,
  },
  miniTrackContainer: { height: 28, justifyContent: 'center', marginBottom: 4 },
  miniTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  miniButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
});

export default MusicPlayer;
