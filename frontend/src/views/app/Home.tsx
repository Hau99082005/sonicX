import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@react-native-vector-icons/fontawesome5';
import { getLatestMusic, Audio } from '@api/music';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 20 * 2 - 12) / 2;

const COLORS = {
  primary: '#6C63FF',
  primaryDim: 'rgba(108,99,255,0.15)',
  background: '#0A0D14',
  surface: '#13172A',
  surfaceAlt: '#1A1E30',
  border: '#1E2235',
  text: '#F1F5F9',
  textSecondary: '#64748B',
  overlay: 'rgba(0,0,0,0.45)',
  accent: '#FF6584',
};

const Home = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [audios, setAudios] = useState<Audio[]>([]);

  useEffect(() => { loadMusic(); }, []);

  const loadMusic = async () => {
    try {
      setLoading(true);
      const response = await getLatestMusic();
      setAudios(response.data.audio ?? []);
    } catch {
      Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Không thể tải dữ liệu nhạc', visibilityTime: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = (audio: Audio) => navigation.navigate('MusicPlayer', { audio });

  const FeaturedCard = ({ audio }: { audio: Audio }) => (
    <Pressable onPress={() => handlePlay(audio)} style={styles.featuredCard}>
      <Image
        source={{ uri: audio.poster?.url || audio.image || 'https://via.placeholder.com/400' }}
        style={styles.featuredImage}
      />
      <View style={styles.featuredOverlay} />
      <View style={styles.featuredContent}>
        <View style={styles.featuredBadge}>
          <Text style={styles.featuredBadgeText}>MỚI NHẤT</Text>
        </View>
        <Text style={styles.featuredTitle} numberOfLines={2}>{audio.title}</Text>
        <Text style={styles.featuredArtist} numberOfLines={1}>{audio.about || 'SonicX'}</Text>
        <View style={styles.featuredPlayBtn}>
          <FontAwesome5 name="play" iconStyle="solid" size={14} color="#fff" />
          <Text style={styles.featuredPlayText}>Phát ngay</Text>
        </View>
      </View>
    </Pressable>
  );

  const GridCard = ({ audio }: { audio: Audio }) => (
    <Pressable onPress={() => handlePlay(audio)} style={styles.gridCard}>
      <Image
        source={{ uri: audio.poster?.url || audio.image || 'https://via.placeholder.com/200' }}
        style={styles.gridImage}
      />
      <View style={styles.gridOverlay}>
        <View style={styles.gridPlayIcon}>
          <FontAwesome5 name="play" iconStyle="solid" size={12} color="#fff" />
        </View>
      </View>
      <View style={styles.gridInfo}>
        <Text style={styles.gridTitle} numberOfLines={1}>{audio.title}</Text>
        <Text style={styles.gridArtist} numberOfLines={1}>{audio.about || 'SonicX'}</Text>
      </View>
    </Pressable>
  );

  const RowCard = ({ audio }: { audio: Audio }) => (
    <Pressable onPress={() => handlePlay(audio)} style={styles.rowCard}>
      <Image
        source={{ uri: audio.poster?.url || audio.image || 'https://via.placeholder.com/100' }}
        style={styles.rowImage}
      />
      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle} numberOfLines={1}>{audio.title}</Text>
        <Text style={styles.rowArtist} numberOfLines={1}>{audio.about || 'SonicX'}</Text>
      </View>
      <Pressable style={styles.rowPlayBtn} onPress={() => handlePlay(audio)}>
        <FontAwesome5 name="play" iconStyle="solid" size={12} color={COLORS.primary} />
      </Pressable>
    </Pressable>
  );

  const gridItems = audios.slice(1, 5);
  const listItems = audios.slice(5);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        <View style={styles.header}>
          <View>
            <Text style={styles.headerSub}>Chào mừng trở lại</Text>
            <Text style={styles.headerTitle}>Khám phá âm nhạc</Text>
          </View>
          <Pressable onPress={() => navigation.navigate('Profile')} style={styles.avatarBtn}>
            <View style={styles.avatarCircle}>
              <FontAwesome5 name="user" iconStyle="solid" size={16} color={COLORS.primary} />
            </View>
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
        ) : (
          <>
            {audios[0] && (
              <View style={styles.section}>
                <FeaturedCard audio={audios[0]} />
              </View>
            )}

            {gridItems.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Nghe gần đây</Text>
                  <Pressable onPress={() => navigation.navigate('AllMusic')}>
                    <Text style={styles.seeAll}>Xem tất cả</Text>
                  </Pressable>
                </View>
                <View style={styles.grid}>
                  {gridItems.map(item => (
                    <GridCard key={item._id} audio={item} />
                  ))}
                </View>
              </View>
            )}

            {listItems.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Gợi ý cho bạn</Text>
                  <Pressable onPress={() => navigation.navigate('AllMusic')}>
                    <Text style={styles.seeAll}>Xem tất cả</Text>
                  </Pressable>
                </View>
                <View style={styles.rowList}>
                  {listItems.map(item => (
                    <RowCard key={item._id} audio={item} />
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerSub: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 3,
  },
  headerTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: COLORS.text,
  },
  avatarBtn: {},
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primaryDim,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  loader: {
    marginTop: 80,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 17,
    color: COLORS.text,
  },
  seeAll: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: COLORS.primary,
  },
  featuredCard: {
    width: '100%',
    height: 220,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  featuredContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 18,
  },
  featuredBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  featuredBadgeText: {
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    color: '#fff',
    letterSpacing: 1,
  },
  featuredTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#fff',
    marginBottom: 4,
  },
  featuredArtist: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 12,
  },
  featuredPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  featuredPlayText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: '#fff',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridCard: {
    width: CARD_SIZE,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: CARD_SIZE,
    resizeMode: 'cover',
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: CARD_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.overlay,
  },
  gridPlayIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 3,
  },
  gridInfo: {
    padding: 10,
  },
  gridTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: COLORS.text,
    marginBottom: 3,
  },
  gridArtist: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  rowList: {
    gap: 2,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowImage: {
    width: 54,
    height: 54,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
  },
  rowInfo: {
    flex: 1,
    paddingHorizontal: 14,
  },
  rowTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 4,
  },
  rowArtist: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  rowPlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryDim,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 2,
  },
});

export default Home;
