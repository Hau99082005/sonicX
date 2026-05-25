import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  FlatList,
  ActivityIndicator,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@react-native-vector-icons/fontawesome5';
import LinearGradient from 'react-native-linear-gradient';
import { getFavoriteMusic, toggleFavorite, Audio } from '@api/music';
import { usePlayer } from '../../context/PlayerContext';
import Toast from 'react-native-toast-message';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = -SCREEN_WIDTH * 0.28;

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
  danger: '#EF4444',
};

const fmt = (s?: number) => {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = String(Math.floor(s % 60)).padStart(2, '0');
  return `${m}:${sec}`;
};

const SwipeableRow = ({
  audio,
  onPlay,
  onRemove,
  isActive,
  isPlaying,
}: {
  audio: Audio;
  onPlay: () => void;
  onRemove: () => void;
  isActive: boolean;
  isPlaying: boolean;
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const deleteOpacity = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 8 && Math.abs(g.dy) < 20,
      onPanResponderMove: (_, g) => {
        if (g.dx < 0) {
          translateX.setValue(Math.max(g.dx, SWIPE_THRESHOLD * 1.4));
          deleteOpacity.setValue(
            Math.min(Math.abs(g.dx) / Math.abs(SWIPE_THRESHOLD), 1),
          );
        }
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < SWIPE_THRESHOLD) {
          Animated.parallel([
            Animated.spring(translateX, {
              toValue: SWIPE_THRESHOLD * 1.1,
              useNativeDriver: true,
            }),
            Animated.timing(deleteOpacity, {
              toValue: 1,
              duration: 100,
              useNativeDriver: true,
            }),
          ]).start();
        } else {
          Animated.parallel([
            Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
            Animated.timing(deleteOpacity, {
              toValue: 0,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    }),
  ).current;

  const handleRemove = () => {
    Animated.timing(translateX, {
      toValue: -SCREEN_WIDTH,
      duration: 250,
      useNativeDriver: true,
    }).start(() => onRemove());
  };

  const posterUri =
    typeof audio.poster === 'string'
      ? audio.poster
      : (audio.poster as any)?.url ?? audio.image ?? '';

  return (
    <View style={s.swipeContainer}>
      <Animated.View style={[s.deleteAction, { opacity: deleteOpacity }]}>
        <Pressable style={s.deleteBtn} onPress={handleRemove}>
          <FontAwesome5
            name="heart-broken"
            iconStyle="solid"
            size={18}
            color="#fff"
          />
          <Text style={s.deleteBtnText}>Bỏ thích</Text>
        </Pressable>
      </Animated.View>

      <Animated.View
        style={{ transform: [{ translateX }] }}
        {...panResponder.panHandlers}
      >
        <Pressable style={[s.row, isActive && s.rowActive]} onPress={onPlay}>
          <View style={s.rowContent}>
            <View style={s.thumbWrap}>
              <Image source={{ uri: posterUri }} style={s.thumb} />
              {isActive && (
                <View style={s.activeOverlay}>
                  <FontAwesome5
                    name={isPlaying ? 'pause' : 'play'}
                    iconStyle="solid"
                    size={10}
                    color="#fff"
                  />
                </View>
              )}
            </View>
            <View style={s.rowInfo}>
              <Text
                style={[s.rowTitle, isActive && { color: C.accent }]}
                numberOfLines={1}
              >
                {audio.title}
              </Text>
              <Text style={s.rowSub} numberOfLines={1}>
                {audio.about || 'SonicX'}
              </Text>
            </View>
            <Text style={s.rowDuration}>{fmt(audio.duration)}</Text>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
};

const Favorites = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Audio[]>([]);
  const player = usePlayer();

  const loadFavorites = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getFavoriteMusic();
      setFavorites(res.data.audios ?? []);
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không thể tải danh sách',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const handlePlay = (audio: Audio) => {
    player.play(audio);
    navigation.navigate('MusicPlayer', { audio });
  };

  const handlePlayAll = () => {
    if (favorites.length === 0) return;
    const pick = favorites[0];
    player.play(pick);
    navigation.navigate('MusicPlayer', { audio: pick });
  };

  const handleRemove = async (audio: Audio) => {
    const backup = [...favorites];
    setFavorites(prev => prev.filter(a => a._id !== audio._id));
    try {
      await toggleFavorite(audio._id);
    } catch {
      setFavorites(backup);
      Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Không thể thực hiện' });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <View style={s.loaderWrap}>
          <ActivityIndicator color={C.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const firstTrackPoster = favorites[0]
    ? typeof favorites[0].poster === 'string'
      ? favorites[0].poster
      : (favorites[0].poster as any)?.url ?? favorites[0].image
    : null;

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <FlatList
        data={favorites}
        keyExtractor={(item, index) => item._id || index.toString()}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={s.heroContainer}>
            <View style={s.heroImgWrap}>
              {firstTrackPoster ? (
                <Image source={{ uri: firstTrackPoster }} style={s.heroImg} />
              ) : (
                <View style={[s.heroImg, { backgroundColor: C.surface }]} />
              )}
              <LinearGradient
                colors={['transparent', 'rgba(8,9,18,0.5)', C.bg]}
                style={StyleSheet.absoluteFill}
              />
            </View>

            <View style={s.heroContent}>
              <View style={s.heroTextWrap}>
                <Text style={s.heroEyebrow}>PLAYLIST</Text>
                <Text style={s.heroTitle}>Yêu thích</Text>
                <Text style={s.heroSub}>{favorites.length} bài hát đã lưu</Text>
              </View>
              <Pressable style={s.playAllFab} onPress={handlePlayAll}>
                <FontAwesome5
                  name="play"
                  iconStyle="solid"
                  size={20}
                  color="#fff"
                />
              </Pressable>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <SwipeableRow
            audio={item}
            isActive={player.currentAudio?._id === item._id}
            isPlaying={player.isPlaying}
            onPlay={() => handlePlay(item)}
            onRemove={() => handleRemove(item)}
          />
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <View style={s.emptyIconWrap}>
              <FontAwesome5
                name="heart"
                iconStyle="solid"
                size={32}
                color={C.accent}
              />
            </View>
            <Text style={s.emptyText}>Bộ sưu tập trống</Text>
            <Text style={s.emptySubText}>
              Hãy bắt đầu lưu những bài hát bạn yêu thích
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  loaderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loader: { marginTop: 40 },
  listContent: { paddingBottom: 140 },

  heroContainer: { height: 360, justifyContent: 'flex-end', marginBottom: 20 },
  heroImgWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  heroImg: { width: '100%', height: '100%', opacity: 0.5 },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  heroTextWrap: { flex: 1, marginRight: 16 },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: '900',
    color: C.accent,
    letterSpacing: 2,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: C.text,
    letterSpacing: -1.5,
    lineHeight: 52,
  },
  heroSub: { fontSize: 14, fontWeight: '600', color: C.sub, marginTop: 8 },
  playAllFab: {
    width: 56,
    height: 56,
    backgroundColor: C.accent,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },

  swipeContainer: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  deleteAction: {
    ...StyleSheet.absoluteFill,
    backgroundColor: C.danger,
    justifyContent: 'flex-end',
    alignItems: 'center',
    flexDirection: 'row',
    paddingRight: 32,
  },
  deleteBtn: { alignItems: 'center', gap: 6 },
  deleteBtnText: { color: '#fff', fontSize: 11, fontWeight: '800' },

  row: { backgroundColor: C.bg },
  rowActive: { backgroundColor: 'rgba(124,58,237,0.05)' },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 16,
  },
  thumbWrap: { width: 56, height: 56, backgroundColor: C.surface },
  thumb: { width: '100%', height: '100%' },
  activeOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowInfo: { flex: 1, gap: 4 },
  rowTitle: { fontSize: 16, fontWeight: '800', color: C.text },
  rowSub: { fontSize: 14, color: C.sub, fontWeight: '600' },
  rowDuration: { fontSize: 12, color: C.sub, fontWeight: '500' },

  empty: {
    alignItems: 'center',
    marginTop: 80,
    gap: 16,
    paddingHorizontal: 40,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    backgroundColor: 'rgba(124,58,237,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyText: { fontSize: 20, fontWeight: '900', color: C.text },
  emptySubText: {
    fontSize: 14,
    color: C.sub,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default Favorites;
