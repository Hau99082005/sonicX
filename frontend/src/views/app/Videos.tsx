import React, { useEffect, useRef, useState } from 'react';
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
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@react-native-vector-icons/fontawesome5';
import { getLatestMusic, Audio } from '@api/music';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;
const THUMB_HEIGHT = CARD_WIDTH * 0.56;

const C = {
  bg: '#0D0F1E',
  surface: '#161829',
  card: '#1C1F35',
  border: '#1E2140',
  text: '#FFFFFF',
  sub: '#8A8FAD',
  accent: '#6C63FF',
  accentDim: 'rgba(108,99,255,0.14)',
  red: '#EF4444',
  redDim: 'rgba(239,68,68,0.14)',
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
  if (!s || isNaN(s)) return '';
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
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 60,
      bounciness: 2,
    }).start();
  const onPressOut = () =>
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 60,
      bounciness: 4,
    }).start();

  return (
    <Animated.View style={[s.card, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <View style={s.thumbWrap}>
          {poster ? (
            <Image
              source={{ uri: poster }}
              style={s.thumb}
              resizeMode="cover"
            />
          ) : (
            <View style={[s.thumb, s.thumbEmpty]}>
              <FontAwesome5
                name="film"
                iconStyle="solid"
                size={36}
                color={C.border}
              />
            </View>
          )}
          <View style={s.thumbOverlay} />
          <View style={s.playCircle}>
            <FontAwesome5
              name="play"
              iconStyle="solid"
              size={18}
              color="#fff"
              style={{ marginLeft: 3 }}
            />
          </View>
          {audio.duration ? (
            <View style={s.durationBadge}>
              <Text style={s.durationText}>{fmt(audio.duration)}</Text>
            </View>
          ) : null}
          <View style={s.liveBadge}>
            <View style={s.liveDot} />
            <Text style={s.liveText}>MV</Text>
          </View>
        </View>

        <View style={s.cardBody}>
          <View style={s.cardLeft}>
            <View style={s.avatarSmall}>
              {poster ? (
                <Image
                  source={{ uri: poster }}
                  style={StyleSheet.absoluteFill}
                  borderRadius={16}
                />
              ) : (
                <FontAwesome5
                  name="user"
                  iconStyle="solid"
                  size={10}
                  color={C.sub}
                />
              )}
            </View>
          </View>
          <View style={s.cardInfo}>
            <Text style={s.cardTitle} numberOfLines={2}>
              {audio.title}
            </Text>
            <View style={s.cardMeta}>
              <Text style={s.cardArtist} numberOfLines={1}>
                {audio.about || 'SonicX'}
              </Text>
              {audio.category ? (
                <>
                  <View style={s.metaDot} />
                  <View style={s.catBadge}>
                    <Text style={s.catBadgeText}>{audio.category}</Text>
                  </View>
                </>
              ) : null}
            </View>
            <View style={s.cardStats}>
              <View style={s.statChip}>
                <FontAwesome5
                  name="eye"
                  iconStyle="solid"
                  size={9}
                  color={C.sub}
                />
                <Text style={s.statChipText}>
                  {(
                    (audio.likes?.length ?? 0) * 137 +
                    index * 2341
                  ).toLocaleString()}
                </Text>
              </View>
              <View style={s.statChip}>
                <FontAwesome5
                  name="heart"
                  iconStyle="solid"
                  size={9}
                  color={C.sub}
                />
                <Text style={s.statChipText}>{audio.likes?.length ?? 0}</Text>
              </View>
            </View>
          </View>
          <Pressable style={s.moreBtn} hitSlop={10}>
            <FontAwesome5
              name="ellipsis-v"
              iconStyle="solid"
              size={13}
              color={C.sub}
            />
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const Videos = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<Audio[]>([]);
  const [filtered, setFiltered] = useState<Audio[]>([]);
  const [activeFilter, setActiveFilter] = useState('Tất cả');
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const headerAnim = useRef(new Animated.Value(0)).current;
  const searchBorderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    loadVideos();
  }, []);

  useEffect(() => {
    Animated.timing(searchBorderAnim, {
      toValue: searchFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [searchFocused]);

  const loadVideos = async () => {
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
  };

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

  const searchBorder = searchBorderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [C.border, C.accent],
  });

  const featuredVideo = filtered[0];
  const restVideos = filtered.slice(1);

  if (loading) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={C.accent} />
          <Text style={s.loadingText}>Đang tải video...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
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
            <Text style={s.headerTitle}>Video nhạc</Text>
          </View>
          <Pressable style={s.iconBtn} onPress={loadVideos}>
            <FontAwesome5
              name="sync-alt"
              iconStyle="solid"
              size={14}
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
            placeholder="Tìm video, nghệ sĩ..."
            placeholderTextColor={C.sub}
            value={search}
            onChangeText={handleSearch}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            returnKeyType="search"
          />
          {search.length > 0 && (
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

      <FlatList
        data={restVideos}
        keyExtractor={item => String(item._id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.listContent}
        ListHeaderComponent={
          <View>
            <FlatList
              data={FILTERS}
              keyExtractor={item => item}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={s.filterScroll}
              contentContainerStyle={s.filterContent}
              renderItem={({ item }) => (
                <Pressable
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
              )}
            />

            {featuredVideo && (
              <View style={s.featuredWrap}>
                <View style={s.featuredLabel}>
                  <View style={s.featuredDot} />
                  <Text style={s.featuredLabelText}>NỔI BẬT</Text>
                </View>
                <Pressable
                  style={s.featuredCard}
                  onPress={() =>
                    navigation.navigate('MusicPlayer', { audio: featuredVideo })
                  }
                >
                  <View style={s.featuredThumbWrap}>
                    {getPoster(featuredVideo) ? (
                      <Image
                        source={{ uri: getPoster(featuredVideo) }}
                        style={s.featuredThumb}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[s.featuredThumb, s.thumbEmpty]}>
                        <FontAwesome5
                          name="film"
                          iconStyle="solid"
                          size={48}
                          color={C.border}
                        />
                      </View>
                    )}
                    <View style={s.featuredOverlay} />
                    <View style={s.featuredPlayBtn}>
                      <FontAwesome5
                        name="play"
                        iconStyle="solid"
                        size={22}
                        color="#fff"
                        style={{ marginLeft: 3 }}
                      />
                    </View>
                    {featuredVideo.duration ? (
                      <View style={s.durationBadge}>
                        <Text style={s.durationText}>
                          {fmt(featuredVideo.duration)}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={s.featuredBody}>
                    <Text style={s.featuredTitle} numberOfLines={2}>
                      {featuredVideo.title}
                    </Text>
                    <Text style={s.featuredArtist} numberOfLines={1}>
                      {featuredVideo.about || 'SonicX'}
                    </Text>
                    <View style={s.featuredStats}>
                      <View style={s.statChip}>
                        <FontAwesome5
                          name="eye"
                          iconStyle="solid"
                          size={10}
                          color={C.sub}
                        />
                        <Text style={s.statChipText}>
                          {(
                            (featuredVideo.likes?.length ?? 0) * 137 +
                            2341
                          ).toLocaleString()}{' '}
                          lượt xem
                        </Text>
                      </View>
                      <View style={s.statChip}>
                        <FontAwesome5
                          name="heart"
                          iconStyle="solid"
                          size={10}
                          color={C.sub}
                        />
                        <Text style={s.statChipText}>
                          {featuredVideo.likes?.length ?? 0}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              </View>
            )}

            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Tất cả video</Text>
              <Text style={s.sectionCount}>{filtered.length} video</Text>
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
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <View style={s.emptyIcon}>
              <FontAwesome5
                name="film"
                iconStyle="solid"
                size={32}
                color={C.accent}
              />
            </View>
            <Text style={s.emptyTitle}>Không tìm thấy video</Text>
            <Text style={s.emptySub}>Thử tìm kiếm với từ khóa khác</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  loadingText: { fontFamily: 'Inter', fontSize: 14, color: C.sub },

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
    color: C.text,
    paddingVertical: 0,
  },

  filterScroll: { marginBottom: 20 },
  filterContent: { gap: 8, paddingRight: 4 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 22,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  filterChipActive: { backgroundColor: C.accent, borderColor: C.accent },
  filterChipText: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '500',
    color: C.sub,
  },
  filterChipTextActive: { color: '#fff', fontWeight: '600' },

  featuredWrap: { marginBottom: 24 },
  featuredLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  featuredDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.red },
  featuredLabelText: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '700',
    color: C.red,
    letterSpacing: 1.2,
  },
  featuredCard: {
    backgroundColor: C.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  featuredThumbWrap: { width: '100%', height: THUMB_HEIGHT + 20 },
  featuredThumb: { width: '100%', height: '100%' },
  featuredOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  featuredPlayBtn: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  featuredBody: { padding: 16 },
  featuredTitle: {
    fontFamily: 'Inter',
    fontSize: 17,
    fontWeight: '700',
    color: C.text,
    marginBottom: 4,
    lineHeight: 24,
  },
  featuredArtist: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: C.sub,
    marginBottom: 10,
  },
  featuredStats: { flexDirection: 'row', gap: 14 },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: 'Inter',
    fontSize: 17,
    fontWeight: '700',
    color: C.text,
  },
  sectionCount: { fontFamily: 'Inter', fontSize: 13, color: C.sub },

  listContent: { paddingHorizontal: 20, paddingBottom: 130 },

  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 16,
    overflow: 'hidden',
  },
  thumbWrap: { width: '100%', height: THUMB_HEIGHT, position: 'relative' },
  thumb: { width: '100%', height: '100%' },
  thumbEmpty: {
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  playCircle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -22,
    marginLeft: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(108,99,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.72)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  durationText: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  liveBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: C.accent,
  },
  liveText: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },

  cardBody: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    gap: 10,
  },
  cardLeft: { paddingTop: 2 },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.card,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  cardTitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  cardArtist: { fontFamily: 'Inter', fontSize: 12, color: C.sub },
  metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: C.sub },
  catBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    backgroundColor: C.accentDim,
    borderRadius: 6,
  },
  catBadgeText: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '500',
    color: C.accent,
  },
  cardStats: { flexDirection: 'row', gap: 12 },
  statChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statChipText: { fontFamily: 'Inter', fontSize: 11, color: C.sub },
  moreBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

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
  emptySub: { fontFamily: 'Inter', fontSize: 13, color: C.sub },
});

export default Videos;
