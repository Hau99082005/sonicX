import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { searchAll, SearchUser } from '../../api/search';
import { getAvatarUrl } from '../../utils/helper';
import moment from 'moment';

const DEBOUNCE_MS = 300;

const Search = ({ navigation }: any) => {
  const { theme } = useTheme();
  const { profile } = useAuth();
  const { onlineUsers } = useSocket();

  const [query, setQuery] = useState('');
  const [conversations, setConversations] = useState<any[]>([]);
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const inputRef = useRef<TextInput>(null);
  const debounceRef = useRef<any>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  const doSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setConversations([]);
      setUsers([]);
      setSearched(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await searchAll(trimmed);
      setConversations(result.conversations);
      setUsers(result.users);
      setSearched(true);
    } catch {
      setConversations([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChangeText = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(text), DEBOUNCE_MS);
  };

  const handleClear = () => {
    setQuery('');
    setConversations([]);
    setUsers([]);
    setSearched(false);
    inputRef.current?.focus();
  };

  const openConversation = (conv: any) => {
    Keyboard.dismiss();
    navigation.navigate('ChatWindow', { conversation: conv });
  };

  const openUserChat = (user: SearchUser) => {
    Keyboard.dismiss();
    navigation.navigate('ChatWindow', {
      conversation: {
        _id: 'new',
        type: 'private',
        members: [{ user }],
      },
    });
  };

  const getConvTitle = (item: any) => {
    if (item.type === 'group') {
      return (
        item.name ||
        item.members
          .filter((m: any) => m.user._id !== profile?.id)
          .map((m: any) => m.user.name || m.user.username)
          .slice(0, 2)
          .join(', ') ||
        'Nhóm'
      );
    }
    const other = item.members.find((m: any) => m.user._id !== profile?.id)?.user;
    return other?.nickname || other?.name || other?.username || 'Chat';
  };

  const getConvAvatar = (item: any) => {
    if (item.type === 'group') return item.avatar?.url;
    const other = item.members.find((m: any) => m.user._id !== profile?.id)?.user;
    return other?.avatar;
  };

  const getConvLastMsg = (item: any) => {
    if (!item.lastMessage) return 'Bắt đầu cuộc trò chuyện';
    const isMe = item.lastMessage.sender?._id === profile?.id;
    const isGroup = item.type === 'group';
    const prefix = isMe
      ? 'Bạn: '
      : isGroup
      ? `${item.lastMessage.sender?.name || ''}: `
      : '';
    return `${prefix}${item.lastMessage.message || ''}`;
  };

  const isOtherOnline = (item: any) => {
    if (item.type === 'group') return false;
    const other = item.members.find((m: any) => m.user._id !== profile?.id)?.user;
    return other ? onlineUsers.has(other._id) : false;
  };

  const hasResults = conversations.length > 0 || users.length > 0;

  const listData: any[] = [];
  if (conversations.length > 0) {
    listData.push({ type: 'section', key: 'sec-conv', title: 'Đoạn chat', icon: 'comment-alt' });
    conversations.forEach(c => listData.push({ type: 'conv', key: c._id, data: c }));
  }
  if (users.length > 0) {
    listData.push({ type: 'section', key: 'sec-user', title: 'Mọi người', icon: 'user' });
    users.forEach(u => listData.push({ type: 'user', key: u._id, data: u }));
  }

  const renderListItem = ({ item }: any) => {
    if (item.type === 'section') {
      return (
        <View style={[styles.sectionHeader, { backgroundColor: theme.background }]}>
          <FontAwesome5 name={item.icon as any} size={11} color={theme.textSecondary} />
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{item.title}</Text>
        </View>
      );
    }

    if (item.type === 'conv') {
      const conv = item.data;
      const title = getConvTitle(conv);
      const avatarUri = getConvAvatar(conv);
      const online = isOtherOnline(conv);
      const isGroup = conv.type === 'group';
      return (
        <TouchableOpacity
          style={[styles.resultItem, { borderBottomColor: theme.border }]}
          onPress={() => openConversation(conv)}
          activeOpacity={0.7}
        >
          <View style={styles.avatarWrap}>
            <Image source={{ uri: getAvatarUrl(avatarUri, title) }} style={styles.avatar} />
            {!isGroup && online && (
              <View style={[styles.onlineDot, { backgroundColor: theme.active, borderColor: theme.background }]} />
            )}
            {isGroup && (
              <View style={[styles.groupBadge, { backgroundColor: theme.primary }]}>
                <FontAwesome5 name="users" size={7} color="#fff" />
              </View>
            )}
          </View>
          <View style={styles.resultInfo}>
            <Text style={[styles.resultName, { color: theme.text }]} numberOfLines={1}>{title}</Text>
            <Text style={[styles.resultSub, { color: theme.textSecondary }]} numberOfLines={1}>
              {getConvLastMsg(conv)}
            </Text>
          </View>
          {conv.lastMessage && (
            <Text style={[styles.resultTime, { color: theme.textSecondary }]}>
              {moment(conv.lastMessage.createdAt).format('LT')}
            </Text>
          )}
        </TouchableOpacity>
      );
    }

    if (item.type === 'user') {
      const user: SearchUser = item.data;
      const online = onlineUsers.has(user._id);
      return (
        <TouchableOpacity
          style={[styles.resultItem, { borderBottomColor: theme.border }]}
          onPress={() => openUserChat(user)}
          activeOpacity={0.7}
        >
          <View style={styles.avatarWrap}>
            <Image
              source={{ uri: getAvatarUrl(user.avatar, user.name || user.username) }}
              style={styles.avatar}
            />
            {user.show_online_status && online && (
              <View style={[styles.onlineDot, { backgroundColor: theme.active, borderColor: theme.background }]} />
            )}
          </View>
          <View style={styles.resultInfo}>
            <Text style={[styles.resultName, { color: theme.text }]} numberOfLines={1}>{user.name}</Text>
            <Text style={[styles.resultSub, { color: theme.textSecondary }]} numberOfLines={1}>
              @{user.username}{user.bio ? `  ·  ${user.bio}` : ''}
            </Text>
          </View>
          <View style={[styles.msgIconWrap, { backgroundColor: theme.surface }]}>
            <FontAwesome5 name="comment" size={13} color={theme.primary} {...({ solid: true } as any)} />
          </View>
        </TouchableOpacity>
      );
    }

    return null;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={[styles.searchBar, { backgroundColor: theme.surface }]}>
          <FontAwesome5 name="search" size={15} color={theme.textSecondary} style={styles.searchIcon} />
          <TextInput
            ref={inputRef}
            style={[styles.input, { color: theme.text }]}
            placeholder="Tìm kiếm"
            placeholderTextColor={theme.textSecondary}
            value={query}
            onChangeText={handleChangeText}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
              <View style={[styles.clearCircle, { backgroundColor: theme.textSecondary }]}>
                <MaterialIcons name="close" size={12} color={theme.background} />
              </View>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          onPress={() => { Keyboard.dismiss(); navigation.goBack(); }}
          style={styles.cancelBtn}
        >
          <Text style={[styles.cancelText, { color: theme.primary }]}>Hủy</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={theme.primary} />
        </View>
      ) : !searched ? (
        <View style={styles.idleWrap}>
          <View style={[styles.idleIconCircle, { backgroundColor: theme.surface }]}>
            <FontAwesome5 name="search" size={28} color={theme.primary} />
          </View>
          <Text style={[styles.idleTitle, { color: theme.text }]}>Tìm kiếm</Text>
          <Text style={[styles.idleSub, { color: theme.textSecondary }]}>
            Nhập tên hoặc username để tìm đoạn chat, nhóm hoặc người dùng
          </Text>
        </View>
      ) : !hasResults ? (
        <View style={styles.emptyWrap}>
          <MaterialIcons name="search-off" size={54} color={theme.textSecondary} style={{ opacity: 0.35 }} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Không có kết quả</Text>
          <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
            Không tìm thấy kết quả cho "{query}"
          </Text>
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item: any) => item.key}
          renderItem={renderListItem}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
    borderBottomWidth: 0.5,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    paddingHorizontal: 14,
    height: 42,
  },
  searchIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 16, paddingVertical: 0 },
  clearBtn: { padding: 4 },
  clearCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: { paddingVertical: 6, paddingLeft: 4 },
  cancelText: { fontSize: 16, fontWeight: '600' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingBottom: 30 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 8,
    gap: 7,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.4,
  },
  avatarWrap: { position: 'relative', marginRight: 13 },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  onlineDot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2.5,
  },
  groupBadge: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultInfo: { flex: 1, minWidth: 0 },
  resultName: { fontSize: 15, fontWeight: '600', marginBottom: 3 },
  resultSub: { fontSize: 13 },
  resultTime: { fontSize: 11, marginLeft: 6 },
  msgIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  idleWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  idleIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  idleTitle: { fontSize: 20, fontWeight: '700', marginBottom: 10 },
  idleSub: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});

export default Search;
