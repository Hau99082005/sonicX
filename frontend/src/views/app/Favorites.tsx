import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome5 } from '@react-native-vector-icons/fontawesome5';
import { getFavoriteMusic, Audio } from '@api/music';
import Toast from 'react-native-toast-message';

const COLORS = {
  primary: '#2563EB',
  background: '#0A0D14',
  surface: '#13172A',
  border: '#1E2235',
  text: '#F1F5F9',
  textSecondary: '#64748B',
};

const Favorites = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Audio[]>([]);

  useEffect(() => { loadFavorites(); }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const response = await getFavoriteMusic();
      setFavorites(response.data.audios);
    } catch {
      Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Không thể tải danh sách yêu thích', visibilityTime: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const handlePlayMusic = (audio: Audio) => {
    navigation.navigate('MusicPlayer', { audio });
  };

  const MusicItem = ({ audio }: { audio: Audio }) => (
    <Pressable onPress={() => handlePlayMusic(audio)} style={styles.musicItem}>
      <Image
        source={{ uri: audio.poster?.url || audio.image || 'https://via.placeholder.com/60' }}
        style={styles.musicImage}
      />
      <View style={styles.musicInfo}>
        <Text style={styles.musicTitle} numberOfLines={1}>{audio.title}</Text>
        <Text style={styles.musicArtist} numberOfLines={1}>{audio.owner ?? ''}</Text>
      </View>
      <FontAwesome5 name="play" iconStyle="solid" size={14} color={COLORS.primary} />
    </Pressable>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Yêu thích</Text>
        <Text style={styles.count}>{favorites.length} bài hát</Text>
      </View>

      {favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome5 name="heart" iconStyle="regular" size={44} color={COLORS.textSecondary} />
          <Text style={styles.emptyText}>Chưa có bài hát yêu thích</Text>
          <Text style={styles.emptySubtext}>Thêm bài hát vào danh sách yêu thích của bạn</Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          renderItem={({ item }) => <MusicItem audio={item} />}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 22,
    color: COLORS.text,
  },
  count: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 3,
  },
  loader: { flex: 1, justifyContent: 'center' },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  musicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  musicImage: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    marginRight: 14,
  },
  musicInfo: { flex: 1 },
  musicTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: COLORS.text,
  },
  musicArtist: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 3,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 17,
    color: COLORS.text,
    marginTop: 18,
    textAlign: 'center',
  },
  emptySubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default Favorites;
