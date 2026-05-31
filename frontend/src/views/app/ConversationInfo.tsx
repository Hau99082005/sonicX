import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
} from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../context/ThemeContext';
import { getAvatarUrl } from '../../utils/helper';
import { updateNickname } from '../../api/friendship';

const ConversationInfo = ({ route, navigation }: any) => {
  const { theme } = useTheme();
  const { otherMember, conversation } = route.params || {};

  const isGroupConversation = conversation?.type === 'group';
  const groupMembers = conversation?.members || [];

  const name = isGroupConversation
    ? conversation?.name ||
      groupMembers
        .map((m: any) => m.user.name || m.user.username)
        .slice(0, 2)
        .join(', ') ||
      'Nhóm'
    : otherMember?.name || conversation?.name || 'Người dùng';

  const avatar = isGroupConversation
    ? conversation?.avatar?.url
    : otherMember?.avatar;

  const friendId = otherMember?._id || otherMember?.id;

  const [zoomVisible, setZoomVisible] = useState(false);
  const [memberDetailVisible, setMemberDetailVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [membersModalVisible, setMembersModalVisible] = useState(false);
  const [nicknameModalVisible, setNicknameModalVisible] = useState(false);
  const [nicknameInput, setNicknameInput] = useState(otherMember?.nickname || '');
  const [nickname, setNickname] = useState(otherMember?.nickname || '');
  const [isSaving, setIsSaving] = useState(false);

  const openNicknameModal = () => {
    setNicknameInput(nickname);
    setNicknameModalVisible(true);
  };

  const openMembersModal = () => setMembersModalVisible(true);

  const openMemberDetail = (member: any) => {
    setSelectedMember(member);
    setMemberDetailVisible(true);
  };

  const handleSaveNickname = async () => {
    if (!friendId) {
      Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Không thể xác định bạn bè' });
      return;
    }
    try {
      setIsSaving(true);
      const trimmed = nicknameInput.trim();
      await updateNickname(friendId, trimmed);
      setNickname(trimmed);
      Toast.show({ type: 'success', text1: 'Thành công', text2: 'Đã lưu biệt danh' });
      setNicknameModalVisible(false);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: error?.response?.data?.error || 'Lưu biệt danh thất bại',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <FontAwesome5 name={'arrow-left' as any} size={20} color={theme.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Thông tin</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled={true}>
        <View style={[styles.profileSection, { backgroundColor: theme.surface }]}>
          <TouchableOpacity onPress={() => setZoomVisible(true)} activeOpacity={0.85}>
            <View style={styles.avatarWrapper}>
              <Image
                source={{ uri: getAvatarUrl(avatar, name) }}
                style={styles.avatar}
              />
            </View>
          </TouchableOpacity>
          <Text style={[styles.profileName, { color: theme.text }]}>{name}</Text>
          <Text style={[styles.profileSub, { color: theme.textSecondary }]}>
            {isGroupConversation
              ? `${groupMembers.length} thành viên`
              : otherMember?.bio || 'Không có mô tả'}
          </Text>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('VoiceCall', { otherMember, conversation })}
            >
              <View style={[styles.actionIcon, { backgroundColor: theme.background }]}>
                <FontAwesome5 name={'phone-alt' as any} size={18} color={theme.primary} />
              </View>
              <Text style={[styles.actionLabel, { color: theme.text }]}>Gọi</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('VideoCall', { otherMember, conversation })}
            >
              <View style={[styles.actionIcon, { backgroundColor: theme.background }]}>
                <FontAwesome5 name={'video' as any} size={18} color={theme.primary} />
              </View>
              <Text style={[styles.actionLabel, { color: theme.text }]}>Video</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
              <View style={[styles.actionIcon, { backgroundColor: theme.background }]}>
                <FontAwesome5 name={'user' as any} size={18} color={theme.primary} />
              </View>
              <Text style={[styles.actionLabel, { color: theme.text }]}>Hồ sơ</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
              <View style={[styles.actionIcon, { backgroundColor: theme.background }]}>
                <FontAwesome5 name={'bell-slash' as any} size={18} color={theme.primary} />
              </View>
              <Text style={[styles.actionLabel, { color: theme.text }]}>Tắt thông báo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {isGroupConversation && (
          <View style={[styles.section, { backgroundColor: theme.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>THÀNH VIÊN</Text>
            <TouchableOpacity
              style={[styles.row, { borderBottomColor: theme.border }]}
              onPress={openMembersModal}
            >
              <View style={[styles.rowIconWrap, { backgroundColor: theme.background }]}>
                <FontAwesome5 name={'users' as any} size={16} color={theme.primary} />
              </View>
              <View style={styles.rowContent}>
                <Text style={[styles.rowLabel, { color: theme.text }]}>Xem thành viên</Text>
                <Text style={[styles.rowSub, { color: theme.textSecondary }]}>
                  {groupMembers.length} người
                </Text>
              </View>
              <FontAwesome5 name={'chevron-right' as any} size={14} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>TÙY CHỈNH</Text>

          <TouchableOpacity style={[styles.row, { borderBottomColor: theme.border }]}>
            <View style={[styles.rowIconWrap, { backgroundColor: '#FF6B6B20' }]}>
              <FontAwesome5 name={'palette' as any} size={16} color="#FF6B6B" />
            </View>
            <Text style={[styles.rowLabel, { color: theme.text }]}>Màu sắc chủ đề</Text>
            <FontAwesome5 name={'chevron-right' as any} size={14} color={theme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.row, { borderBottomColor: theme.border }]}>
            <View style={[styles.rowIconWrap, { backgroundColor: '#FFD93D20' }]}>
              <FontAwesome5 name={'smile' as any} size={16} color="#FFD93D" />
            </View>
            <Text style={[styles.rowLabel, { color: theme.text }]}>Biểu tượng cảm xúc</Text>
            <FontAwesome5 name={'chevron-right' as any} size={14} color={theme.textSecondary} />
          </TouchableOpacity>

          {!isGroupConversation && (
            <TouchableOpacity
              style={[styles.row, { borderBottomColor: theme.border }]}
              onPress={openNicknameModal}
            >
              <View style={[styles.rowIconWrap, { backgroundColor: '#6BCB7720' }]}>
                <FontAwesome5 name={'tag' as any} size={16} color="#6BCB77" />
              </View>
              <View style={styles.rowContent}>
                <Text style={[styles.rowLabel, { color: theme.text }]}>Biệt danh</Text>
                {nickname ? (
                  <Text style={[styles.rowSub, { color: theme.textSecondary }]} numberOfLines={1}>
                    {nickname}
                  </Text>
                ) : null}
              </View>
              <FontAwesome5 name={'chevron-right' as any} size={14} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>HÀNH ĐỘNG KHÁC</Text>

          <TouchableOpacity style={[styles.row, { borderBottomColor: theme.border }]}>
            <View style={[styles.rowIconWrap, { backgroundColor: theme.background }]}>
              <FontAwesome5 name={'search' as any} size={16} color={theme.primary} />
            </View>
            <Text style={[styles.rowLabel, { color: theme.text }]}>Tìm trong đoạn chat</Text>
            <FontAwesome5 name={'chevron-right' as any} size={14} color={theme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.row, { borderBottomColor: theme.border }]}>
            <View style={[styles.rowIconWrap, { backgroundColor: theme.background }]}>
              <FontAwesome5 name={'users' as any} size={16} color={theme.primary} />
            </View>
            <Text style={[styles.rowLabel, { color: theme.text }]}>Tạo nhóm</Text>
            <FontAwesome5 name={'chevron-right' as any} size={14} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface, marginBottom: 40 }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>QUYỀN RIÊNG TƯ</Text>

          <TouchableOpacity style={[styles.row, { borderBottomColor: theme.border }]}>
            <View style={[styles.rowIconWrap, { backgroundColor: theme.background }]}>
              <FontAwesome5 name={'bell' as any} size={16} color={theme.primary} />
            </View>
            <Text style={[styles.rowLabel, { color: theme.text }]}>Thông báo</Text>
            <Text style={{ color: theme.textSecondary, fontSize: 14 }}>Bật</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.row, { borderBottomColor: theme.border }]}>
            <View style={[styles.rowIconWrap, { backgroundColor: '#FF6B6B20' }]}>
              <FontAwesome5 name={'ban' as any} size={16} color="#FF6B6B" />
            </View>
            <Text style={[styles.rowLabel, { color: '#FF6B6B' }]}>Chặn</Text>
            <FontAwesome5 name={'chevron-right' as any} size={14} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={zoomVisible} transparent animationType="fade" onRequestClose={() => setZoomVisible(false)}>
        <View style={styles.zoomOverlay}>
          <TouchableOpacity style={styles.zoomCloseBtn} onPress={() => setZoomVisible(false)}>
            <FontAwesome5 name={'times' as any} size={22} color="#fff" />
          </TouchableOpacity>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
            maximumZoomScale={3}
            minimumZoomScale={1}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
          >
            <Image
              source={{ uri: getAvatarUrl(avatar, name) }}
              style={styles.zoomImage}
              resizeMode="contain"
            />
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={membersModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMembersModalVisible(false)}
      >
        <View style={styles.sheetOverlay}>
          <View style={[styles.sheetContent, { backgroundColor: theme.surface }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: theme.text }]}>Thành viên nhóm</Text>
              <TouchableOpacity onPress={() => setMembersModalVisible(false)}>
                <FontAwesome5 name={'times' as any} size={20} color={theme.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ flexGrow: 1 }} contentContainerStyle={{ paddingBottom: 10 }}>
              {groupMembers.filter((m: any) => m.role === 'admin').length > 0 && (
                <View style={styles.memberGroup}>
                  <Text style={[styles.memberGroupTitle, { color: theme.textSecondary }]}>
                    QUẢN TRỊ VIÊN
                  </Text>
                  {groupMembers
                    .filter((m: any) => m.role === 'admin')
                    .map((member: any) => (
                      <TouchableOpacity
                        key={member.user._id}
                        style={styles.memberItem}
                        onPress={() => openMemberDetail(member.user)}
                      >
                        <Image
                          source={{ uri: getAvatarUrl(member.user.avatar, member.user.name || member.user.username) }}
                          style={styles.memberAvatar}
                        />
                        <View style={styles.memberInfo}>
                          <Text style={[styles.memberName, { color: theme.text }]}>
                            {member.user.name || member.user.username}
                          </Text>
                          <Text style={[styles.memberUsername, { color: theme.textSecondary }]}>
                            @{member.user.username}
                          </Text>
                        </View>
                        <View style={[styles.memberBadge, { backgroundColor: theme.primary }]}>
                          <Text style={styles.memberBadgeText}>Admin</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                </View>
              )}
              <View style={styles.memberGroup}>
                <Text style={[styles.memberGroupTitle, { color: theme.textSecondary }]}>
                  THÀNH VIÊN
                </Text>
                {groupMembers
                  .filter((m: any) => m.role !== 'admin')
                  .map((member: any) => (
                    <TouchableOpacity
                      key={member.user._id}
                      style={styles.memberItem}
                      onPress={() => openMemberDetail(member.user)}
                    >
                      <Image
                        source={{ uri: getAvatarUrl(member.user.avatar, member.user.name || member.user.username) }}
                        style={styles.memberAvatar}
                      />
                      <View style={styles.memberInfo}>
                        <Text style={[styles.memberName, { color: theme.text }]}>
                          {member.user.name || member.user.username}
                        </Text>
                        <Text style={[styles.memberUsername, { color: theme.textSecondary }]}>
                          @{member.user.username}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={memberDetailVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMemberDetailVisible(false)}
      >
        <View style={styles.sheetOverlay}>
          <View style={[styles.sheetContent, { backgroundColor: theme.surface }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: theme.text }]}>Thông tin thành viên</Text>
              <TouchableOpacity onPress={() => setMemberDetailVisible(false)}>
                <FontAwesome5 name={'times' as any} size={20} color={theme.text} />
              </TouchableOpacity>
            </View>
            {selectedMember && (
              <View style={styles.memberDetailBody}>
                <Image
                  source={{ uri: getAvatarUrl(selectedMember.avatar, selectedMember.name || selectedMember.username) }}
                  style={styles.memberDetailAvatar}
                />
                <Text style={[styles.memberDetailName, { color: theme.text }]}>
                  {selectedMember.name || selectedMember.username}
                </Text>
                <Text style={[styles.memberDetailUsername, { color: theme.textSecondary }]}>
                  {selectedMember.username ? `@${selectedMember.username}` : 'Thành viên'}
                </Text>
                <View style={[styles.memberDetailRoleRow, { backgroundColor: theme.background }]}>
                  <Text style={[styles.rowLabel, { color: theme.text }]}>Vai trò</Text>
                  <Text style={{ color: theme.textSecondary }}>
                    {selectedMember.role || 'Thành viên'}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={nicknameModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setNicknameModalVisible(false)}
      >
        <View style={styles.sheetOverlay}>
          <View style={[styles.sheetContent, { backgroundColor: theme.surface }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: theme.text }]}>Biệt danh</Text>
              <TouchableOpacity onPress={() => { setNicknameInput(nickname); setNicknameModalVisible(false); }}>
                <FontAwesome5 name={'times' as any} size={20} color={theme.text} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.nicknameInput, { borderColor: theme.border, color: theme.text, backgroundColor: theme.background }]}
              placeholder="Nhập biệt danh"
              placeholderTextColor={theme.textSecondary}
              value={nicknameInput}
              onChangeText={setNicknameInput}
              maxLength={50}
            />
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: theme.background, borderColor: theme.border }]}
                onPress={() => { setNicknameInput(nickname); setNicknameModalVisible(false); }}
              >
                <Text style={[styles.btnText, { color: theme.text }]}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: theme.primary }]}
                onPress={handleSaveNickname}
                disabled={isSaving}
              >
                <Text style={[styles.btnText, { color: '#fff' }]}>{isSaving ? 'Đang lưu...' : 'Lưu'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 17, fontWeight: '700' },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  avatarWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderRadius: 50,
    marginBottom: 14,
  },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  profileName: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  profileSub: { fontSize: 14, marginBottom: 24 },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    width: '100%',
  },
  actionBtn: { alignItems: 'center', minWidth: 64, flex: 1 },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionLabel: { fontSize: 12, fontWeight: '500', textAlign: 'center' },
  section: {
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    gap: 12,
  },
  rowIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: '500', flex: 1 },
  rowSub: { fontSize: 13, marginTop: 2 },
  zoomOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' },
  zoomCloseBtn: { position: 'absolute', top: 52, right: 18, zIndex: 10, padding: 8 },
  zoomImage: { width: 320, height: 320 },
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheetContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 34,
    paddingTop: 12,
    maxHeight: '80%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ccc',
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700' },
  memberGroup: { marginBottom: 16 },
  memberGroupTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  memberAvatar: { width: 44, height: 44, borderRadius: 22 },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 15, fontWeight: '600' },
  memberUsername: { fontSize: 13, marginTop: 2 },
  memberBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  memberBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  memberDetailBody: { alignItems: 'center', paddingVertical: 10 },
  memberDetailAvatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 12 },
  memberDetailName: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  memberDetailUsername: { fontSize: 14, marginBottom: 16 },
  memberDetailRoleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
  },
  nicknameInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  btnRow: { flexDirection: 'row', gap: 12 },
  btn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  btnText: { fontSize: 16, fontWeight: '600' },
});

export default ConversationInfo;
