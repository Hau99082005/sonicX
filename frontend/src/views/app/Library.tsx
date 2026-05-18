import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  FlatList,
  ActivityIndicator,
  TextInput,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@react-native-vector-icons/fontawesome5';
import { getLatestMusic, searchMusic, toggleFavorite, Audio } from '@api/music';
import { usePlayer } from '../../context/PlayerContext';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 52) / 2;

const C = {
  bg: '#0D0F1E',
  surface: '#161829',
  card: '#1C1F35',
  border: '#1E2140',
  text: '#FFFFFF',
  sub: '#8A8FAD',
  accent: '#6C63FF',
  accentDim: 'rgba(108,99,255,0.12)',
  accentGlow: 'rgba(108,99,255,0.25)',
  heart: '#FF5370',
  gold: '#F59E0B',
  green: '#10B981',
};

const BAR_HEIGHTS = [10, 16, 12];
const BAR_DELAYS = [0, 150, 80];
const BAR_DURATIONS = [500, 380, 460];

const MusicBars = ({
  color = C.accent,
  size = 14,
  playing = true,
}: {
  color?: string;
  size?: number;
  playing?: boolean;
}) => {
  const anims = useRef(BAR_HEIGHTS.map(() => new Animated.Value(0.3))).current;

  useEffect(() => {
    if (!playing) {
      anims.forEach(a =>
        Animated.timing(a, {
          toValue: 0.3,
          duration: 200,
          useNativeDriver: true,
        }).start(),
      );
      return;
    }
    const loops = anims.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(BAR_DELAYS[i]),
          Animated.timing(anim, {
            toValue: 1,
            duration: BAR_DURATIONS[i],
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.2,
            duration: BAR_DURATIONS[i],
            useNativeDriver: true,
          }),
        ]),
      ),
    );
    loops.forEach(l => l.start());
    return () => loops.forEach(l => l.stop());
  }, [playing]);

  const barWidth = size * 0.18;
  const maxH = size;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: barWidth * 0.8,
        height: maxH,
      }}
    >
      {anims.map((anim, i) => (
        <Animated.View
          key={i}
          style={{
            width: barWidth + 1,
            height: maxH,
            borderRadius: 2,
            backgroundColor: color,
            transform: [{ scaleY: anim }],
            transformOrigin: 'bottom',
          }}
        />
      ))}
    </View>
  );
};

type SortKey = 'newest' | 'title' | 'likes' | 'duration';
type ViewMode = 'list' | 'grid';

const fmt = (s?: number) => {
  if (!s || isNaN(s)) return '';
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};

const SORT_OPTIONS: { key: SortKey; label: string; icon: any }[] = [
  { key: 'newest', label: 'Mới nhất', icon: 'clock' },
  { key: 'title', label: 'Tên A–Z', icon: 'sort-alpha-down' },
  { key: 'likes', label: 'Yêu thích nhất', icon: 'fire' },
  { key: 'duration', label: 'Thời lượng', icon: 'hourglass-half' },
];

const CATEGORIES = [
  'Tất cả',
  'Pop',
  'Ballad',
  'Rap',
  'EDM',
  'R&B',
  'Rock',
  'Indie',
];

