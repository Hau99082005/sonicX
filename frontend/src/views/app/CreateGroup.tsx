import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import client from '../../api/client';
import Toast from 'react-native-toast-message';
import { getAvatarUrl } from '../../utils/helper';

const CreateGroup = ({ navigation }: any) => {
  const { theme } = useTheme();
  const { profile } = useAuth();
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');

  const fetchFriends = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/friendship/all?status=accepted');
      const friendsList = data.friends.filter(
        (f: any) => f._id !== profile?.id,
      );
      setFriends(friendsList);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: error.response?.data?.error || 'Không tải được bạn bè',
      });
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const toggleSelect = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id],
    );
  };

  const handleCreate = async () => {
    if (!selected.length) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Chọn ít nhất 1 người để tạo nhóm',
      });
      return;
    }
    setCreating(true);
    try {
      const formData = new FormData();
      formData.append('type', 'group');
      formData.append('members', JSON.stringify(selected));
      if (groupName.trim()) formData.append('name', groupName.trim());
      const { data } = await client.post('/conversation/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      navigation.navigate('ChatWindow', { conversation: data.conversation });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: error.response?.data?.error || 'Tạo nhóm thất bại',
      });
    } finally {
      setCreating(false);
    }
  };

  const renderFriend = ({ item }: any) => {
    const selectedItem = selected.includes(item._id);
    return (
      <TouchableOpacity
        style={[
          styles.friendItem,
          { backgroundColor: selectedItem ? theme.surface : 'transparent' },
        ]}
        onPress={() => toggleSelect(item._id)}
      >
        <View style={styles.friendLeft}>
          <Image
            source={{ uri: getAvatarUrl(item.avatar, item.name) }}
            style={styles.friendAvatar}
          />
          <View style={styles.friendInfo}>
            <Text style={[styles.friendName, { color: theme.text }]}>
              {item.name}
            </Text>
            <Text
              style={[styles.friendUsername, { color: theme.textSecondary }]}
            >
              @{item.username}
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.checkbox,
            selectedItem && {
              backgroundColor: theme.primary,
              borderColor: theme.primary,
            },
          ]}
        >
          {selectedItem && <FontAwesome5 name="check" size={12} color="#fff" />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FontAwesome5 name="arrow-left" size={20} color={theme.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Tạo nhóm</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View
          style={[
            styles.inputGroup,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.inputLabel, { color: theme.text }]}>
            Tên nhóm (tùy chọn)
          </Text>
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="Nhập tên nhóm"
            placeholderTextColor={theme.textSecondary}
            value={groupName}
            onChangeText={setGroupName}
          />
        </View>

        <View style={styles.counterRow}>
          <Text style={[styles.counterText, { color: theme.text }]}>
            Chọn bạn bè
          </Text>
          <Text style={[styles.counterText, { color: theme.textSecondary }]}>
            {selected.length} đã chọn
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={theme.primary}
            style={{ marginTop: 30 }}
          />
        ) : (
          <FlatList
            data={friends}
            keyExtractor={(item: any) => item._id}
            renderItem={renderFriend}
            contentContainerStyle={{ paddingBottom: 120 }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={{ color: theme.textSecondary }}>
                  Không có bạn bè nào để thêm vào nhóm
                </Text>
              </View>
            }
          />
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.createButton,
            { backgroundColor: selected.length ? theme.primary : theme.border },
          ]}
          onPress={handleCreate}
          disabled={!selected.length || creating}
        >
          {creating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createButtonText}>Tạo nhóm</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
    borderBottomWidth: 0.5,
  },
  title: { fontSize: 18, fontWeight: '700' },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  inputGroup: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  inputLabel: { fontSize: 14, marginBottom: 8, fontWeight: '600' },
  input: {
    height: 46,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    backgroundColor: 'transparent',
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  counterText: { fontSize: 14, fontWeight: '600' },
  friendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 10,
  },
  friendLeft: { flexDirection: 'row', alignItems: 'center' },
  friendAvatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  friendInfo: { minWidth: 0 },
  friendName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  friendUsername: { fontSize: 13 },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: 'transparent',
  },
  createButton: {
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
});

export default CreateGroup;
