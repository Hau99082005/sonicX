import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@react-native-vector-icons/fontawesome5';
import { getAllAudios, deleteAudio, Audio } from '@api/music';
import Toast from 'react-native-toast-message';

const C = {
  bg: '#000000',
  surface: '#0A0A0A',
  card: '#121212',
  border: 'rgba(255, 255, 255, 0.08)',
  text: '#FFFFFF',
  sub: '#94A3B8',
  accent: '#7C3AED',
  danger: '#EF4444',
};

const AdminDashboard = ({ navigation }: any) => {
  const [audios, setAudios] = useState<Audio[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAudios = async () => {
    try {
      setLoading(true);
      const { data } = await getAllAudios();
      setAudios(data?.audio || []);
    } catch (error) {
      console.error('AdminDashboard fetch error:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không thể tải danh sách âm thanh',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudios();
    const unsubscribe = navigation.addListener('focus', fetchAudios);
    return unsubscribe;
  }, [navigation]);

  const handleDelete = (id: string) => {
    Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn xóa âm thanh này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAudio(id);
            setAudios(prev => prev.filter(item => item._id !== id));
            Toast.show({
              type: 'success',
              text1: 'Thành công',
              text2: 'Đã xóa âm thanh',
            });
          } catch (error) {
            console.error('Delete error:', error);
            Toast.show({
              type: 'error',
              text1: 'Lỗi',
              text2: 'Không thể xóa âm thanh',
            });
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Audio }) => {
    if (!item) return null;
    return (
      <View style={styles.card}>
        <Image
          source={{ uri: item.poster?.url || 'https://via.placeholder.com/150' }}
          style={styles.poster}
        />
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title || 'Không có tiêu đề'}
          </Text>
          <Text style={styles.category}>{item.category || 'Chưa phân loại'}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => navigation.navigate('AudioForm', { audio: item })}
            style={styles.actionBtn}
          >
            <FontAwesome5
              name="edit"
              iconStyle="solid"
              size={18}
              color={C.accent}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDelete(item._id)}
            style={styles.actionBtn}
          >
            <FontAwesome5
              name="trash"
              iconStyle="solid"
              size={18}
              color={C.danger}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <FontAwesome5
            name="chevron-left"
            iconStyle="solid"
            size={18}
            color={C.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản trị âm nhạc</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AudioForm')} style={styles.addBtn}>
          <FontAwesome5
            name="plus"
            iconStyle="solid"
            size={18}
            color={C.accent}
          />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={C.accent} />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      ) : (
        <FlatList
          data={audios}
          keyExtractor={(item, index) => item?._id?.toString() || index.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FontAwesome5
                name="music"
                iconStyle="solid"
                size={40}
                color={C.border}
                style={{ marginBottom: 16 }}
              />
              <Text style={styles.emptyText}>Chưa có âm thanh nào</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerTitle: {
    color: C.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.surface,
    borderRadius: 20,
  },
  addBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.surface,
    borderRadius: 20,
  },
  list: {
    padding: 15,
    paddingBottom: 100,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  poster: {
    width: 50,
    height: 50,
    borderRadius: 10,
  },
  info: {
    flex: 1,
    marginLeft: 15,
  },
  title: {
    color: C.text,
    fontSize: 16,
    fontWeight: '600',
  },
  category: {
    color: C.sub,
    fontSize: 12,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
  },
  actionBtn: {
    padding: 10,
    marginLeft: 5,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: C.sub,
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: C.sub,
    textAlign: 'center',
    fontSize: 15,
  },
});

export default AdminDashboard;
