import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import client from '../../api/client';
import Toast from 'react-native-toast-message';
import { getAvatarUrl } from '../../utils/helper';

const Discover = ({ navigation }: any) => {
  const { theme } = useTheme();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await client.get(`/auth/user?query=${query}`);
      setUsers(data.users);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const goToChat = async (item: any) => {
    try {
      const { data } = await client.post('/conversation/create', {
        type: 'private',
        members: [item.id],
      });
      navigation.navigate('ChatWindow', { conversation: data.conversation });
    } catch (error) {
      navigation.navigate('ChatWindow', { 
        conversation: { 
          _id: 'new', 
          members: [{ user: { _id: item.id, ...item } }],
          name: item.name 
        } 
      });
    }
  };

  const renderUserItem = ({ item }: any) => {
    const isPending = item.friendshipStatus === 'pending' && item.isRequester;
    const isFriend = item.friendshipStatus === 'accepted';
    
    return (
      <TouchableOpacity 
        style={styles.userItem}
        onPress={() => goToChat(item)}
      >
        <Image source={{ uri: getAvatarUrl(item.avatar, item.name) }} style={styles.avatar} />
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: theme.text }]}>{item.name}</Text>
          <Text style={[styles.userUsername, { color: theme.textSecondary }]}>@{item.username}</Text>
        </View>
        
        {isFriend ? (
          <View style={[styles.statusBadge, { backgroundColor: theme.surface }]}>
            <FontAwesome5 name="user-check" size={14} color={theme.active} />
          </View>
        ) : isPending ? (
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }]}
            onPress={() => handleCancelRequest(item.id)}
          >
            <FontAwesome5 name="user-times" size={14} color={theme.textSecondary} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={() => handleAddFriend(item.id)}
          >
            <FontAwesome5 name="user-plus" size={14} color="#fff" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const handleAddFriend = async (receiverId: string) => {
    try {
      await client.post('/friendship/request', { receiverId });
      Toast.show({ type: 'success', text1: 'Thành công', text2: 'Đã gửi lời mời kết bạn' });
      fetchUsers();
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Lỗi', text2: error.response?.data?.error || 'Gửi lời mời thất bại' });
    }
  };

  const handleCancelRequest = async (receiverId: string) => {
    try {
      await client.post('/friendship/cancel', { receiverId });
      Toast.show({ type: 'success', text1: 'Thành công', text2: 'Đã hủy lời mời kết bạn' });
      fetchUsers();
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Lỗi', text2: error.response?.data?.error || 'Hủy lời mời thất bại' });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Khám phá</Text>
      </View>

      <View style={[styles.searchBar, { backgroundColor: theme.surface }]}>
        <FontAwesome5 name="search" size={16} color={theme.textSecondary} style={styles.searchIcon} />
        <TextInput
          placeholder="Tìm kiếm bạn mới..."
          placeholderTextColor={theme.textSecondary}
          style={[styles.searchInput, { color: theme.text }]}
          value={query}
          onChangeText={setQuery}
        />
        {loading && <ActivityIndicator size="small" color={theme.primary} />}
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderUserItem}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={{ color: theme.textSecondary }}>Không tìm thấy người dùng nào</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 50 },
  header: { marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold' },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderRadius: 20, height: 40, marginBottom: 20 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16 },
  userItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, padding: 10, borderRadius: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: 'bold' },
  userUsername: { fontSize: 14 },
  addButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  statusBadge: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
});

export default Discover;
