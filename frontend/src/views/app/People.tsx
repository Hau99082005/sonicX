import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import client from '../../api/client';
import Toast from 'react-native-toast-message';
import { getAvatarUrl } from '../../utils/helper';

const People = ({ navigation }: any) => {
  const { theme } = useTheme();
  const { profile } = useAuth();
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        client.get('/friendship/all?status=accepted'),
        client.get('/friendship/all?status=pending'),
      ]);
      setFriends(friendsRes.data.friends);
      // Chỉ lấy lời mời mà mình là người nhận (receiver)
      setRequests(requestsRes.data.friends.filter((f: any) => !f.isRequester));
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAccept = async (requesterId: string) => {
    try {
      await client.post('/friendship/accept', { requesterId });
      Toast.show({ type: 'success', text1: 'Thành công', text2: 'Đã chấp nhận lời mời' });
      fetchData();
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Lỗi', text2: error.response?.data?.error || 'Thao tác thất bại' });
    }
  };

  const handleReject = async (requesterId: string) => {
    try {
      await client.post('/friendship/reject', { requesterId });
      Toast.show({ type: 'success', text1: 'Thành công', text2: 'Đã từ chối lời mời' });
      fetchData();
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Lỗi', text2: error.response?.data?.error || 'Thao tác thất bại' });
    }
  };

  const goToChat = async (item: any) => {
    try {
      // Tìm hoặc tạo cuộc hội thoại private với người này
      const { data } = await client.post('/conversation/create', {
        type: 'private',
        members: [item._id],
      });
      
      navigation.navigate('ChatWindow', { 
        conversation: data.conversation
      });
    } catch (error) {
      // Nếu có lỗi, vẫn cho phép chuyển sang nhưng ở trạng thái 'new'
      navigation.navigate('ChatWindow', { 
        conversation: { 
          _id: 'new', 
          members: [{ user: { _id: item._id, ...item } }],
          name: item.name 
        } 
      });
    }
  };

  const renderFriendItem = ({ item }: any) => (
    <TouchableOpacity 
      style={styles.friendItem}
      onPress={() => goToChat(item)}
    >
      <View style={styles.avatarContainer}>
        <Image source={{ uri: getAvatarUrl(item.avatar, item.name) }} style={styles.avatar} />
        {item.is_online && (
          <View style={[styles.onlineIndicator, { backgroundColor: theme.active, borderColor: theme.background }]} />
        )}
      </View>
      <View style={styles.friendInfo}>
        <Text style={[styles.friendName, { color: theme.text }]}>{item.name}</Text>
        <Text style={[styles.friendUsername, { color: theme.textSecondary }]}>@{item.username}</Text>
      </View>
      <TouchableOpacity 
        style={[styles.actionButton, { backgroundColor: theme.surface }]}
        onPress={() => goToChat(item)}
      >
        <FontAwesome5 name="comment" size={16} color={theme.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderRequestItem = ({ item }: any) => (
    <View style={styles.friendItem}>
      <Image source={{ uri: item.avatar?.url || 'https://via.placeholder.com/40' }} style={styles.avatar} />
      <View style={styles.friendInfo}>
        <Text style={[styles.friendName, { color: theme.text }]}>{item.name}</Text>
        <Text style={[styles.friendUsername, { color: theme.textSecondary }]}>Muốn kết bạn với bạn</Text>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity 
          style={[styles.smallBtn, { backgroundColor: theme.primary }]}
          onPress={() => handleAccept(item._id)}
        >
          <FontAwesome5 name="check" size={12} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.smallBtn, { backgroundColor: theme.surface, marginLeft: 8 }]}
          onPress={() => handleReject(item._id)}
        >
          <FontAwesome5 name="times" size={12} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Danh bạ</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity 
            style={[styles.iconButton, { backgroundColor: theme.surface }]}
            onPress={() => navigation.navigate('Discover')}
          >
            <FontAwesome5 name="user-plus" size={18} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'friends' && { borderBottomColor: theme.primary }]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'friends' ? theme.primary : theme.textSecondary }]}>BẠN BÈ ({friends.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'requests' && { borderBottomColor: theme.primary }]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'requests' ? theme.primary : theme.textSecondary }]}>LỜI MỜI ({requests.length})</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={activeTab === 'friends' ? friends : requests}
          keyExtractor={(item: any) => item._id}
          renderItem={activeTab === 'friends' ? renderFriendItem : renderRequestItem}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FontAwesome5 name={activeTab === 'friends' ? "users" : "user-clock"} size={50} color={theme.surface} />
              <Text style={{ color: theme.textSecondary, marginTop: 15 }}>
                {activeTab === 'friends' ? "Chưa có bạn bè nào" : "Không có lời mời kết bạn"}
              </Text>
              {activeTab === 'friends' && (
                <TouchableOpacity 
                  style={[styles.discoverBtn, { backgroundColor: theme.primary }]}
                  onPress={() => navigation.navigate('Discover')}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Tìm kiếm bạn bè</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold' },
  headerIcons: { flexDirection: 'row' },
  iconButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  tabContainer: { flexDirection: 'row', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  tab: { flex: 1, alignItems: 'center', paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontSize: 13, fontWeight: 'bold' },
  friendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, padding: 5 },
  avatarContainer: { position: 'relative', marginRight: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  onlineIndicator: { position: 'absolute', right: 0, bottom: 0, width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
  friendInfo: { flex: 1, marginLeft: 10 },
  friendName: { fontSize: 16, fontWeight: 'bold' },
  friendUsername: { fontSize: 14 },
  actionButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  requestActions: { flexDirection: 'row' },
  smallBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  discoverBtn: { marginTop: 20, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
});

export default People;
