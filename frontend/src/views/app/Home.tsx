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
import { getLatestMusic, Audio } from '@api/music';
import { getUser } from '@utils/storage';
import Toast from 'react-native-toast-message';
import { usePlayer } from '../../context/PlayerContext';

const { width } = Dimensions.get('window');
const RECENT_CARD = (width - 20 * 2 - 12 * 2) / 3;

const C = {
  bg: '#0D0F1E',
  surface: '#161829',
  border: '#1E2140',
  text: '#FFFFFF',
  sub: '#8A8FAD',
  accent: '#6C63FF',
  gold: '#F59E0B',
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
            width: barW + 1,
            height: size,
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

  const formatStreams = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k / lượt nghe`;
    return `${n} / lượt nghe`;
  };

  const recentTracks = audios.slice(0, 3);
  const recommended = audios.slice(3);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
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

          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{user?.name ?? 'Người dùng'}</Text>
            <View style={styles.memberRow}>
              <FontAwesome5
                name="star"
                iconStyle="solid"
                size={10}
                color={C.gold}
              />
              <Text style={styles.memberText}>Thành viên Vàng</Text>
            </View>
          </View>

          <Pressable style={styles.bellBtn} hitSlop={10}>
            <FontAwesome5
              name="bell"
              iconStyle="regular"
              size={20}
              color={C.text}
            />
          </Pressable>
        </View>

        <View style={styles.heroRow}>
          <View style={styles.heroTextWrap}>
            <Text style={styles.heroTitle}>Nghe những</Text>
            <Text style={styles.heroTitle}>bản nhạc mới</Text>
          </View>
          <View style={styles.searchBox}>
            <FontAwesome5
              name="search"
              iconStyle="solid"
              size={13}
              color={C.sub}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm"
              placeholderTextColor={C.sub}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
            />
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={C.accent} style={styles.loader} />
        ) : (
          <>
            {recentTracks.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Nghe gần đây</Text>
                <View style={styles.recentRow}>
                  {recentTracks.map(item => {
                    const poster = getPoster(item);
                    const isActive = player.currentAudio?._id === item._id;
                    return (
                      <Pressable
                        key={String(item._id)}
                        style={styles.recentCard}
                        onPress={() => handlePlay(item)}
                      >
                        <View style={styles.recentImgWrap}>
                          {poster ? (
                            <Image
                              source={{ uri: poster }}
                              style={styles.recentImg}
                            />
                          ) : (
                            <View
                              style={[styles.recentImg, styles.recentImgEmpty]}
                            >
                              <FontAwesome5
                                name="music"
                                iconStyle="solid"
                                size={22}
                                color={C.border}
                              />
                            </View>
                          )}
                          {isActive && (
                            <View style={styles.activeOverlay}>
                              <MusicBars
                                color={C.accent}
                                size={18}
                                playing={player.isPlaying}
                              />
                            </View>
                          )}
                        </View>
                        <Text
                          style={[
                            styles.recentTitle,
                            isActive && { color: C.accent },
                          ]}
                          numberOfLines={1}
                        >
                          {item.title}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {recommended.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Gợi ý cho bạn</Text>
                <View style={styles.recommendList}>
                  {recommended.map(item => {
                    const poster = getPoster(item);
                    const streams = item.likes?.length ?? 0;
                    const isActive = player.currentAudio?._id === item._id;
                    return (
                      <Pressable
                        key={String(item._id)}
                        style={[
                          styles.recommendCard,
                          isActive && styles.recommendCardActive,
                        ]}
                        onPress={() => handlePlay(item)}
                      >
                        <View style={styles.recommendImgWrap}>
                          {poster ? (
                            <Image
                              source={{ uri: poster }}
                              style={styles.recommendImg}
                            />
                          ) : (
                            <View
                              style={[
                                styles.recommendImg,
                                styles.recommendImgEmpty,
                              ]}
                            >
                              <FontAwesome5
                                name="music"
                                iconStyle="solid"
                                size={28}
                                color={C.border}
                              />
                            </View>
                          )}
                          {isActive && (
                            <View style={styles.activeOverlay}>
                              <MusicBars
                                color={C.accent}
                                size={16}
                                playing={player.isPlaying}
                              />
                            </View>
                          )}
                        </View>
                        <View style={styles.recommendInfo}>
                          <Text
                            style={[
                              styles.recommendTitle,
                              isActive && { color: C.accent },
                            ]}
                            numberOfLines={1}
                          >
                            {item.title}
                          </Text>
                          <Text
                            style={styles.recommendArtist}
                            numberOfLines={1}
                          >
                            {item.about || 'SonicX'}
                          </Text>
                          <Text style={styles.recommendStreams}>
                            {formatStreams(streams)}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {audios.length === 0 && (
              <View style={styles.emptyWrap}>
                <FontAwesome5
                  name="music"
                  iconStyle="solid"
                  size={40}
                  color={C.border}
                />
                <Text style={styles.emptyText}>Chưa có bài hát nào</Text>
              </View>
            )}
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
    paddingBottom: 110,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
  },
  avatarWrap: {
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: C.surface,
    borderWidth: 2,
    borderColor: C.accent,
  },
  headerInfo: {
    flex: 1,
    gap: 3,
  },
  headerName: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '700',
    color: C.text,
    lineHeight: 20,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memberText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '400',
    color: C.gold,
  },
  bellBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
    gap: 16,
  },
  heroTextWrap: {
    flex: 1,
  },
  heroTitle: {
    fontFamily: 'Inter',
    fontSize: 22,
    fontWeight: '700',
    color: C.text,
    lineHeight: 30,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    width: 130,
    borderWidth: 1,
    borderColor: C.border,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '400',
    color: C.text,
    padding: 0,
    margin: 0,
  },
  loader: {
    marginTop: 80,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '700',
    color: C.text,
    marginBottom: 18,
  },
  recentRow: {
    flexDirection: 'row',
    gap: 12,
  },
  recentCard: {
    width: RECENT_CARD,
    alignItems: 'center',
    gap: 10,
  },
  recentImgWrap: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  recentImg: {
    width: RECENT_CARD,
    height: RECENT_CARD,
    borderRadius: 12,
    backgroundColor: C.surface,
  },
  recentImgEmpty: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentTitle: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '500',
    color: C.text,
    textAlign: 'center',
    lineHeight: 18,
  },
  recommendList: {
    gap: 20,
  },
  recommendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  recommendCardActive: {
    backgroundColor: 'rgba(108,99,255,0.08)',
    borderRadius: 12,
    padding: 8,
    marginHorizontal: -8,
  },
  recommendImgWrap: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
    borderRadius: 10,
    overflow: 'hidden',
  },
  recommendImg: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: C.surface,
  },
  recommendImgEmpty: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  recommendInfo: {
    flex: 1,
    gap: 4,
  },
  recommendTitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
    lineHeight: 22,
  },
  recommendArtist: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '400',
    color: C.sub,
    lineHeight: 18,
  },
  recommendStreams: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '400',
    color: C.sub,
    lineHeight: 17,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 14,
  },
  emptyText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '400',
    color: C.sub,
  },
});

export default Home;
