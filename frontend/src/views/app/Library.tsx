import React, { useEffect, useState, useRef, useCallback } from 'react';
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
import { getLatestMusic, Audio } from '@api/music';
import { usePlayer } from '../../context/PlayerContext';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

const C = {
  bg: '#080912',
  surface: '#121421',
  card: '#1A1D2E',
  border: 'rgba(255, 255, 255, 0.06)',
  text: '#FFFFFF',
  sub: '#94A3B8',
  accent: '#8B5CF6',
  accentGradient: ['#8B5CF6', '#DB2777'],
  heart: '#FF5370',
};

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
  const anims = useRef([0, 1, 2].map(() => new Animated.Value(0.3))).current;

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
  }, [playing, anims]);

  const barW = Math.max(2, size * 0.18);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: barW * 0.8,
        height: size,
      }}
    >
      {anims.map((anim, i) => (
        <Animated.View
          key={i}
          style={{
            width: barW,
            height: size,
            backgroundColor: color,
            transform: [{ scaleY: anim }],
          }}
        />
      ))}
    </View>
  );
};

type SortKey = 'newest' | 'title' | 'likes' | 'duration';
type ViewMode = 'list' | 'grid';

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
const SORT_OPTIONS: { key: SortKey; label: string; icon: string }[] = [
  { key: 'newest', label: 'Mới nhất', icon: 'clock' },
  { key: 'title', label: 'Tên A–Z', icon: 'sort-alpha-down' },
  { key: 'likes', label: 'Yêu thích', icon: 'fire' },
  { key: 'duration', label: 'Thời lượng', icon: 'hourglass-half' },
];

const GridItem = ({
  audio,
  onPress,
  isPlaying,
  isActive,
}: {
  audio: Audio;
  onPress: () => void;
  isPlaying: boolean;
  isActive: boolean;
}) => {
  const poster =
    typeof audio.poster === 'string'
      ? audio.poster
      : (audio.poster as any)?.url ?? audio.image ?? '';
  return (
    <Pressable style={s.gridCard} onPress={onPress}>
      <View style={s.gridImgWrap}>
        <Image source={{ uri: poster }} style={s.gridImg} />
        {isActive && (
          <View style={s.gridOverlay}>
            <MusicBars size={20} playing={isPlaying} color="#fff" />
          </View>
        )}
      </View>
      <View style={s.gridInfo}>
        <Text
          style={[s.gridTitle, isActive && { color: C.accent }]}
          numberOfLines={1}
        >
          {audio.title}
        </Text>
        <Text style={s.gridSub} numberOfLines={1}>
          {audio.about || 'SonicX'}
        </Text>
      </View>
    </Pressable>
  );
};

const ListItem = ({
  audio,
  onPress,
  isPlaying,
  isActive,
}: {
  audio: Audio;
  onPress: () => void;
  isPlaying: boolean;
  isActive: boolean;
}) => {
  const poster =
    typeof audio.poster === 'string'
      ? audio.poster
      : (audio.poster as any)?.url ?? audio.image ?? '';
  return (
    <Pressable style={s.listItem} onPress={onPress}>
      <View style={s.listImgWrap}>
        <Image source={{ uri: poster }} style={s.listImg} />
        {isActive && (
          <View style={s.listOverlay}>
            <MusicBars size={12} playing={isPlaying} color="#fff" />
          </View>
        )}
      </View>
      <View style={s.listInfo}>
        <Text
          style={[s.listTitle, isActive && { color: C.accent }]}
          numberOfLines={1}
        >
          {audio.title}
        </Text>
        <Text style={s.listSub} numberOfLines={1}>
          {audio.about || 'SonicX'}
        </Text>
      </View>
      <View style={s.listActions}>
        <FontAwesome5
          name="ellipsis-v"
          iconStyle="solid"
          size={12}
          color={C.sub}
        />
      </View>
    </Pressable>
  );
};

