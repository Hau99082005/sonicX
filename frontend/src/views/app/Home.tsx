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
import { getLatestMusic, Audio } from '@api/music';
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

const MusicBars = ({
  color = '#fff',
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
  const [user, setUser] = useState<any>(null);
  const [search, setSearch] = useState('');
  const player = usePlayer();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [userData, musicRes] = await Promise.all([
        getUser(),
        getLatestMusic(),
      ]);
      setUser(userData);
      setAudios(musicRes.data.audio ?? []);
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không thể tải dữ liệu',
        visibilityTime: 3000,
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

  const recentTracks = audios.slice(0, 4);
  const recommended = audios.slice(4);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerGreeting}>Chào buổi sáng,</Text>
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
                source={{
                  uri:
                    user?.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      user?.name || 'U',
                    )}&background=1E2235&color=F1F5F9&size=200`,
                }}
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

        <View style={styles.heroSection}>
          <LinearGradient
            colors={['#2E1065', '#0F172A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroInfo}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>TRENDING</Text>
              </View>
              <Text style={styles.heroTitle}>Khám phá âm nhạc độc bản</Text>
              <Text style={styles.heroSub}>
                Dành riêng cho phong cách của bạn
              </Text>
              <Pressable style={styles.heroBtn}>
                <Text style={styles.heroBtnText}>Nghe ngay</Text>
              </Pressable>
            </View>
            <View style={styles.heroImgContainer}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1459749411177-042180ce673b?w=400&h=400&fit=crop',
                }}
                style={styles.heroImg}
              />
              <LinearGradient
                colors={['transparent', '#0F172A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </View>
          </LinearGradient>
        </View>

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
                {recentTracks.map((item, index) => {
                  const poster = getPoster(item);
                  const isActive = player.currentAudio?._id === item._id;
                  return (
                    <Pressable
                      key={item._id || index}
                      style={styles.recentCard}
                      onPress={() => handlePlay(item)}
                    >
                      <View style={styles.recentImgWrap}>
                        <Image
                          source={{ uri: poster }}
                          style={styles.recentImg}
                        />
                        {isActive && (
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
                  );
                })}
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
                {recommended.map((item, index) => {
                  const poster = getPoster(item);
                  const isActive = player.currentAudio?._id === item._id;
                  return (
                    <Pressable
                      key={item._id || index}
                      style={styles.gridCard}
                      onPress={() => handlePlay(item)}
                    >
                      <View style={styles.gridImgWrap}>
                        <Image
                          source={{ uri: poster }}
                          style={styles.gridImg}
                        />
                        {isActive && (
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
                            isActive && { color: C.accent },
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
                  );
                })}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    marginBottom: 20,
  },
  headerGreeting: {
    fontSize: 14,
    color: C.sub,
    marginBottom: 2,
  },
  headerName: {
    fontSize: 22,
    fontWeight: '800',
    color: C.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
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
  avatarWrap: {
    width: 44,
    height: 44,
    borderWidth: 2,
    borderRadius: 22,
    borderColor: C.accent,
    padding: 2,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    paddingHorizontal: 16,
    height: 52,
    gap: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  searchInput: {
    flex: 1,
    color: C.text,
    fontSize: 15,
  },
  storyScroll: {
    marginBottom: 28,
  },
  storyContent: {
    paddingHorizontal: 24,
    gap: 18,
  },
  storyItem: {
    alignItems: 'center',
    gap: 8,
    width: 68,
  },
  storyRing: {
    width: 68,
    height: 68,
    padding: 2,
    borderRadius: 34,
  },
  storyInner: {
    flex: 1,
    backgroundColor: C.bg,
    padding: 2,
    borderRadius: 32,
  },
  storyImg: {
    flex: 1,
    borderRadius: 30,
  },
  storyTitle: {
    fontSize: 11,
    color: C.sub,
    fontWeight: '500',
  },
  heroSection: {
    marginBottom: 36,
  },
  heroCard: {
    height: 220,
    padding: 24,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  heroInfo: {
    flex: 1.5,
    justifyContent: 'center',
    zIndex: 2,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    lineHeight: 38,
    marginBottom: 10,
  },
  heroSub: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 24,
    fontWeight: '500',
  },
  heroBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignSelf: 'flex-start',
  },
  heroBtnText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '900',
  },
  heroImgContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    left: 0,
    zIndex: 1,
  },
  heroImg: {
    width: '100%',
    height: '100%',
    opacity: 0.5,
  },
  section: {
    marginBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: C.text,
    letterSpacing: -0.5,
  },
  seeAll: {
    fontSize: 14,
    color: C.accent,
    fontWeight: '800',
  },
  horizontalScroll: {
    paddingHorizontal: 20,
    gap: 16,
  },
  recentCard: {
    width: 150,
    gap: 12,
  },
  recentImgWrap: {
    width: 150,
    height: 150,
    backgroundColor: C.surface,
  },
  recentImg: {
    width: '100%',
    height: '100%',
  },
  activeOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackName: {
    fontSize: 16,
    fontWeight: '800',
    color: C.text,
  },
  artistName: {
    fontSize: 14,
    color: C.sub,
    fontWeight: '600',
  },
  gridContainer: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 24,
  },
  gridCard: {
    width: (width - 40 - 16) / 2,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 0,
  },
  gridImgWrap: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: C.surface,
  },
  gridImg: {
    width: '100%',
    height: '100%',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridInfo: {
    padding: 12,
    gap: 4,
  },
  gridTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: C.text,
  },
  gridSub: {
    fontSize: 13,
    color: C.sub,
    fontWeight: '600',
  },
  loader: {
    marginTop: 40,
  },
});

export default Home;
