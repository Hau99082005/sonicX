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
  TextInput,
} from 'react-native';
import { FontAwesome5 } from '@react-native-vector-icons/fontawesome5';
import { getLatestMusic, searchMusic, Audio } from '@api/music';
import Toast from 'react-native-toast-message';

const COLORS = {
  primary: '#2563EB',
  background: '#0A0D14',
  surface: '#13172A',
  border: '#1E2235',
  text: '#F1F5F9',
  textSecondary: '#64748B',
};

const Library = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [musics, setMusics] = useState<Audio[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMusics, setFilteredMusics] = useState<Audio[]>([]);

  useEffect(() => { loadMusics(); }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch();
    } else {
      setFilteredMusics(musics);
    }
  }, [searchQuery]);

  const loadMusics = async () => {
    try {
      setLoading(true);
      const response = await getLatestMusic();
      const list = response.data.audio ?? [];
      setMusics(list);
      setFilteredMusics(list);
    } catch {
      Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Không thể tải nhạc', visibilityTime: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) { setFilteredMusics(musics); return; }
    try {
      const response = await searchMusic(searchQuery);
      setFilteredMusics(response.data.audios);
    } catch {}
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
        <Text style={styles.headerTitle}>Thư viện nhạc</Text>
      </View>

      <View style={styles.searchContainer}>
        <FontAwesome5 name="search" iconStyle="solid" size={14} color={COLORS.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm bài hát..."
          placeholderTextColor={COLORS.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')}>
            <FontAwesome5 name="times" iconStyle="solid" size={14} color={COLORS.textSecondary} />
          </Pressable>
        )}
      </View>

      <FlatList
        data={filteredMusics}
        renderItem={({ item }) => <MusicItem audio={item} />}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="music" iconStyle="solid" size={40} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>Không tìm thấy bài hát</Text>
          </View>
        }
      />
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 2,
    paddingHorizontal: 10,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.text,
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
    paddingTop: 80,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 14,
  },
});

export default Library;
