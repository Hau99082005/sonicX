import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  Dimensions,
  TextInput,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@react-native-vector-icons/fontawesome5';
import LinearGradient from 'react-native-linear-gradient';
import PagerView from 'react-native-pager-view';
import { getLatestMusic, getBanners, Audio } from '@api/music';
import { getUser } from '@utils/storage';
import Toast from 'react-native-toast-message';
import { usePlayer } from '../../context/PlayerContext';

const { width } = Dimensions.get('window');

const C = {
  bg: '#080912',
  surface: '#121421',
  card: '#1A1D2E',
  border: 'rgba(255,255,255,0.06)',
  text: '#FFFFFF',
  sub: '#94A3B8',
  accent: '#7C3AED',
  accentGradient: ['#7C3AED', '#DB2777'],
  gold: '#F59E0B',
};

const STORIES = [
  {
    id: '1',
    title: 'New Hits',
    image:
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop',
  },
  {
    id: '2',
    title: 'Top 50',
    image:
      'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=200&h=200&fit=crop',
  },
  {
    id: '3',
    title: 'Relax',
    image:
      'https://images.unsplash.com/photo-1514525253344-99a4299946bc?w=200&h=200&fit=crop',
  },
  {
    id: '4',
    title: 'Workout',
    image:
      'https://images.unsplash.com/photo-1534361960057-19889db9621e?w=200&h=200&fit=crop',
  },
  {
    id: '5',
    title: 'Jazz',
    image:
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&h=200&fit=crop',
  },
];

const BAR_DELAYS = [0, 150, 80];
const BAR_DURATIONS = [500, 380, 460];

const MusicBars = ({ color = '#fff', size = 14, playing = true }: any) => {
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
  }, [playing]);
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

const StoryBar = () => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.storyContent}
    style={styles.storyScroll}
  >
    {STORIES.map(story => (
      <Pressable key={story.id} style={styles.storyItem}>
        <LinearGradient
          colors={['#7C3AED', '#DB2777']}
          style={styles.storyRing}
        >
          <View style={styles.storyInner}>
            <Image source={{ uri: story.image }} style={styles.storyImg} />
          </View>
        </LinearGradient>
        <Text style={styles.storyTitle} numberOfLines={1}>
          {story.title}
        </Text>
      </Pressable>
    ))}
  </ScrollView>
);