const Library = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [musics, setMusics] = useState<Audio[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMusics, setFilteredMusics] = useState<Audio[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [showSort, setShowSort] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [searchFocused, setSearchFocused] = useState(false);
  const player = usePlayer();

  const searchAnim = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    loadMusics();
  }, []);

  useEffect(() => {
    Animated.timing(searchAnim, {
      toValue: searchFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [searchFocused]);

  useEffect(() => {
    applyFilters(musics, searchQuery, activeCategory, sortKey);
  }, [sortKey, activeCategory]);

  const loadMusics = async () => {
    try {
      setLoading(true);
      const res = await getLatestMusic();
      const list = res.data.audio ?? [];
      setMusics(list);
      applyFilters(list, '', 'Tất cả', sortKey);
    } catch {
      Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Không thể tải nhạc' });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (
    list: Audio[],
    query: string,
    cat: string,
    sort: SortKey,
  ) => {
    let result = [...list];
    if (cat !== 'Tất cả') {
      result = result.filter(
        a => a.category?.toLowerCase() === cat.toLowerCase(),
      );
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        a =>
          a.title.toLowerCase().includes(q) ||
          a.about?.toLowerCase().includes(q),
      );
    }
    if (sort === 'title') result.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === 'likes')
      result.sort((a, b) => (b.likes?.length ?? 0) - (a.likes?.length ?? 0));
    else if (sort === 'duration')
      result.sort((a, b) => (b.duration ?? 0) - (a.duration ?? 0));
    setFilteredMusics(result);
  };

  const handleSearch = useCallback(
    async (q: string) => {
      setSearchQuery(q);
      if (!q.trim()) {
        applyFilters(musics, '', activeCategory, sortKey);
        return;
      }
      try {
        const res = await searchMusic(q);
        setFilteredMusics(res.data.audios ?? []);
      } catch {
        applyFilters(musics, q, activeCategory, sortKey);
      }
    },
    [musics, activeCategory, sortKey],
  );

  const handleToggleFavorite = useCallback(async (audio: Audio) => {
    try {
      const res = await toggleFavorite(audio._id);
      setFavorites(prev => {
        const next = new Set(prev);
        if (res.data.status === 'added') next.add(audio._id);
        else next.delete(audio._id);
        return next;
      });
    } catch {}
  }, []);

  const handlePlay = (audio: Audio) => {
    navigation.navigate('MusicPlayer', { audio });
  };

  const posterUrl = (audio: Audio) =>
    typeof audio.poster === 'string'
      ? audio.poster
      : (audio.poster as any)?.url ?? audio.image ?? '';

  const searchBorder = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [C.border, C.accent],
  });

  const SortModal = () => (
    <Modal
      transparent
      animationType="slide"
      visible={showSort}
      onRequestClose={() => setShowSort(false)}
    >
      <Pressable style={s.overlay} onPress={() => setShowSort(false)}>
        <View style={s.sheet}>
          <View style={s.sheetHandle} />
          <Text style={s.sheetTitle}>Sắp xếp theo</Text>
          {SORT_OPTIONS.map(opt => (
            <Pressable
              key={opt.key}
              style={[s.sheetRow, sortKey === opt.key && s.sheetRowActive]}
              onPress={() => {
                setSortKey(opt.key);
                setShowSort(false);
              }}
            >
              <View
                style={[
                  s.sheetIconWrap,
                  sortKey === opt.key && s.sheetIconWrapActive,
                ]}
              >
                <FontAwesome5
                  name={opt.icon}
                  iconStyle="solid"
                  size={13}
                  color={sortKey === opt.key ? C.accent : C.sub}
                />
              </View>
              <Text
                style={[
                  s.sheetLabel,
                  sortKey === opt.key && {
                    color: C.text,
                    fontFamily: 'Inter-SemiBold',
                  },
                ]}
              >
                {opt.label}
              </Text>
              {sortKey === opt.key && (
                <View style={s.sheetCheck}>
                  <FontAwesome5
                    name="check"
                    iconStyle="solid"
                    size={10}
                    color={C.accent}
                  />
                </View>
              )}
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  );

  const GridItem = ({ audio }: { audio: Audio }) => {
    const url = posterUrl(audio);
    const isFav = favorites.has(audio._id);
    const isActive = player.currentAudio?._id === audio._id;
    return (
      <Pressable style={s.gridItem} onPress={() => handlePlay(audio)}>
        <View style={[s.gridThumb, isActive && s.gridThumbActive]}>
          {url ? (
            <Image source={{ uri: url }} style={StyleSheet.absoluteFill} />
          ) : (
            <View style={s.thumbPlaceholder}>
              <FontAwesome5
                name="music"
                iconStyle="solid"
                size={24}
                color={C.border}
              />
            </View>
          )}
          {isActive && (
            <View style={s.activeOverlay}>
              <View style={s.activeIndicator}>
                <MusicBars
                  color={C.accent}
                  size={18}
                  playing={player.isPlaying}
                />
              </View>
            </View>
          )}
          <Pressable
            style={s.favPill}
            onPress={() => handleToggleFavorite(audio)}
            hitSlop={8}
          >
            <FontAwesome5
              name="heart"
              iconStyle={isFav ? 'solid' : 'regular'}
              size={11}
              color={isFav ? C.heart : '#fff'}
            />
          </Pressable>
        </View>
        <Text style={s.gridTitle} numberOfLines={2}>
          {audio.title}
        </Text>
        {audio.category && (
          <Text style={s.gridSub} numberOfLines={1}>
            {audio.category}
          </Text>
        )}
      </Pressable>
    );
  };

  const ListItem = ({ audio, index }: { audio: Audio; index: number }) => {
    const url = posterUrl(audio);
    const isFav = favorites.has(audio._id);
    const isActive = player.currentAudio?._id === audio._id;
    return (
      <Pressable
        style={[s.row, isActive && s.rowActive]}
        onPress={() => handlePlay(audio)}
      >
        <Text style={s.rowIdx}>{String(index + 1).padStart(2, '0')}</Text>
        <View style={s.rowThumb}>
          {url ? (
            <Image
              source={{ uri: url }}
              style={StyleSheet.absoluteFill}
              borderRadius={10}
            />
          ) : (
            <View style={s.thumbPlaceholder}>
              <FontAwesome5
                name="music"
                iconStyle="solid"
                size={14}
                color={C.border}
              />
            </View>
          )}
          {isActive && (
            <View style={s.activeOverlay}>
              <MusicBars
                color={C.accent}
                size={14}
                playing={player.isPlaying}
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
          <View style={s.rowMeta}>
            {audio.category && (
              <View style={s.badge}>
                <Text style={s.badgeText}>{audio.category}</Text>
              </View>
            )}
            {audio.likes && audio.likes.length > 0 && (
              <View style={s.chip}>
                <FontAwesome5
                  name="heart"
                  iconStyle="solid"
                  size={8}
                  color={C.heart}
                />
                <Text style={s.chipText}>{audio.likes.length}</Text>
              </View>
            )}
            {!!audio.duration && (
              <View style={s.chip}>
                <FontAwesome5
                  name="clock"
                  iconStyle="regular"
                  size={8}
                  color={C.sub}
                />
                <Text style={s.chipText}>{fmt(audio.duration)}</Text>
              </View>
            )}
          </View>
        </View>
        <Pressable
          onPress={() => handleToggleFavorite(audio)}
          hitSlop={12}
          style={s.rowAction}
        >
          <FontAwesome5
            name="heart"
            iconStyle={isFav ? 'solid' : 'regular'}
            size={15}
            color={isFav ? C.heart : C.sub}
          />
        </Pressable>
        <Pressable
          onPress={() => handlePlay(audio)}
          hitSlop={12}
          style={s.playBtn}
        >
          <FontAwesome5
            name={isActive && player.isPlaying ? 'pause' : 'play'}
            iconStyle="solid"
            size={11}
            color="#fff"
          />
        </Pressable>
      </Pressable>
    );
  };

  const ListHeader = () => (
    <View>
      <View style={s.statsRow}>
        <View style={[s.statCard, { borderColor: C.accentGlow }]}>
          <View style={[s.statIcon, { backgroundColor: C.accentDim }]}>
            <FontAwesome5
              name="music"
              iconStyle="solid"
              size={14}
              color={C.accent}
            />
          </View>
          <Text style={s.statNum}>{musics.length}</Text>
          <Text style={s.statLbl}>Bài hát</Text>
        </View>
        <View style={[s.statCard, { borderColor: 'rgba(255,83,112,0.2)' }]}>
          <View
            style={[s.statIcon, { backgroundColor: 'rgba(255,83,112,0.1)' }]}
          >
            <FontAwesome5
              name="heart"
              iconStyle="solid"
              size={14}
              color={C.heart}
            />
          </View>
          <Text style={s.statNum}>{favorites.size}</Text>
          <Text style={s.statLbl}>Yêu thích</Text>
        </View>
        <View style={[s.statCard, { borderColor: 'rgba(245,158,11,0.2)' }]}>
          <View
            style={[s.statIcon, { backgroundColor: 'rgba(245,158,11,0.1)' }]}
          >
            <FontAwesome5
              name="layer-group"
              iconStyle="solid"
              size={14}
              color={C.gold}
            />
          </View>
          <Text style={s.statNum}>
            {new Set(musics.map(a => a.category).filter(Boolean)).size}
          </Text>
          <Text style={s.statLbl}>Thể loại</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.catScroll}
        contentContainerStyle={s.catContent}
      >
        {CATEGORIES.map(cat => (
          <Pressable
            key={cat}
            style={[s.catChip, activeCategory === cat && s.catChipActive]}
            onPress={() => {
              setActiveCategory(cat);
              applyFilters(musics, searchQuery, cat, sortKey);
            }}
          >
            <Text
              style={[
                s.catChipText,
                activeCategory === cat && s.catChipTextActive,
              ]}
            >
              {cat}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={s.toolbar}>
        <Text style={s.toolbarCount}>
          <Text style={{ color: C.text, fontFamily: 'Inter-SemiBold' }}>
            {filteredMusics.length}
          </Text>
          {'  bài hát'}
        </Text>
        <View style={s.toolbarActions}>
          <Pressable style={s.toolBtn} onPress={() => setShowSort(true)}>
            <FontAwesome5
              name="sliders-h"
              iconStyle="solid"
              size={13}
              color={C.sub}
            />
          </Pressable>
          <Pressable
            style={[s.toolBtn, viewMode === 'grid' && s.toolBtnActive]}
            onPress={() => setViewMode(v => (v === 'list' ? 'grid' : 'list'))}
          >
            <FontAwesome5
              name={viewMode === 'grid' ? 'list' : 'th-large'}
              iconStyle="solid"
              size={13}
              color={viewMode === 'grid' ? C.accent : C.sub}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={C.accent} />
          <Text style={s.loadingText}>Đang tải thư viện...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <SortModal />

      <Animated.View
        style={[
          s.header,
          {
            opacity: headerAnim,
            transform: [
              {
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-16, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={s.headerTop}>
          <View>
            <Text style={s.headerEyebrow}>SonicX</Text>
            <Text style={s.headerTitle}>Thư viện nhạc</Text>
          </View>
          <Pressable style={s.iconBtn} onPress={loadMusics}>
            <FontAwesome5
              name="sync-alt"
              iconStyle="solid"
              size={15}
              color={C.sub}
            />
          </Pressable>
        </View>

        <Animated.View style={[s.searchBar, { borderColor: searchBorder }]}>
          <FontAwesome5
            name="search"
            iconStyle="solid"
            size={13}
            color={searchFocused ? C.accent : C.sub}
          />
          <TextInput
            style={s.searchInput}
            placeholder="Tìm tên bài hát, thể loại..."
            placeholderTextColor={C.sub}
            value={searchQuery}
            onChangeText={handleSearch}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => handleSearch('')} hitSlop={8}>
              <FontAwesome5
                name="times-circle"
                iconStyle="solid"
                size={13}
                color={C.sub}
              />
            </Pressable>
          )}
        </Animated.View>
      </Animated.View>

      {viewMode === 'grid' ? (
        <FlatList
          key="grid"
          data={filteredMusics}
          keyExtractor={item => item._id}
          numColumns={2}
          ListHeaderComponent={<ListHeader />}
          renderItem={({ item }) => <GridItem audio={item} />}
          contentContainerStyle={s.gridContent}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={s.gridRow}
          ListEmptyComponent={<EmptyState />}
        />
      ) : (
        <FlatList
          key="list"
          data={filteredMusics}
          keyExtractor={item => item._id}
          ListHeaderComponent={<ListHeader />}
          renderItem={({ item, index }) => (
            <ListItem audio={item} index={index} />
          )}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState />}
        />
      )}
    </SafeAreaView>
  );
};

const EmptyState = () => (
  <View style={s.emptyWrap}>
    <View style={s.emptyIcon}>
      <FontAwesome5
        name="compact-disc"
        iconStyle="solid"
        size={36}
        color={C.accent}
      />
    </View>
    <Text style={s.emptyTitle}>Không tìm thấy bài hát</Text>
    <Text style={s.emptySub}>Thử tìm kiếm với từ khóa khác</Text>
  </View>
);

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  header: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14 },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerEyebrow: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '500',
    color: C.accent,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  headerTitle: {
    fontFamily: 'Inter',
    fontSize: 26,
    fontWeight: '700',
    color: C.text,
    letterSpacing: -0.5,
  },
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

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '400',
    color: C.text,
    paddingVertical: 0,
  },

  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  loadingText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '400',
    color: C.sub,
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 36,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.border,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontFamily: 'Inter',
    fontSize: 17,
    fontWeight: '700',
    color: C.text,
    marginBottom: 8,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  sheetRowActive: { borderBottomColor: 'transparent' },
  sheetIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetIconWrapActive: { backgroundColor: C.accentDim },
  sheetLabel: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '400',
    color: C.sub,
    flex: 1,
  },
  sheetCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 16,
    gap: 6,
    borderWidth: 1,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNum: {
    fontFamily: 'Inter',
    fontSize: 20,
    fontWeight: '700',
    color: C.text,
  },
  statLbl: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '400',
    color: C.sub,
  },

  catScroll: { marginBottom: 16 },
  catContent: { gap: 8, paddingRight: 4 },
  catChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 22,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  catChipActive: { backgroundColor: C.accent, borderColor: C.accent },
  catChipText: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '500',
    color: C.sub,
  },
  catChipTextActive: { color: '#fff', fontFamily: 'Inter', fontWeight: '600' },

  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  toolbarCount: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '400',
    color: C.sub,
  },
  toolbarActions: { flexDirection: 'row', gap: 8 },
  toolBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolBtnActive: { backgroundColor: C.accentDim, borderColor: C.accent },

  listContent: { paddingHorizontal: 20, paddingBottom: 130 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 14,
    marginBottom: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: C.border,
    gap: 10,
  },
  rowActive: { borderColor: C.accent, backgroundColor: C.accentDim },
  rowIdx: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '600',
    color: C.sub,
    width: 22,
    textAlign: 'center',
  },
  rowThumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: C.card,
    overflow: 'hidden',
  },
  rowInfo: { flex: 1 },
  rowTitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
    marginBottom: 5,
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: C.accentDim,
    borderRadius: 6,
  },
  badgeText: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '500',
    color: C.accent,
  },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  chipText: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '400',
    color: C.sub,
  },
  rowAction: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
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

  gridContent: { paddingHorizontal: 16, paddingBottom: 130 },
  gridRow: { gap: 12, marginBottom: 12 },
  gridItem: { width: ITEM_WIDTH },
  gridThumb: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH,
    borderRadius: 14,
    backgroundColor: C.surface,
    overflow: 'hidden',
    marginBottom: 10,
  },
  gridThumbActive: { borderWidth: 2, borderColor: C.accent },
  activeOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favPill: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridTitle: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '600',
    color: C.text,
    marginBottom: 2,
  },
  gridSub: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '400',
    color: C.sub,
  },

  thumbPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 64,
    gap: 12,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: C.text,
  },
  emptySub: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '400',
    color: C.sub,
  },
});

export default Library;
