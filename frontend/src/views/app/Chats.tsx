import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { getConversations } from '../../api/chat';
import { getFriends, getBlockedUsers } from '../../api/friendship';
import moment from 'moment';
import { getAvatarUrl } from '../../utils/helper';

const Chats = ({ navigation }: any) => {
  const { theme } = useTheme();
  const { profile } = useAuth();
  const { onlineUsers, socket } = useSocket();
  const [conversations, setConversations] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    try {
      const [convs, blocked] = await Promise.all([
        getConversations(),
        getBlockedUsers(),
      ]);
      setConversations(convs);
      setBlockedIds(new Set((blocked || []).map((u: any) => u._id)));
    } catch {}
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  useEffect(() => {
    if (!socket) return;

    const handleBlocked = ({ blockedBy, targetId }: any) => {
      if (blockedBy?.toString() === profile?.id?.toString()) {
        setBlockedIds(prev => new Set([...prev, targetId]));
      }
    };

    const handleUnblocked = ({ unblockedBy, targetId }: any) => {
      if (unblockedBy?.toString() === profile?.id?.toString()) {
        setBlockedIds(prev => {
          const next = new Set(prev);
          next.delete(targetId);
          return next;
        });
      }
    };

    socket.on('user-blocked', handleBlocked);
    socket.on('user-unblocked', handleUnblocked);

    return () => {
      socket.off('user-blocked', handleBlocked);
      socket.off('user-unblocked', handleUnblocked);
    };
  }, [socket, profile?.id]);

  const renderActiveUserItem = ({ item }: any) => {
    const isOnline = onlineUsers.has(item._id);
    const existingConv = conversations.find(
      conv =>
        conv.type === 'private' &&
        conv.members.some((m: any) => m.user._id === item._id),
    );

    return (
      <TouchableOpacity
        style={styles.storyItem}
        activeOpacity={0.8}
        onPress={() =>
          navigation.navigate('ChatWindow', {
            conversation: existingConv || {
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
    const isBlockedConv = !isGroupConversation && otherMember && blockedIds.has(otherMember._id);

    const lastMsgPreview = () => {
      if (!item.lastMessage) return 'Bắt đầu cuộc trò chuyện';
      const prefix =
        item.lastMessage.sender?._id === profile?.id
          ? 'Bạn: '
          : isGroupConversation
          ? `${item.lastMessage.sender?.name || item.lastMessage.sender?.username || ''}: `
          : '';
      return `${prefix}${item.lastMessage.message}`;
    };

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        activeOpacity={0.75}
        onPress={() => navigation.navigate('ChatWindow', { conversation: item })}
      >
        <View style={styles.avatarContainer}>
          <Image
            source={{
              uri: getAvatarUrl(
                isGroupConversation ? undefined : otherMember?.avatar,
                conversationTitle,
              ),
            }}
            style={[styles.avatar, isBlockedConv && styles.avatarBlocked]}
          />
          {isBlockedConv ? (
            <View style={[styles.blockedBadge, { backgroundColor: theme.background }]}>
              <MaterialIcons name="block" size={12} color="#FF6B6B" />
            </View>
          ) : isOnline ? (
            <View
              style={[
                styles.onlineIndicator,
                { backgroundColor: theme.active, borderColor: theme.background },
              ]}
            />
          ) : null}
        </View>

        <View style={styles.conversationInfo}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.conversationName,
                { color: isBlockedConv ? theme.textSecondary : theme.text },
              ]}
              numberOfLines={1}
            >
              {conversationTitle}
            </Text>
            {isBlockedConv && (
              <View style={styles.blockedTag}>
                <MaterialIcons name="block" size={10} color="#FF6B6B" />
                <Text style={styles.blockedTagText}>Đã chặn</Text>
              </View>
            )}
          </View>
          <Text
            style={[
              styles.lastMessage,
              { color: isBlockedConv ? theme.textSecondary + '80' : theme.textSecondary },
            ]}
            numberOfLines={1}
          >
            {isBlockedConv ? 'Bạn đã chặn người này' : lastMsgPreview()}
          </Text>
        </View>

        <View style={styles.metaCol}>
          <Text style={[styles.time, { color: theme.textSecondary }]}>
            {item.lastMessage ? moment(item.lastMessage.createdAt).format('LT') : ''}
          </Text>
        </View>
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
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile')}
            style={styles.userAvatarContainer}
          >
            <Image
              source={{ uri: getAvatarUrl(profile?.avatar, profile?.name) }}
              style={styles.userAvatar}
            />
            <View
              style={[
                styles.userStatusIndicator,
                {
                  backgroundColor: profile?.show_online_status
                    ? theme.active
                    : theme.surface,
                  borderColor: theme.background,
                },
              ]}
            >
              {!profile?.show_online_status && (
                <FontAwesome5
                  name="moon"
                  size={8}
                  color={theme.textSecondary}
                  {...({ solid: true } as any)}
                />
              )}
            </View>
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>Đoạn chat</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: theme.surface }]}>
            <FontAwesome5
              name={'camera' as any}
              size={18}
              color={theme.text}
              {...({ solid: true } as any)}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: theme.surface }]}
            onPress={() => navigation.navigate('CreateGroup')}
          >
            <FontAwesome5
              name={'pen' as any}
              size={18}
              color={theme.text}
              {...({ solid: true } as any)}
            />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.navigate('Search')}
        style={[styles.searchBar, { backgroundColor: theme.surface }]}
      >
        <FontAwesome5
          name={'search' as any}
          size={16}
          color={theme.textSecondary}
          style={styles.searchIcon}
        />
        <Text style={[styles.searchPlaceholder, { color: theme.textSecondary }]}>Tìm kiếm</Text>
      </TouchableOpacity>

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
    paddingHorizontal: 14,
    borderRadius: 22,
    height: 42,
    marginBottom: 16,
  },
  searchIcon: { marginRight: 10 },
  searchPlaceholder: { fontSize: 16 },
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
    paddingVertical: 6,
    marginBottom: 6,
  },
  avatarContainer: { position: 'relative', marginRight: 12 },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarBlocked: { opacity: 0.45 },
  onlineIndicator: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
  },
  blockedBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FF6B6B30',
  },
  conversationInfo: { flex: 1, minWidth: 0 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
    gap: 6,
  },
  conversationName: { fontSize: 16, fontWeight: '600', flexShrink: 1 },
  blockedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FF6B6B18',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  blockedTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  lastMessage: { fontSize: 13 },
  metaCol: { alignItems: 'flex-end', justifyContent: 'center', marginLeft: 8 },
  time: { fontSize: 11 },
});

export default Chats;
