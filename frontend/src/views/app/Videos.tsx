import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Pressable,
  ActivityIndicator,
  Dimensions,
  TextInput,
  Animated,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@react-native-vector-icons/fontawesome5';
import LinearGradient from 'react-native-linear-gradient';
import { getLatestMusic, Audio } from '@api/music';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

const C = {
  bg: '#080912',
  surface: '#121421',
  card: '#1A1D2E',
  border: 'rgba(255,255,255,0.06)',
  text: '#FFFFFF',
  sub: '#94A3B8',
  accent: '#7C3AED',
  accentDim: 'rgba(124, 58, 237, 0.1)',
  red: '#EF4444',
  gold: '#F59E0B',
};

const FILTERS = [
  'Tất cả',
  'Mới nhất',
  'Phổ biến',
  'Pop',
  'Ballad',
  'Rap',
  'EDM',
];

const fmt = (s?: number) => {
  if (!s || isNaN(s)) return '0:00';
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};

const getPoster = (audio: Audio): string =>
  typeof audio.poster === 'string'
    ? audio.poster
    : (audio.poster as any)?.url ?? audio.image ?? '';

const VideoCard = ({
  audio,
  index,
  onPress,
}: {
  audio: Audio;
  index: number;
  onPress: () => void;
}) => {
  const poster = getPoster(audio);

  return (
    <Pressable style={s.card} onPress={onPress}>
      <View style={s.thumbWrap}>
        {poster ? (
          <Image source={{ uri: poster }} style={s.thumb} resizeMode="cover" />
        ) : (
          <View style={[s.thumb, s.thumbEmpty]}>
            <FontAwesome5
              name="film"
              iconStyle="solid"
              size={32}
              color={C.border}
            />
          </View>
        )}
        <View style={s.thumbOverlay} />
        <View style={s.playCircle}>
          <FontAwesome5 name="play" iconStyle="solid" size={14} color="#fff" />
        </View>
        {audio.duration ? (
          <View style={s.durationBadge}>
            <Text style={s.durationText}>{fmt(audio.duration)}</Text>
          </View>
        ) : null}
      </View>

      <View style={s.cardBody}>
        <View style={s.cardInfo}>
          <Text style={s.cardTitle} numberOfLines={1}>
            {audio.title}
          </Text>
          <View style={s.cardMeta}>
            <Text style={s.cardArtist} numberOfLines={1}>
              {audio.about || 'SonicX'}
            </Text>
            {audio.category && (
              <Text style={s.catText}>• {audio.category}</Text>
            )}
          </View>
        </View>
        <View style={s.cardStats}>
          <View style={s.statItem}>
            <FontAwesome5 name="eye" iconStyle="solid" size={10} color={C.sub} />
            <Text style={s.statText}>
              {((audio.likes?.length ?? 0) * 137 + index * 42).toLocaleString()}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const Videos = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<Audio[]>([]);
  const [filtered, setFiltered] = useState<Audio[]>([]);
  const [activeFilter, setActiveFilter] = useState('Tất cả');
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const loadVideos = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getLatestMusic();
      const list = res.data.audio ?? [];
      setVideos(list);
      setFiltered(list);
    } catch {
      Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Không thể tải video' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  const applyFilter = (filter: string, query: string, list: Audio[]) => {
    let result = [...list];
    if (filter !== 'Tất cả' && filter !== 'Mới nhất' && filter !== 'Phổ biến') {
      result = result.filter(
        a => a.category?.toLowerCase() === filter.toLowerCase(),
      );
    }
    if (filter === 'Phổ biến') {
      result.sort((a, b) => (b.likes?.length ?? 0) - (a.likes?.length ?? 0));
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        a =>
          a.title.toLowerCase().includes(q) ||
          a.about?.toLowerCase().includes(q),
      );
    }
    setFiltered(result);
  };

  const handleFilter = (f: string) => {
    setActiveFilter(f);
    applyFilter(f, search, videos);
  };

  const handleSearch = (q: string) => {
    setSearch(q);
    applyFilter(activeFilter, q, videos);
  };

  const featuredVideo = filtered[0];
  const restVideos = filtered.slice(1);

  if (loading) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <ActivityIndicator
          size="large"
          color={C.accent}
          style={{ marginTop: 100 }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <View style={s.headerTop}>
          <View>
            <Text style={s.headerEyebrow}>DISCOVER</Text>
            <Text style={s.headerTitle}>Videos</Text>
          </View>
          <Pressable style={s.iconBtn} onPress={loadVideos}>
            <FontAwesome5
              name="sync-alt"
              iconStyle="solid"
              size={14}
              color={C.text}
            />
          </Pressable>
        </View>

        <View
          style={[
            s.searchBar,
            searchFocused && { borderColor: C.accent, backgroundColor: C.card },
          ]}
        >
          <FontAwesome5 name="search" iconStyle="solid" size={14} color={C.sub} />
          <TextInput
            style={s.searchInput}
            placeholder="Tìm kiếm video..."
            placeholderTextColor={C.sub}
            value={search}
            onChangeText={handleSearch}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </View>
      </View>

      <FlatList
        data={restVideos}
        keyExtractor={item => String(item._id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.listContent}
        ListHeaderComponent={
          <View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={s.filterScroll}
              contentContainerStyle={s.filterContent}
            >
              {FILTERS.map(item => (
                <Pressable
                  key={item}
                  style={[
                    s.filterChip,
                    activeFilter === item && s.filterChipActive,
                  ]}
                  onPress={() => handleFilter(item)}
                >
                  <Text
                    style={[
                      s.filterChipText,
                      activeFilter === item && s.filterChipTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {featuredVideo && (
              <View style={s.featuredSection}>
                <Pressable
                  style={s.featuredCard}
                  onPress={() =>
                    navigation.navigate('MusicPlayer', { audio: featuredVideo })
                  }
                >
                  <View style={s.featuredThumbWrap}>
                    <Image
                      source={{ uri: getPoster(featuredVideo) }}
                      style={s.featuredThumb}
                    />
                    <LinearGradient
                      colors={['transparent', 'rgba(8,9,18,0.8)', C.bg]}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={s.featuredInfo}>
                      <View style={s.featuredBadge}>
                        <Text style={s.featuredBadgeText}>FEATURED</Text>
                      </View>
                      <Text style={s.featuredTitle} numberOfLines={2}>
                        {featuredVideo.title}
                      </Text>
                      <Text style={s.featuredArtist}>
                        {featuredVideo.about || 'SonicX'}
                      </Text>
                    </View>
                    <View style={s.featuredPlay}>
                      <FontAwesome5
                        name="play"
                        iconStyle="solid"
                        size={20}
                        color="#fff"
                      />
                    </View>
                  </View>
                </Pressable>
              </View>
            )}

            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Tất cả video</Text>
            </View>
          </View>
        }
        renderItem={({ item, index }) => (
          <VideoCard
            audio={item}
            index={index}
            onPress={() => navigation.navigate('MusicPlayer', { audio: item })}
          />
        )}
      />
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 24, paddingTop: 12, marginBottom: 20 },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerEyebrow: {
    fontSize: 12,
    fontWeight: '900',
    color: C.accent,
    letterSpacing: 2,
  },
  headerTitle: { fontSize: 32, fontWeight: '900', color: C.text },
  iconBtn: {
    width: 40,
    height: 40,
    backgroundColor: C.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    paddingHorizontal: 16,
    height: 52,
    gap: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  searchInput: { flex: 1, color: C.text, fontSize: 15 },

  filterScroll: { marginBottom: 24 },
  filterContent: { paddingHorizontal: 24, gap: 10 },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  filterChipActive: { backgroundColor: C.accent, borderColor: C.accent },
  filterChipText: { fontSize: 13, fontWeight: '800', color: C.sub },
  filterChipTextActive: { color: '#fff' },

  featuredSection: { marginBottom: 32 },
  featuredCard: { width: '100%', height: 260 },
  featuredThumbWrap: { width: '100%', height: '100%', position: 'relative' },
  featuredThumb: { width: '100%', height: '100%', opacity: 0.7 },
  featuredInfo: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 80,
    zIndex: 2,
  },
  featuredBadge: {
    backgroundColor: C.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  featuredBadgeText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  featuredTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    lineHeight: 28,
    marginBottom: 6,
  },
  featuredArtist: { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  featuredPlay: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    backgroundColor: C.accent,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },

  sectionHeader: { paddingHorizontal: 24, marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: C.text },

  listContent: { paddingBottom: 120 },
  card: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 20,
    gap: 16,
  },
  thumbWrap: { width: 120, height: 80, position: 'relative' },
  thumb: { width: '100%', height: '100%', backgroundColor: C.surface },
  thumbEmpty: { justifyContent: 'center', alignItems: 'center' },
  thumbOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  playCircle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 36,
    height: 36,
    marginTop: -18,
    marginLeft: -18,
    backgroundColor: C.accent,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  durationText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  cardBody: { flex: 1, justifyContent: 'center' },
  cardInfo: { marginBottom: 6 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: C.text },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardArtist: { fontSize: 13, color: C.sub, fontWeight: '600' },
  catText: { fontSize: 13, color: C.sub, fontWeight: '600' },
  cardStats: { flexDirection: 'row', gap: 12 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 11, color: C.sub, fontWeight: '600' },
});

export default Videos;
