import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import { getAvatarUrl } from '../../utils/helper';
import { NotificationItem } from '../../api/notification';
import moment from 'moment';
import 'moment/locale/vi';

moment.locale('vi');

const typeConfig = {
  message: { icon: 'comment-alt', color: '#0084FF', label: 'Tin nhắn' },
  call: { icon: 'phone-alt', color: '#31A24C', label: 'Cuộc gọi' },
  friend_request: { icon: 'user-plus', color: '#7C3AED', label: 'Kết bạn' },
  group_invite: { icon: 'users', color: '#FF6B00', label: 'Nhóm' },
};

const Notifications = ({ navigation }: any) => {
  const { theme } = useTheme();
  const {
    notifications,
    unreadCount,
    loadNotifications,
    handleMarkAllRead,
    handleMarkOneRead,
    handleDelete,
    handleDeleteAll,
  } = useNotifications();

  useEffect(() => {
    loadNotifications();
  }, []);

  const confirmDeleteAll = () => {
    Alert.alert(
      'Xóa tất cả',
      'Bạn có chắc muốn xóa toàn bộ thông báo?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xóa', style: 'destructive', onPress: handleDeleteAll },
      ],
    );
  };

  const handlePress = (item: NotificationItem) => {
    if (!item.isRead) handleMarkOneRead(item._id);
    if (item.conversationId) {
      navigation.navigate('ChatWindow', {
        conversation: { _id: item.conversationId },
      });
    }
  };

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const cfg = typeConfig[item.type] || typeConfig.message;
    const senderName = item.sender?.name || item.sender?.username || 'Hệ thống';

    return (
      <TouchableOpacity
        style={[
          styles.item,
          {
            backgroundColor: item.isRead ? theme.background : theme.surface,
            borderBottomColor: theme.border,
          },
        ]}
        onPress={() => handlePress(item)}
        activeOpacity={0.75}
      >
        <View style={styles.avatarWrap}>
          <Image
            source={{ uri: getAvatarUrl(item.sender?.avatar, senderName) }}
            style={styles.avatar}
          />
          <View style={[styles.typeBadge, { backgroundColor: cfg.color }]}>
            <FontAwesome5 name={cfg.icon as any} size={9} color="#fff" {...({ solid: true } as any)} />
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.topRow}>
            <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
              {senderName}
            </Text>
            <Text style={[styles.time, { color: theme.textSecondary }]}>
              {moment(item.createdAt).fromNow(true)}
            </Text>
          </View>
          <Text
            style={[
              styles.content,
              { color: item.isRead ? theme.textSecondary : theme.text },
            ]}
            numberOfLines={2}
          >
            {item.content}
          </Text>
        </View>

        <View style={styles.rightCol}>
          {!item.isRead && (
            <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />
          )}
          <TouchableOpacity
            onPress={() => handleDelete(item._id)}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            style={styles.deleteBtn}
          >
            <MaterialIcons name="close" size={16} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <FontAwesome5 name="arrow-left" size={18} color={theme.primary} />
        </TouchableOpacity>
        <View style={styles.titleWrap}>
          <Text style={[styles.title, { color: theme.text }]}>Thông báo</Text>
          {unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: theme.primary }]}>
              <Text style={styles.badgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.headerRight}>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={handleMarkAllRead} style={styles.actionBtn}>
              <FontAwesome5 name="check-double" size={16} color={theme.primary} />
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity onPress={confirmDeleteAll} style={styles.actionBtn}>
              <FontAwesome5 name="trash-alt" size={15} color="#FF4D4F" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyWrap}>
          <View style={[styles.emptyIconCircle, { backgroundColor: theme.surface }]}>
            <FontAwesome5 name="bell-slash" size={30} color={theme.textSecondary} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Không có thông báo</Text>
          <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
            Các thông báo về tin nhắn, cuộc gọi và lời mời kết bạn sẽ xuất hiện ở đây
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 14,
    borderBottomWidth: 0.5,
  },
  backBtn: { padding: 4, marginRight: 12 },
  titleWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 20, fontWeight: '800' },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  headerRight: { flexDirection: 'row', gap: 4 },
  actionBtn: { padding: 8 },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.4,
    gap: 12,
  },
  avatarWrap: { position: 'relative' },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  typeBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, minWidth: 0 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  name: { fontSize: 14, fontWeight: '700', flexShrink: 1 },
  time: { fontSize: 12, marginLeft: 8 },
  content: { fontSize: 13, lineHeight: 19 },
  rightCol: { alignItems: 'center', gap: 6 },
  unreadDot: { width: 9, height: 9, borderRadius: 5 },
  deleteBtn: { padding: 2 },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom: 80,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 10 },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
});

export default Notifications;
