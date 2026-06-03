import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Dimensions,
  StatusBar,
} from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { getAvatarUrl } from '../../utils/helper';
import { getUserProfile } from '../../api/user';
import {
  getFriendshipStatus,
  sendFriendRequest,
  unfriend,
  blockUser,
  unblockUser,
  getBlockStatus,
} from '../../api/friendship';
import client from '../../api/client';
import moment from 'moment';
import 'moment/locale/vi';

moment.locale('vi');

const { width } = Dimensions.get('window');

const UserProfile = ({ route, navigation }: any) => {
  const { userId, user: initialUser } = route.params || {};
  const { theme } = useTheme();
  const { profile } = useAuth();
  const { onlineUsers } = useSocket();

  const [user, setUser] = useState<any>(initialUser || null);
  const [loading, setLoading] = useState(!initialUser);
  const [statusLoading, setStatusLoading] = useState(false);
  const [friendStatus, setFriendStatus] = useState<'none' | 'pending' | 'accepted' | 'blocked'>('none');
  const [iAmRequester, setIAmRequester] = useState(false);
  const [iBlockedThem, setIBlockedThem] = useState(false);
  const [theyBlockedMe, setTheyBlockedMe] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [zoomVisible, setZoomVisible] = useState(false);

  const targetId = userId || initialUser?._id || initialUser?.id;
  const isOnline = targetId ? onlineUsers.has(targetId) : false;

  const load = useCallback(async () => {
    if (!targetId) return;
    try {
      if (!initialUser) setLoading(true);
      setStatusLoading(true);
      const [profileData, statusData, blockData] = await Promise.all([
        initialUser ? Promise.resolve(initialUser) : getUserProfile(targetId),
        getFriendshipStatus(targetId),
        getBlockStatus(targetId),
      ]);
      if (!initialUser) setUser(profileData);
      setFriendStatus(statusData.status);
      setIAmRequester(statusData.requester?.toString() === profile?.id?.toString());
      setIBlockedThem(blockData.iBlockedThem);
      setTheyBlockedMe(blockData.theyBlockedMe);
    } catch {
      if (!initialUser) Toast.show({ type: 'error', text1: 'Không thể tải hồ sơ' });
    } finally {
      setLoading(false);
      setStatusLoading(false);
    }
  }, [targetId, profile?.id]);

  useEffect(() => { load(); }, [load]);

  const goToChat = async () => {
    try {
      const { data } = await client.post('/conversation/create', { type: 'private', members: [targetId] });
      navigation.navigate('ChatWindow', { conversation: data.conversation });
    } catch {
      navigation.navigate('ChatWindow', { conversation: { _id: 'new', type: 'private', members: [{ user }] } });
    }
  };

  const handleAddFriend = async () => {
    try {
      setActionLoading(true);
      await sendFriendRequest(targetId);
      setFriendStatus('pending');
      setIAmRequester(true);
      Toast.show({ type: 'success', text1: 'Đã gửi lời mời kết bạn' });
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e?.response?.data?.error || 'Thao tác thất bại' });
    } finally { setActionLoading(false); }
  };

  const handleCancelRequest = async () => {
    try {
      setActionLoading(true);
      await client.post('/friendship/cancel', { receiverId: targetId });
      setFriendStatus('none');
      Toast.show({ type: 'success', text1: 'Đã hủy lời mời' });
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e?.response?.data?.error || 'Thao tác thất bại' });
    } finally { setActionLoading(false); }
  };

  const handleAcceptRequest = async () => {
    try {
      setActionLoading(true);
      await client.post('/friendship/accept', { requesterId: targetId });
      setFriendStatus('accepted');
      Toast.show({ type: 'success', text1: 'Đã chấp nhận lời mời kết bạn' });
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e?.response?.data?.error || 'Thao tác thất bại' });
    } finally { setActionLoading(false); }
  };

  const handleUnfriend = () => {
    Alert.alert('Hủy kết bạn', `Hủy kết bạn với ${user?.name}?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Hủy kết bạn', style: 'destructive',
        onPress: async () => {
          try {
            setActionLoading(true);
            await unfriend(targetId);
            setFriendStatus('none');
            Toast.show({ type: 'success', text1: 'Đã hủy kết bạn' });
          } catch { Toast.show({ type: 'error', text1: 'Thao tác thất bại' }); }
          finally { setActionLoading(false); }
        },
      },
    ]);
  };

  const handleBlock = () => {
    Alert.alert('Chặn người dùng', `Chặn ${user?.name}? Họ sẽ không thể gửi tin nhắn cho bạn.`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Chặn', style: 'destructive',
        onPress: async () => {
          try {
            setActionLoading(true);
            await blockUser(targetId);
            setIBlockedThem(true);
            setFriendStatus('blocked');
            Toast.show({ type: 'success', text1: `Đã chặn ${user?.name}` });
          } catch { Toast.show({ type: 'error', text1: 'Thao tác thất bại' }); }
          finally { setActionLoading(false); }
        },
      },
    ]);
  };

  const handleUnblock = () => {
    Alert.alert('Bỏ chặn', `Bỏ chặn ${user?.name}?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Bỏ chặn',
        onPress: async () => {
          try {
            setActionLoading(true);
            await unblockUser(targetId);
            setIBlockedThem(false);
            setFriendStatus('none');
            Toast.show({ type: 'success', text1: `Đã bỏ chặn ${user?.name}` });
          } catch { Toast.show({ type: 'error', text1: 'Thao tác thất bại' }); }
          finally { setActionLoading(false); }
        },
      },
    ]);
  };

  const renderFriendStatusIcon = () => {
    if (actionLoading || statusLoading) {
      return (
        <View style={styles.actionBtnContainer}>
          <View style={[styles.circleIcon, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <ActivityIndicator size="small" color="#fff" />
          </View>
          <Text style={styles.circleBtnLabel}>...</Text>
        </View>
      );
    }

    if (iBlockedThem) {
      return (
        <TouchableOpacity style={styles.actionBtnContainer} onPress={handleUnblock} activeOpacity={0.7}>
          <View style={[styles.circleIcon, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <MaterialIcons name="block" size={24} color="#FF6B6B" />
          </View>
          <Text style={styles.circleBtnLabel}>Đã chặn</Text>
        </TouchableOpacity>
      );
    }

    if (theyBlockedMe) return null;

    if (friendStatus === 'accepted') {
      return (
        <TouchableOpacity style={styles.actionBtnContainer} onPress={handleUnfriend} activeOpacity={0.7}>
          <View style={[styles.circleIcon, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <FontAwesome5 name="user-check" size={20} color="#fff" {...({ solid: true } as any)} />
          </View>
          <Text style={styles.circleBtnLabel}>Bạn bè</Text>
        </TouchableOpacity>
      );
    }

    if (friendStatus === 'pending' && iAmRequester) {
      return (
        <TouchableOpacity style={styles.actionBtnContainer} onPress={handleCancelRequest} activeOpacity={0.7}>
          <View style={[styles.circleIcon, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <FontAwesome5 name="user-clock" size={20} color="rgba(255,255,255,0.7)" />
          </View>
          <Text style={styles.circleBtnLabel}>Đã mời</Text>
        </TouchableOpacity>
      );
    }

    if (friendStatus === 'pending' && !iAmRequester) {
      return (
        <TouchableOpacity style={styles.actionBtnContainer} onPress={handleAcceptRequest} activeOpacity={0.7}>
          <View style={[styles.circleIcon, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <FontAwesome5 name="user-plus" size={20} color="#fff" {...({ solid: true } as any)} />
          </View>
          <Text style={styles.circleBtnLabel}>Chấp nhận</Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity style={styles.actionBtnContainer} onPress={handleAddFriend} activeOpacity={0.7}>
        <View style={[styles.circleIcon, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
          <FontAwesome5 name="user-plus" size={20} color="#fff" {...({ solid: true } as any)} />
        </View>
        <Text style={styles.circleBtnLabel}>Kết bạn</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center' }]}>
        <FontAwesome5 name="user-slash" size={40} color={theme.textSecondary} />
        <Text style={{ color: theme.textSecondary, marginTop: 12 }}>Không tìm thấy người dùng</Text>
      </View>
    );
  }

  const avatarUrl = getAvatarUrl(user.avatar, user.name || user.username);
  const isBlocked = iBlockedThem || theyBlockedMe;
  const statusLine = isOnline && user.show_online_status
    ? 'Đang hoạt động'
    : user.last_seen
    ? `Hoạt động ${moment(user.last_seen).fromNow()}`
    : null;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <TouchableOpacity
        style={[styles.backAbsolute, { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 20 }]}
        onPress={() => navigation.goBack()}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <FontAwesome5 name="arrow-left" size={16} color="#fff" />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={[theme.primary + 'CC', theme.primary + '40', 'transparent']}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />

          <View style={styles.heroSection}>
            <TouchableOpacity onPress={() => setZoomVisible(true)} activeOpacity={0.85} style={styles.avatarWrap}>
              <View style={[styles.avatarRing, { borderColor: 'rgba(255,255,255,0.6)' }]}>
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              </View>
              {isOnline && user.show_online_status && (
                <View style={[styles.onlineDot, { backgroundColor: theme.active, borderColor: theme.background }]} />
              )}
            </TouchableOpacity>

            <Text style={[styles.name, { color: '#fff' }]}>{user.name}</Text>

            {user.bio ? (
              <Text style={styles.bioText}>{user.bio}</Text>
            ) : null}

            {statusLine && (
              <View style={[styles.statusPill, { backgroundColor: isOnline && user.show_online_status ? theme.active + '30' : 'rgba(255,255,255,0.1)' }]}>
                <View style={[styles.statusDot, { backgroundColor: isOnline && user.show_online_status ? theme.active : 'rgba(255,255,255,0.5)' }]} />
                <Text style={[styles.statusPillText, { color: isOnline && user.show_online_status ? theme.active : 'rgba(255,255,255,0.7)' }]}>
                  {statusLine}
                </Text>
              </View>
            )}

            <View style={styles.actionRow}>
              {!isBlocked && (
                <TouchableOpacity style={styles.actionBtnContainer} onPress={goToChat} activeOpacity={0.75}>
                  <View style={[styles.circleIcon, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                    <FontAwesome5 name="comment" size={22} color="#fff" {...({ solid: true } as any)} />
                  </View>
                  <Text style={styles.circleBtnLabel}>Nhắn tin</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.actionBtnContainer}
                onPress={() => !isBlocked && navigation.navigate('VoiceCall', { otherMember: user, conversation: { _id: 'new', type: 'private', members: [{ user }] } })}
                activeOpacity={isBlocked ? 1 : 0.75}
              >
                <View style={[styles.circleIcon, { backgroundColor: 'rgba(255,255,255,0.15)', opacity: isBlocked ? 0.35 : 1 }]}>
                  <FontAwesome5 name="phone-alt" size={20} color="#fff" {...({ solid: true } as any)} />
                </View>
                <Text style={[styles.circleBtnLabel, { opacity: isBlocked ? 0.35 : 1 }]}>Gọi</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtnContainer}
                onPress={() => !isBlocked && navigation.navigate('VideoCall', { otherMember: user, conversation: { _id: 'new', type: 'private', members: [{ user }] } })}
                activeOpacity={isBlocked ? 1 : 0.75}
              >
                <View style={[styles.circleIcon, { backgroundColor: 'rgba(255,255,255,0.15)', opacity: isBlocked ? 0.35 : 1 }]}>
                  <FontAwesome5 name="video" size={20} color="#fff" {...({ solid: true } as any)} />
                </View>
                <Text style={[styles.circleBtnLabel, { opacity: isBlocked ? 0.35 : 1 }]}>Video</Text>
              </TouchableOpacity>

              {renderFriendStatusIcon()}
            </View>
          </View>
        </View>

        <View style={styles.contentSection}>
          <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>THÔNG TIN CÁ NHÂN</Text>
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <View style={[styles.listRow, { borderBottomColor: theme.border }]}>
              <View style={styles.listIconText}>
                <FontAwesome5 name="at" size={16} color={theme.textSecondary} style={styles.rowIcon} />
                <Text style={[styles.listLabel, { color: theme.text }]}>@{user.username}</Text>
              </View>
            </View>

            {user.phone && (
              <View style={[styles.listRow, { borderBottomColor: 'transparent' }]}>
                <View style={styles.listIconText}>
                  <FontAwesome5 name="phone" size={16} color={theme.textSecondary} style={styles.rowIcon} {...({ solid: true } as any)} />
                  <Text style={[styles.listLabel, { color: theme.text }]}>{user.phone}</Text>
                </View>
              </View>
            )}
          </View>

          <Text style={[styles.sectionHeader, { color: theme.textSecondary, marginTop: 24 }]}>QUYỀN RIÊNG TƯ</Text>
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <TouchableOpacity
              style={[styles.listRow, { borderBottomColor: 'transparent' }]}
              onPress={iBlockedThem ? handleUnblock : handleBlock}
              activeOpacity={0.7}
            >
              <View style={styles.listIconText}>
                <MaterialIcons name="block" size={20} color={iBlockedThem ? theme.text : '#FF4D4F'} style={styles.rowIcon} />
                <Text style={[styles.listLabel, { color: iBlockedThem ? theme.text : '#FF4D4F' }]}>
                  {iBlockedThem ? 'Bỏ chặn' : 'Chặn người dùng'}
                </Text>
              </View>
              <FontAwesome5 name="chevron-right" size={12} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal visible={zoomVisible} transparent animationType="fade" onRequestClose={() => setZoomVisible(false)}>
        <View style={styles.zoomOverlay}>
          <TouchableOpacity style={styles.zoomClose} onPress={() => setZoomVisible(false)}>
            <View style={styles.zoomCloseCircle}>
              <FontAwesome5 name="times" size={18} color="#fff" />
            </View>
          </TouchableOpacity>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
            maximumZoomScale={4}
            minimumZoomScale={1}
          >
            <Image source={{ uri: avatarUrl }} style={styles.zoomImage} resizeMode="contain" />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  backAbsolute: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    zIndex: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 320,
    opacity: 0.85,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 100 : 80,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  avatarWrap: { 
    position: 'relative', 
    marginBottom: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  avatarBorder: {
    padding: 3,
    borderRadius: 60,
    borderWidth: 2.5,
  },
  avatarRing: {
    padding: 3,
    borderRadius: 60,
    borderWidth: 2.5,
  },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  onlineDot: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
    zIndex: 10,
  },
  name: { fontSize: 26, fontWeight: '800', marginBottom: 4, textAlign: 'center' },
  statusLine: { fontSize: 14, marginBottom: 8, fontWeight: '500' },
  bio: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 10, paddingHorizontal: 30, opacity: 0.8 },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    width: '100%',
    paddingHorizontal: 10,
  },
  actionBtnContainer: {
    alignItems: 'center',
    flex: 1,
    maxWidth: 80,
  },
  circleIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  circleBtnLabel: { fontSize: 12, fontWeight: '600', textAlign: 'center', color: 'rgba(255,255,255,0.85)' },
  bioText: { fontSize: 14, textAlign: 'center', lineHeight: 20, color: 'rgba(255,255,255,0.7)', paddingHorizontal: 28, marginBottom: 10 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 18,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusPillText: { fontSize: 13, fontWeight: '600' },
  contentSection: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  card: {
    borderRadius: 16,
    paddingVertical: 4,
    marginTop: 8,
    overflow: 'hidden',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    paddingHorizontal: 4,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  listIconText: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowIcon: {
    width: 24,
    marginRight: 12,
  },
  listLabel: { fontSize: 16, fontWeight: '500' },
  zoomOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.96)' },
  zoomClose: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 20,
    right: 16,
    zIndex: 10,
  },
  zoomCloseCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomImage: { width: width, height: width },
});

export default UserProfile;
