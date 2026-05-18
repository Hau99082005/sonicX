import React, { useEffect, useState, useCallback, useRef } from 'react';
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
import { getFavoriteMusic, toggleFavorite, Audio } from '@api/music';
import { usePlayer } from '../../context/PlayerContext';
import Toast from 'react-native-toast-message';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = -SCREEN_WIDTH * 0.28;

const C = {
  bg: '#0D0F1E',
  surface: '#161829',
  card: '#1C1F35',
  border: '#1E2140',
  text: '#FFFFFF',
  sub: '#8A8FAD',
  accent: '#6C63FF',
  accentDim: 'rgba(108,99,255,0.12)',
  heart: '#FF5370',
  heartDim: 'rgba(255,83,112,0.12)',
  danger: '#EF4444',
  dangerDim: 'rgba(239,68,68,0.15)',
  gold: '#F59E0B',
};

type SortKey = 'added' | 'title' | 'duration';

const fmt = (s?: number) => {
  if (!s || isNaN(s)) return '';
  const m = Math.floor(s / 60);
  const sec = String(Math.floor(s % 60)).padStart(2, '0');
  return `${m}:${sec}`;
};

const fmtTotal = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h} giờ ${m} phút`;
  return `${m} phút`;
};

const ownerName = (owner: Audio['owner']) => {
  if (!owner) return '';
  if (typeof owner === 'object') return owner.name;
  return owner;
};

const SwipeableRow = ({
  audio,
  onPlay,
  onRemove,
  isActive,
  isPlaying,
  index,
}: {
  audio: Audio;
  onPlay: () => void;
  onRemove: () => void;
  isActive: boolean;
  isPlaying: boolean;
  index: number;
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const deleteOpacity = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dy) < 20,
      onPanResponderMove: (_, g) => {
        if (g.dx < 0) {
          translateX.setValue(Math.max(g.dx, SWIPE_THRESHOLD * 1.4));
          deleteOpacity.setValue(Math.min(Math.abs(g.dx) / Math.abs(SWIPE_THRESHOLD), 1));
        }
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < SWIPE_THRESHOLD) {
          Animated.parallel([
            Animated.spring(translateX, { toValue: SWIPE_THRESHOLD * 1.1, useNativeDriver: true }),
            Animated.timing(deleteOpacity, { toValue: 1, duration: 100, useNativeDriver: true }),
          ]).start();
        } else {
          Animated.parallel([
            Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
            Animated.timing(deleteOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
          ]).start();
        }
      },
    }),
  ).current;

  const handleRemove = () => {
    Animated.timing(translateX, { toValue: -SCREEN_WIDTH, duration: 250, useNativeDriver: true }).start(onRemove);
  };

  const posterUri =
    typeof audio.poster === 'object' && audio.poster !== null
      ? audio.poster.url
      : typeof audio.poster === 'string'
      ? audio.poster
      : audio.image ?? '';

  return (
    <View style={s.swipeContainer}>
      <Animated.View style={[s.deleteAction, { opacity: deleteOpacity }]}>
        <Pressable style={s.deleteBtn} onPress={handleRemove}>
          <FontAwesome5 name="heart-broken" iconStyle="solid" size={18} color="#fff" />
          <Text style={s.deleteBtnText}>Bỏ thích</Text>
        </Pressable>
      </Animated.View>

      <Animated.View
        style={{ transform: [{ translateX }] }}
        {...panResponder.panHandlers}
      >
        <Pressable style={[s.row, isActive && s.rowActive]} onPress={onPlay}>
          <Text style={s.rowIdx}>{String(index + 1).padStart(2, '0')}</Text>
          <View style={s.rowThumb}>
            {posterUri ? (
              <Image source={{ uri: posterUri }} style={StyleSheet.absoluteFill} borderRadius={10} />
            ) : (
              <View style={s.thumbPlaceholder}>
                <FontAwesome5 name="music" iconStyle="solid" size={14} color={C.border} />
              </View>
            )}
            {isActive && (
              <View style={s.activeOverlay}>
                <FontAwesome5 name="volume-up" iconStyle="solid" size={9} color={C.accent} />
              </View>
            )}
          </View>
          <View style={s.rowInfo}>
            <Text style={[s.rowTitle, isActive && { color: C.accent }]} numberOfLines={1}>
              {audio.title}
            </Text>
            <View style={s.rowMeta}>
              {ownerName(audio.owner) !== '' && (
                <Text style={s.rowOwner} numberOfLines={1}>{ownerName(audio.owner)}</Text>
              )}
              {!!audio.duration && (
                <View style={s.chip}>
                  <FontAwesome5 name="clock" iconStyle="regular" size={8} color={C.sub} />
                  <Text style={s.chipText}>{fmt(audio.duration)}</Text>
                </View>
              )}
              {audio.category && (
                <View style={s.badge}>
                  <Text style={s.badgeText}>{audio.category}</Text>
                </View>
              )}
            </View>
          </View>
          <Pressable style={s.playBtn} onPress={onPlay}>
            <FontAwesome5
              name={isActive && isPlaying ? 'pause' : 'play'}
              iconStyle="solid"
              size={11}
              color="#fff"
            />
          </Pressable>
        </Pressable>
      </Animated.View>
    </View>
  );
};

const Favorites = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Audio[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>('added');
  const player = usePlayer();

  useEffect(() => { loadFavorites(); }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const res = await getFavoriteMusic();
      setFavorites(res.data.audios ?? []);
    } catch {
      Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Không thể tải danh sách yêu thích' });
    } finally {
      setLoading(false);
    }
  };

  const sorted = useCallback((): Audio[] => {
    const list = [...favorites];
    if (sortKey === 'title') list.sort((a, b) => a.title.localeCompare(b.title));
    else if (sortKey === 'duration') list.sort((a, b) => (b.duration ?? 0) - (a.duration ?? 0));
    return list;
  }, [favorites, sortKey]);

  const handlePlay = (audio: Audio) => {
    player.play(audio);
    navigation.navigate('MusicPlayer', { audio });
  };

  const handlePlayAll = () => {
    if (favorites.length === 0) return;
    const pick = favorites[Math.floor(Math.random() * favorites.length)];
    player.play(pick);
    navigation.navigate('MusicPlayer', { audio: pick });
  };

  const handleRemove = async (audio: Audio) => {
    setFavorites(prev => prev.filter(a => a._id !== audio._id));
    try {
      await toggleFavorite(audio._id);
    } catch {
      setFavorites(prev => [...prev, audio]);
      Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Không thể bỏ yêu thích' });
    }
  };

  const totalDuration = favorites.reduce((acc, a) => acc + (a.duration ?? 0), 0);

  const SORT_OPTS: { key: SortKey; label: string }[] = [
    { key: 'added', label: 'Mới thêm' },
    { key: 'title', label: 'Tên A–Z' },
    { key: 'duration', label: 'Thời lượng' },
  ];

  if (loading) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={C.accent} />
          <Text style={s.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const list = sorted();

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <FlatList
        data={list}
        keyExtractor={item => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.listContent}
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <View style={s.emptyIcon}>
              <FontAwesome5 name="heart" iconStyle="regular" size={32} color={C.heart} />
            </View>
            <Text style={s.emptyTitle}>Chưa có bài hát yêu thích</Text>
            <Text style={s.emptySub}>Nhấn vào biểu tượng trái tim ở bất kỳ bài hát nào để thêm vào đây</Text>
          </View>
        }
        ListHeaderComponent={
          <View>
            <View style={s.header}>
              <View>
                <Text style={s.headerEyebrow}>SonicX</Text>
                <Text style={s.headerTitle}>Yêu thích</Text>
              </View>
              <Pressable style={s.iconBtn} onPress={loadFavorites}>
                <FontAwesome5 name="sync-alt" iconStyle="solid" size={14} color={C.sub} />
              </Pressable>
            </View>

            {favorites.length > 0 && (
              <View style={s.summaryCard}>
                <View style={s.summaryLeft}>
                  <View style={s.summaryIconWrap}>
                    <FontAwesome5 name="heart" iconStyle="solid" size={18} color={C.heart} />
                  </View>
                  <View>
                    <Text style={s.summaryCount}>{favorites.length} bài hát</Text>
                    {totalDuration > 0 && (
                      <Text style={s.summaryDuration}>{fmtTotal(totalDuration)}</Text>
                    )}
                  </View>
                </View>
                <Pressable style={s.playAllBtn} onPress={handlePlayAll}>
                  <FontAwesome5 name="random" iconStyle="solid" size={13} color="#fff" />
                  <Text style={s.playAllText}>Phát ngẫu nhiên</Text>
                </Pressable>
              </View>
            )}

            {favorites.length > 0 && (
              <View style={s.toolbar}>
                <View style={s.sortRow}>
                  {SORT_OPTS.map(opt => (
                    <Pressable
                      key={opt.key}
                      style={[s.sortChip, sortKey === opt.key && s.sortChipActive]}
                      onPress={() => setSortKey(opt.key)}
                    >
                      <Text style={[s.sortChipText, sortKey === opt.key && s.sortChipTextActive]}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={s.swipeHint}>
                  <FontAwesome5 name="hand-point-left" iconStyle="regular" size={10} color={C.sub} />
                  {'  Vuốt để bỏ thích'}
                </Text>
              </View>
            )}
          </View>
        }
        renderItem={({ item, index }) => (
          <SwipeableRow
            audio={item}
            index={index}
            onPlay={() => handlePlay(item)}
            onRemove={() => handleRemove(item)}
            isActive={player.currentAudio?._id === item._id}
            isPlaying={player.isPlaying}
          />
        )}
      />
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingText: { fontFamily: 'Inter', fontSize: 14, color: C.sub },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
  },
  headerEyebrow: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '500',
    color: C.heart,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  headerTitle: { fontFamily: 'Inter', fontSize: 26, fontWeight: '700', color: C.text, letterSpacing: -0.5 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  summaryCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  summaryIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.heartDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCount: { fontFamily: 'Inter', fontSize: 15, fontWeight: '700', color: C.text },
  summaryDuration: { fontFamily: 'Inter', fontSize: 12, fontWeight: '400', color: C.sub, marginTop: 2 },
  playAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: C.accent,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 22,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  playAllText: { fontFamily: 'Inter', fontSize: 13, fontWeight: '600', color: '#fff' },

  toolbar: {
    paddingHorizontal: 20,
    marginBottom: 14,
    gap: 10,
  },
  sortRow: { flexDirection: 'row', gap: 8 },
  sortChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  sortChipActive: { backgroundColor: C.accentDim, borderColor: C.accent },
  sortChipText: { fontFamily: 'Inter', fontSize: 12, fontWeight: '500', color: C.sub },
  sortChipTextActive: { color: C.accent, fontFamily: 'Inter', fontWeight: '600' },
  swipeHint: { fontFamily: 'Inter', fontSize: 11, fontWeight: '400', color: C.sub },

  listContent: { paddingBottom: 130 },

  swipeContainer: { marginHorizontal: 20, marginBottom: 10, borderRadius: 14, overflow: 'hidden' },
  deleteAction: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 100,
    backgroundColor: C.danger,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: { alignItems: 'center', gap: 4 },
  deleteBtnText: { fontFamily: 'Inter', fontSize: 11, fontWeight: '600', color: '#fff' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: C.border,
    gap: 10,
  },
  rowActive: { borderColor: C.accent, backgroundColor: C.accentDim },
  rowIdx: { fontFamily: 'Inter', fontSize: 11, fontWeight: '600', color: C.sub, width: 22, textAlign: 'center' },
  rowThumb: { width: 52, height: 52, borderRadius: 10, backgroundColor: C.card, overflow: 'hidden' },
  thumbPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  activeOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowInfo: { flex: 1 },
  rowTitle: { fontFamily: 'Inter', fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 5 },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  rowOwner: { fontFamily: 'Inter', fontSize: 11, fontWeight: '400', color: C.sub },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  chipText: { fontFamily: 'Inter', fontSize: 10, fontWeight: '400', color: C.sub },
  badge: { paddingHorizontal: 7, paddingVertical: 2, backgroundColor: C.accentDim, borderRadius: 6 },
  badgeText: { fontFamily: 'Inter', fontSize: 10, fontWeight: '500', color: C.accent },
  playBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },

  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 40, gap: 12 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.heartDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontFamily: 'Inter', fontSize: 16, fontWeight: '600', color: C.text, textAlign: 'center' },
  emptySub: { fontFamily: 'Inter', fontSize: 13, fontWeight: '400', color: C.sub, textAlign: 'center', lineHeight: 20 },
});

export default Favorites;
