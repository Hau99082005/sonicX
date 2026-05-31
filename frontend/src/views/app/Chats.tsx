import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { getConversations } from '../../api/chat';
import { getFriends } from '../../api/friendship';
import moment from 'moment';
import { getAvatarUrl } from '../../utils/helper';

const Chats = ({ navigation }: any) => {
  const { theme } = useTheme();
  const { profile } = useAuth();
  const { onlineUsers } = useSocket();
  const [conversations, setConversations] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const convs = await getConversations();
        setConversations(convs);
      } catch {}
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const data = await getFriends();
        setFriends(data || []);
      } catch {
        setFriends([]);
      }
    };
    fetchFriends();
  }, []);

  const renderActiveUserItem = ({ item }: any) => {
    const isOnline = onlineUsers.has(item._id);
    return (
      <TouchableOpacity
        style={styles.storyItem}
        activeOpacity={0.8}
        onPress={() =>
          navigation.navigate('ChatWindow', {
            conversation: {
              _id: 'new',
              members: [{ user: item }],
              name: item.name,
              type: 'private',
            },
          })
        }
      >
        <View style={styles.storyAvatarContainer}>
          <Image
            source={{ uri: getAvatarUrl(item.avatar, item.name || item.username) }}
            style={styles.storyAvatar}
          />
          <View
            style={[
              styles.storyOnlineIndicator,
              {
                backgroundColor: isOnline ? theme.active : theme.textSecondary,
                borderColor: theme.background,
              },
            ]}
          />
        </View>
        <Text style={[styles.storyName, { color: theme.text }]} numberOfLines={1}>
          {item.name || item.username}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderConversationItem = ({ item }: any) => {
    const isGroupConversation = item.type === 'group';
    const otherMember = item.members.find((m: any) => m.user._id !== profile?.id)?.user;
    const groupNames = item.members
      .filter((m: any) => m.user._id !== profile?.id)
      .map((m: any) => m.user.name || m.user.username)
      .slice(0, 2)
      .join(', ');
    const conversationTitle = isGroupConversation
      ? item.name || groupNames || 'Nhóm'
      : otherMember?.name || otherMember?.username || 'Chat';
    const isOnline = otherMember ? onlineUsers.has(otherMember._id) : false;

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => navigation.navigate('ChatWindow', { conversation: item })}
      >
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: getAvatarUrl(isGroupConversation ? undefined : otherMember?.avatar, conversationTitle) }}
            style={styles.avatar}
          />
          {isOnline && (
            <View style={[styles.onlineIndicator, { backgroundColor: theme.active, borderColor: theme.background }]} />
          )}
        </View>
        <View style={styles.conversationInfo}>
          <Text style={[styles.conversationName, { color: theme.text }]}>{conversationTitle}</Text>
          <Text style={[styles.lastMessage, { color: theme.textSecondary }]} numberOfLines={1}>
            {item.lastMessage
              ? `${item.lastMessage.sender?._id === profile?.id
                  ? 'Bạn: '
                  : isGroupConversation
                  ? `${item.lastMessage.sender?.name || item.lastMessage.sender?.username || ''}: `
                  : ''}${item.lastMessage.message}`
              : 'Bắt đầu cuộc trò chuyện'}
          </Text>
        </View>
        <Text style={[styles.time, { color: theme.textSecondary }]}>
          {item.lastMessage ? moment(item.lastMessage.createdAt).format('LT') : ''}
        </Text>
      </TouchableOpacity>
    );
  };

  const ActiveUsersHeader = () => (
    <View style={[styles.storiesRow, { borderBottomColor: theme.border }]}>
      <TouchableOpacity style={styles.storyItem}>
        <View style={[styles.addStoryBtn, { backgroundColor: theme.surface }]}>
          <FontAwesome5 name={'plus' as any} size={22} color={theme.text} />
        </View>
        <Text style={[styles.storyName, { color: theme.text }]}>Tin của bạn</Text>
      </TouchableOpacity>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={friends}
        keyExtractor={(item: any) => item._id}
        renderItem={renderActiveUserItem}
        ListEmptyComponent={
          <View style={styles.emptyFriends}>
            <Text style={[styles.emptyFriendsText, { color: theme.textSecondary }]}>
              Chưa có bạn bè
            </Text>
          </View>
        }
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.userAvatarContainer}>
            <Image source={{ uri: getAvatarUrl(profile?.avatar, profile?.name) }} style={styles.userAvatar} />
            <View
              style={[
                styles.userStatusIndicator,
                {
                  backgroundColor: profile?.show_online_status ? theme.active : theme.surface,
                  borderColor: theme.background,
                },
              ]}
            >
              {!profile?.show_online_status && (
                <FontAwesome5 name="moon" size={8} color={theme.textSecondary} {...({ solid: true } as any)} />
              )}
            </View>
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>Đoạn chat</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: theme.surface }]}>
            <FontAwesome5 name={'camera' as any} size={18} color={theme.text} {...({ solid: true } as any)} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: theme.surface }]}
            onPress={() => navigation.navigate('CreateGroup')}
          >
            <FontAwesome5 name={'pen' as any} size={18} color={theme.text} {...({ solid: true } as any)} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.searchBar, { backgroundColor: theme.surface }]}>
        <FontAwesome5 name={'search' as any} size={16} color={theme.textSecondary} style={styles.searchIcon} />
        <TextInput
          placeholder="Tìm kiếm"
          placeholderTextColor={theme.textSecondary}
          style={[styles.searchInput, { color: theme.text }]}
        />
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item: any) => item._id}
        renderItem={renderConversationItem}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<ActiveUsersHeader />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 50 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  userAvatarContainer: { position: 'relative', marginRight: 12 },
  userAvatar: { width: 40, height: 40, borderRadius: 20 },
  userStatusIndicator: {
    position: 'absolute',
    right: -2,
    bottom: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 26, fontWeight: 'bold' },
  headerIcons: { flexDirection: 'row' },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 20,
    height: 40,
    marginBottom: 16,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16 },
  storiesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingBottom: 16,
    marginBottom: 8,
    borderBottomWidth: 0.5,
  },
  storyItem: { alignItems: 'center', marginRight: 16, width: 68 },
  storyAvatarContainer: {
    width: 62,
    height: 62,
    borderRadius: 31,
    position: 'relative',
    marginBottom: 6,
  },
  storyAvatar: { width: '100%', height: '100%', borderRadius: 31 },
  storyOnlineIndicator: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 15,
    height: 15,
    borderRadius: 8,
    borderWidth: 2.5,
  },
  addStoryBtn: {
    width: 62,
    height: 62,
    borderRadius: 31,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  storyName: { fontSize: 12, textAlign: 'center', fontWeight: '500' },
  emptyFriends: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 68,
  },
  emptyFriendsText: { fontSize: 13 },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: { position: 'relative', marginRight: 12 },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  onlineIndicator: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
  },
  conversationInfo: { flex: 1 },
  conversationName: { fontSize: 17, fontWeight: '600', marginBottom: 2 },
  lastMessage: { fontSize: 14 },
  time: { fontSize: 12 },
});

export default Chats;