const Library = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [musics, setMusics] = useState<Audio[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMusics, setFilteredMusics] = useState<Audio[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [showSort, setShowSort] = useState(false);
  const player = usePlayer();

  const loadMusics = useCallback(async () => {
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
  }, [sortKey]);

  useEffect(() => {
    loadMusics();
  }, [loadMusics]);

  useEffect(() => {
    applyFilters(musics, searchQuery, activeCategory, sortKey);
  }, [sortKey, activeCategory, searchQuery, musics]);

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

  const handlePlay = (audio: Audio) => {
    player.play(audio);
    navigation.navigate('MusicPlayer', { audio });
  };

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <View style={s.header}>
        <View>
          <Text style={s.headerEyebrow}>THƯ VIỆN</Text>
          <Text style={s.headerTitle}>Bộ sưu tập</Text>
        </View>
        <View style={s.headerActions}>
          <Pressable
            style={s.iconBtn}
            onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
          >
            <FontAwesome5
              name={viewMode === 'list' ? 'th-large' : 'list'}
              iconStyle="solid"
              size={16}
              color={C.text}
            />
          </Pressable>
          <Pressable style={s.iconBtn} onPress={() => setShowSort(true)}>
            <FontAwesome5
              name="sort-amount-down"
              iconStyle="solid"
              size={16}
              color={C.text}
            />
          </Pressable>
        </View>
      </View>

      <View style={s.topControls}>
        <View style={s.searchBox}>
          <FontAwesome5
            name="search"
            iconStyle="solid"
            size={14}
            color={C.sub}
          />
          <TextInput
            style={s.searchInput}
            placeholder="Tìm kiếm trong thư viện..."
            placeholderTextColor={C.sub}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
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
              onPress={() => setActiveCategory(cat)}
            >
              <Text
                style={[s.catText, activeCategory === cat && s.catTextActive]}
              >
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator color={C.accent} style={s.loader} />
      ) : (
        <FlatList
          data={filteredMusics}
          keyExtractor={(item, index) => item._id || index.toString()}
          renderItem={({ item }) =>
            viewMode === 'grid' ? (
              <GridItem
                audio={item}
                onPress={() => handlePlay(item)}
                isPlaying={player.isPlaying}
                isActive={player.currentAudio?._id === item._id}
              />
            ) : (
              <ListItem
                audio={item}
                onPress={() => handlePlay(item)}
                isPlaying={player.isPlaying}
                isActive={player.currentAudio?._id === item._id}
              />
            )
          }
          numColumns={viewMode === 'grid' ? 2 : 1}
          key={viewMode}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.empty}>
              <FontAwesome5
                name="music"
                iconStyle="solid"
                size={40}
                color={C.border}
              />
              <Text style={s.emptyText}>Không tìm thấy bài hát nào</Text>
            </View>
          }
        />
      )}

      <Modal transparent visible={showSort} animationType="slide">
        <Pressable style={s.overlay} onPress={() => setShowSort(false)}>
          <View style={s.sheet}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>Sắp xếp theo</Text>
            <View style={s.sheetGrid}>
              {SORT_OPTIONS.map(opt => (
                <Pressable
                  key={opt.key}
                  style={[
                    s.sheetCard,
                    sortKey === opt.key && s.sheetCardActive,
                  ]}
                  onPress={() => {
                    setSortKey(opt.key);
                    setShowSort(false);
                  }}
                >
                  <View
                    style={[
                      s.sheetIconWrap,
                      sortKey === opt.key && s.sheetIconActive,
                    ]}
                  >
                    <FontAwesome5
                      name={opt.icon as any}
                      iconStyle="solid"
                      size={18}
                      color={sortKey === opt.key ? '#fff' : C.sub}
                    />
                  </View>
                  <Text
                    style={[
                      s.sheetLabel,
                      sortKey === opt.key && { color: C.accent },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: C.accent,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: C.text,
    letterSpacing: -0.5,
  },
  headerActions: { flexDirection: 'row', gap: 12 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  topControls: { gap: 20, marginBottom: 8 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    height: 54,
    marginHorizontal: 20,
    paddingHorizontal: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  searchInput: { flex: 1, color: C.text, fontSize: 15, fontWeight: '500' },
  catScroll: { maxHeight: 42 },
  catContent: { paddingHorizontal: 20, gap: 10 },
  catChip: {
    paddingHorizontal: 20,
    height: 40,
    justifyContent: 'center',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  catChipActive: { backgroundColor: C.accent, borderColor: C.accent },
  catText: { fontSize: 14, fontWeight: '700', color: C.sub },
  catTextActive: { color: '#fff' },
  listContent: { paddingBottom: 140 },
  gridCard: {
    width: width / 2,
    backgroundColor: C.card,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  gridImgWrap: { width: '100%', aspectRatio: 1, backgroundColor: C.surface },
  gridImg: { width: '100%', height: '100%' },
  gridOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridInfo: { padding: 16, gap: 4 },
  gridTitle: { fontSize: 15, fontWeight: '800', color: C.text },
  gridSub: { fontSize: 13, color: C.sub, fontWeight: '600' },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  listImgWrap: { width: 64, height: 64, backgroundColor: C.surface },
  listImg: { width: '100%', height: '100%' },
  listOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listInfo: { flex: 1, gap: 4 },
  listTitle: { fontSize: 16, fontWeight: '800', color: C.text },
  listSub: { fontSize: 14, color: C.sub, fontWeight: '600' },
  listActions: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: { marginTop: 40 },
  empty: { alignItems: 'center', marginTop: 100, gap: 20 },
  emptyText: { fontSize: 15, color: C.sub, fontWeight: '600' },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    padding: 24,
    paddingBottom: 50,
    gap: 24,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    alignSelf: 'center',
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: C.text,
    textAlign: 'left',
  },
  sheetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  sheetCard: {
    width: (width - 48 - 12) / 2,
    backgroundColor: C.card,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  sheetCardActive: {
    borderColor: C.accent,
    backgroundColor: 'rgba(124,58,237,0.05)',
  },
  sheetIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetIconActive: { backgroundColor: C.accent },
  sheetLabel: { fontSize: 14, fontWeight: '800', color: C.sub },
});

export default Library;
