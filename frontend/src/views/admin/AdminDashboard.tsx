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
  bg: '#0D0F1E',
  surface: '#161829',
  card: '#1C1F35',
  border: '#1E2140',
  text: '#FFFFFF',
  sub: '#8A8FAD',
  accent: '#6C63FF',
  danger: '#EF4444',
};

const AdminDashboard = ({ navigation }: any) => {
  const [audios, setAudios] = useState<Audio[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAudios = async () => {
    try {
      setLoading(true);
      const { data } = await getAllAudios();
      setAudios(data.audio);
    } catch (error) {
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

  const renderItem = ({ item }: { item: Audio }) => (
    <View style={styles.card}>
      <Image
        source={{ uri: item.poster?.url || 'https://via.placeholder.com/150' }}
        style={styles.poster}
      />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.category}>{item.category}</Text>
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
            name="trash-alt"
            iconStyle="solid"
            size={18}
            color={C.danger}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FontAwesome5
            name="chevron-left"
            iconStyle="solid"
            size={20}
            color={C.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản trị âm nhạc</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AudioForm')}>
          <FontAwesome5
            name="plus"
            iconStyle="solid"
            size={20}
            color={C.accent}
          />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color={C.accent}
          style={{ marginTop: 50 }}
        />
      ) : (
        <FlatList
          data={audios}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Chưa có âm thanh nào</Text>
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
  list: {
    padding: 15,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  poster: {
    width: 50,
    height: 50,
    borderRadius: 8,
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
  emptyText: {
    color: C.sub,
    textAlign: 'center',
    marginTop: 50,
  },
});

export default AdminDashboard;
