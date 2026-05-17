import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome5 } from '@react-native-vector-icons/fontawesome5';
import { getLatestMusic, Audio } from '@api/music';
import Toast from 'react-native-toast-message';

const COLORS = {
  primary: '#2563EB',
  background: '#0A0D14',
  surface: '#13172A',
  border: '#1E2235',
  text: '#F1F5F9',
  textSecondary: '#64748B',
  overlay: 'rgba(0,0,0,0.35)',
};

const Home = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [audios, setAudios] = useState<Audio[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Audio[]>([]);

  useEffect(() => {
    loadMusic();
  }, []);

  const loadMusic = async () => {
    try {
      setLoading(true);
      const response = await getLatestMusic();
      const list = response.data.audio ?? [];
      setAudios(list);
      setRecentlyPlayed(list.slice(0, 5));
    } catch {
      Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Không thể tải dữ liệu nhạc', visibilityTime: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const handlePlayMusic = (audio: Audio) => {
    navigation.navigate('MusicPlayer', { audio });
  };

  const MusicCard = ({ audio }: { audio: Audio }) => (
    <Pressable onPress={() => handlePlayMusic(audio)} style={styles.musicCard}>
      <Image
        source={{ uri: audio.poster?.url || audio.image || 'https://via.placeholder.com/150' }}
        style={styles.musicImage}
      />
      <View style={styles.playOverlay}>
        <FontAwesome5 name="play-circle" iconStyle="solid" size={36} color="#fff" />
      </View>
      <Text style={styles.musicTitle} numberOfLines={1}>{audio.title}</Text>
      <Text style={styles.musicArtist} numberOfLines={1}>{audio.owner ?? ''}</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSub}>Chào mừng trở lại</Text>
            <Text style={styles.headerTitle}>Nghe nhạc mới nhất</Text>
          </View>
          <Pressable onPress={() => navigation.navigate('Profile')} style={styles.avatarBtn}>
            <FontAwesome5 name="user-circle" iconStyle="solid" size={28} color={COLORS.textSecondary} />
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
        ) : (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Nghe gần đây</Text>
                <Pressable onPress={() => navigation.navigate('AllMusic')}>
                  <Text style={styles.seeAll}>Xem tất cả</Text>
                </Pressable>
              </View>
              <FlatList
                data={recentlyPlayed}
                renderItem={({ item }) => <MusicCard audio={item} />}
                keyExtractor={item => item._id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
              />
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Gợi ý cho bạn</Text>
                <Pressable onPress={() => navigation.navigate('AllMusic')}>
                  <Text style={styles.seeAll}>Xem tất cả</Text>
                </Pressable>
              </View>
              <FlatList
                data={audios.slice(0, 6)}
                renderItem={({ item }) => <MusicCard audio={item} />}
                keyExtractor={item => item._id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
              />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: 100 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  headerSub: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  headerTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 22,
    color: COLORS.text,
  },
  avatarBtn: { padding: 4 },
  loader: { marginTop: 60 },
  section: { paddingHorizontal: 20, marginTop: 28 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: COLORS.text,
  },
  seeAll: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: COLORS.primary,
  },
  horizontalList: { paddingRight: 20 },
  musicCard: { width: 136, marginRight: 14 },
  musicImage: {
    width: 136,
    height: 136,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
  },
  playOverlay: {
    position: 'absolute',
    width: 136,
    height: 136,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.overlay,
  },
  musicTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: COLORS.text,
    marginTop: 8,
  },
  musicArtist: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 3,
  },
});

export default Home;