const Home = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [audios, setAudios] = useState<Audio[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [search, setSearch] = useState('');
  const player = usePlayer();
  
  const pagerRef = useRef<PagerView>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng,';
    if (hour < 18) return 'Chào buổi chiều,';
    return 'Chào buổi tối,';
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (banners.length > 0) {
      const interval = setInterval(() => {
        const nextPage = (currentPage + 1) % banners.length;
        setCurrentPage(nextPage);
        pagerRef.current?.setPage(nextPage);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [banners.length, currentPage]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [userData, musicRes, bannerRes] = await Promise.all([
        getUser(),
        getLatestMusic(),
        getBanners(),
      ]);
      setUser(userData);
      setAudios(musicRes.data.audio ?? []);
      setBanners(bannerRes.data.banners ?? []);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không thể tải dữ liệu',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = (audio: Audio) => {
    player.play(audio);
    navigation.navigate('MusicPlayer', { audio });
  };

  const getPoster = (audio: Audio) =>
    typeof audio.poster === 'string'
      ? audio.poster
      : (audio.poster as any)?.url ?? audio.image ?? '';

  const getAvatar = (user: any) => {
    if (!user) return `https://ui-avatars.com/api/?name=U&background=1E2235&color=F1F5F9&size=200`;
    const avatar = typeof user.avatar === 'string' ? user.avatar : (user.avatar?.url || user.picture);
    return avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=1E2235&color=F1F5F9&size=200`;
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerGreeting}>{getGreeting()}</Text>
            <Text style={styles.headerName}>{user?.name ?? 'SonicX User'}</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable style={styles.iconBtn}>
              <FontAwesome5
                name="bell"
                iconStyle="solid"
                size={18}
                color={C.text}
              />
            </Pressable>
            <Pressable
              style={styles.avatarWrap}
              onPress={() => navigation.navigate('Profile')}
            >
              <Image
                source={{ uri: getAvatar(user) }}
                style={styles.avatar}
              />
            </Pressable>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <FontAwesome5
              name="search"
              iconStyle="solid"
              size={14}
              color={C.sub}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm bài hát, nghệ sĩ..."
              placeholderTextColor={C.sub}
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        <StoryBar />

        {banners.length > 0 && (
          <View style={styles.heroSection}>
            <PagerView 
              ref={pagerRef}
              style={styles.bannerPager} 
              initialPage={0}
              onPageSelected={(e) => setCurrentPage(e.nativeEvent.position)}
            >
              {banners.map((banner, index) => (
                <View key={banner._id || index} style={styles.bannerItem}>
                  <Image
                    source={{ uri: banner.banner.url }}
                    style={styles.bannerImg}
                  />
                  <LinearGradient
                    colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.9)']}
                    style={styles.bannerOverlay}
                  >
                  </LinearGradient>
                </View>
              ))}
            </PagerView>
          </View>
        )}

        {loading ? (
          <ActivityIndicator color={C.accent} style={styles.loader} />
        ) : (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Nghe gần đây</Text>
                <Pressable>
                  <Text style={styles.seeAll}>Tất cả</Text>
                </Pressable>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScroll}
              >
                {audios.slice(0, 4).map((item, index) => (
                  <Pressable
                    key={item._id || index}
                    style={styles.recentCard}
                    onPress={() => handlePlay(item)}
                  >
                    <View style={styles.recentImgWrap}>
                      <Image
                        source={{ uri: getPoster(item) }}
                        style={styles.recentImg}
                      />
                      {player.currentAudio?._id === item._id && (
                        <View style={styles.activeOverlay}>
                          <MusicBars
                            color="#fff"
                            size={20}
                            playing={player.isPlaying}
                          />
                        </View>
                      )}
                    </View>
                    <Text style={styles.trackName} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.artistName} numberOfLines={1}>
                      {item.about || 'SonicX'}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Gợi ý cho bạn</Text>
                <Pressable>
                  <Text style={styles.seeAll}>Khám phá</Text>
                </Pressable>
              </View>
              <View style={styles.gridContainer}>
                {audios.slice(4).map((item, index) => (
                  <Pressable
                    key={item._id || index}
                    style={styles.gridCard}
                    onPress={() => handlePlay(item)}
                  >
                    <View style={styles.gridImgWrap}>
                      <Image
                        source={{ uri: getPoster(item) }}
                        style={styles.gridImg}
                      />
                      {player.currentAudio?._id === item._id && (
                        <View style={styles.gridOverlay}>
                          <MusicBars
                            size={16}
                            playing={player.isPlaying}
                            color="#fff"
                          />
                        </View>
                      )}
                    </View>
                    <View style={styles.gridInfo}>
                      <Text
                        style={[
                          styles.gridTitle,
                          player.currentAudio?._id === item._id && {
                            color: C.accent,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      <Text style={styles.gridSub} numberOfLines={1}>
                        {item.about || 'SonicX'}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scrollContent: { paddingBottom: 100 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerGreeting: { fontSize: 13, color: C.sub, fontWeight: '600' },
  headerName: {
    fontSize: 20,
    color: C.text,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: C.accent,
    padding: 2,
  },
  avatar: { width: '100%', height: '100%', borderRadius: 20 },
  searchContainer: { paddingHorizontal: 20, marginTop: 24 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 10,
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 1,
    borderColor: C.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    color: C.text,
    fontSize: 15,
    fontWeight: '600',
  },
  storyScroll: { marginTop: 24 },
  storyContent: { paddingHorizontal: 20, gap: 16 },
  storyItem: { alignItems: 'center', gap: 8, width: 72 },
  storyRing: { width: 68, height: 68, padding: 2, borderRadius: 10 },
  storyInner: { flex: 1, backgroundColor: C.bg, padding: 2, borderRadius: 8 },
  storyImg: { flex: 1, borderRadius: 6 },
  storyTitle: {
    fontSize: 11,
    color: C.sub,
    fontWeight: '700',
    textAlign: 'center',
  },
  heroSection: { paddingHorizontal: 20, marginTop: 32, height: 200 },
  bannerPager: { flex: 1, borderRadius: 10, overflow: 'hidden' },
  bannerItem: { flex: 1, position: 'relative' },
  bannerImg: { width: '100%', height: '100%', borderRadius: 10 },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 10,
    justifyContent: 'flex-end',
    padding: 20,
  },
  bannerInfo: { gap: 8 },
  bannerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: C.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: { fontSize: 10, fontWeight: '900', color: '#fff' },
  heroBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 8,
  },
  heroBtnText: { fontSize: 13, fontWeight: '900', color: '#000' },
  loader: { marginTop: 40 },
  section: { marginTop: 32 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: C.text,
    letterSpacing: -0.5,
  },
  seeAll: { fontSize: 13, fontWeight: '700', color: C.accent },
  horizontalScroll: { paddingHorizontal: 20, gap: 16 },
  recentCard: { width: 140 },
  recentImgWrap: {
    width: 140,
    height: 140,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: C.surface,
    position: 'relative',
  },
  recentImg: { width: '100%', height: '100%' },
  activeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackName: { fontSize: 15, fontWeight: '800', color: C.text, marginTop: 10 },
  artistName: { fontSize: 12, fontWeight: '600', color: C.sub, marginTop: 2 },
  gridContainer: { paddingHorizontal: 20, gap: 16 },
  gridCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  gridImgWrap: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  gridImg: { width: '100%', height: '100%' },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridInfo: { flex: 1, marginLeft: 16 },
  gridTitle: { fontSize: 16, fontWeight: '800', color: C.text },
  gridSub: { fontSize: 13, fontWeight: '600', color: C.sub, marginTop: 2 },
});

export default Home;
