import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Toast from 'react-native-toast-message';
import client from '../../api/client';
import { getAvatarUrl } from '../../utils/helper';
import { useFocusEffect } from '@react-navigation/native';

const Profile = ({ navigation }: any) => {
  const { theme, isDark, toggleTheme } = useTheme();
  const { profile, signOut, fetchProfile } = useAuth();
  const { unreadCount } = useNotifications();
  const [passwordModal, setPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setNewConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [zoomVisible, setZoomVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, []),
  );

  const handleDeleteAccount = () => {
    Alert.alert(
      'Xóa tài khoản',
      'Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await client.delete('/auth/delete-account');
              Toast.show({
                type: 'success',
                text1: 'Thành công',
                text2: 'Tài khoản đã được xóa',
              });
              setTimeout(async () => {
                await signOut();
              }, 1500);
            } catch (error: any) {
              const msg =
                error.response?.data?.error ||
                'Không thể xóa tài khoản. Vui lòng thử lại sau.';
              Toast.show({ type: 'error', text1: 'Lỗi', text2: msg });
            }
          },
        },
      ],
    );
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      return Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Vui lòng điền đầy đủ thông tin',
      });
    }
    if (newPassword !== confirmPassword) {
      return Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Mật khẩu xác nhận không khớp',
      });
    }
    if (newPassword.length < 8) {
      return Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Mật khẩu phải có ít nhất 8 ký tự',
      });
    }

    setLoading(true);
    try {
      await client.patch('/auth/update-password-auth', {
        oldPassword,
        password: newPassword,
      });
      Toast.show({
        type: 'success',
        text1: 'Thành công',
        text2: 'Mật khẩu đã được thay đổi',
      });
      setPasswordModal(false);
      setOldPassword('');
      setNewPassword('');
      setNewConfirmPassword('');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: error.response?.data?.error || 'Đổi mật khẩu thất bại',
      });
    } finally {
      setLoading(false);
    }
  };

  const MenuItem = ({
    icon,
    label,
    value,
    badge,
    color,
    onPress,
    type = 'link',
  }: any) => (
    <TouchableOpacity
      style={[styles.menuItem, { backgroundColor: theme.surface }]}
      onPress={onPress}
      disabled={type === 'info'}
    >
      <View style={[styles.menuIconContainer, { backgroundColor: color }]}>
        <FontAwesome5
          name={icon}
          size={16}
          color="#fff"
          {...({ solid: true } as any)}
        />
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuLabel, { color: theme.text }]}>{label}</Text>
        {value && (
          <Text style={[styles.menuValue, { color: theme.textSecondary }]}>
            {value}
          </Text>
        )}
      </View>
      {type === 'link' && (
        <View style={styles.menuRight}>
          {badge > 0 && (
            <View style={[styles.menuBadge, { backgroundColor: '#FF4D4F' }]}>
              <Text style={styles.menuBadgeText}>{badge > 99 ? '99+' : badge}</Text>
            </View>
          )}
          <FontAwesome5 name="chevron-right" size={12} color={theme.textSecondary} />
        </View>
      )}
      {type === 'switch' && (
        <Switch value={isDark} onValueChange={toggleTheme} />
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Tôi</Text>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.avatarWrapper}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setZoomVisible(true)}
          >
            <Image
              source={{ uri: getAvatarUrl(profile?.avatar, profile?.name) }}
              style={styles.avatar}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.cameraBtn,
              { backgroundColor: theme.surface, borderColor: theme.background },
            ]}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <FontAwesome5 name="camera" size={14} color={theme.text} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.profileName, { color: theme.text }]}>
          {profile?.name || 'User'}
        </Text>
        {profile?.bio ? (
          <Text style={[styles.profileBio, { color: theme.textSecondary }]}>
            {profile.bio}
          </Text>
        ) : null}
      </View>

      <View style={styles.section}>
        <MenuItem icon="moon" label="Chế độ tối" color="#000" type="switch" />
        <MenuItem
          icon="check-circle"
          label="Trạng thái hoạt động"
          value={profile?.show_online_status ? 'Đang bật' : 'Đang tắt'}
          color="#31A24C"
          onPress={() => navigation.navigate('EditProfile')}
        />
      </View>

      <View style={styles.section}>
        <MenuItem
          icon="at"
          label="Tên người dùng"
          value={`m.me/${profile?.username}`}
          color="#FF4500"
          onPress={() => navigation.navigate('EditProfile')}
        />
        <MenuItem
          icon="phone"
          label="Số điện thoại"
          value={profile?.phone || 'Chưa cập nhật'}
          color="#0084FF"
          onPress={() => navigation.navigate('EditProfile')}
        />
      </View>

      <View style={styles.section}>
        <MenuItem
          icon="bell"
          label="Thông báo & âm thanh"
          color="#7C3AED"
          badge={unreadCount}
          onPress={() => navigation.navigate('NotificationSettings')}
        />
        <MenuItem
          icon="users"
          label="Danh bạ"
          color="#00C4FF"
          onPress={() => navigation.navigate('People')}
        />
      </View>

      <View style={styles.section}>
        <MenuItem
          icon="lock"
          label="Đổi mật khẩu"
          color="#607D8B"
          onPress={() => setPasswordModal(true)}
        />
        <MenuItem
          icon="user-slash"
          label="Xóa tài khoản"
          color="#FF4D4F"
          onPress={handleDeleteAccount}
        />
      </View>

      <Modal
        visible={passwordModal}
        transparent
        animationType="fade"
        onRequestClose={() => setPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: theme.background }]}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Đổi mật khẩu
            </Text>

            <TextInput
              style={[
                styles.modalInput,
                {
                  color: theme.text,
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
              placeholder="Mật khẩu cũ"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry
              value={oldPassword}
              onChangeText={setOldPassword}
            />

            <TextInput
              style={[
                styles.modalInput,
                {
                  color: theme.text,
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
              placeholder="Mật khẩu mới"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <TextInput
              style={[
                styles.modalInput,
                {
                  color: theme.text,
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
              placeholder="Xác nhận mật khẩu mới"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setNewConfirmPassword}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: theme.surface }]}
                onPress={() => setPasswordModal(false)}
              >
                <Text style={{ color: theme.text }}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: theme.primary }]}
                onPress={handleChangePassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                    Cập nhật
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={zoomVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setZoomVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.zoomCloseBtn}
            onPress={() => setZoomVisible(false)}
          >
            <FontAwesome5 name="times" size={22} color="#fff" />
          </TouchableOpacity>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            maximumZoomScale={3}
            minimumZoomScale={1}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
          >
            <Image
              source={{ uri: getAvatarUrl(profile?.avatar, profile?.name) }}
              style={styles.modalImage}
              resizeMode="contain"
            />
          </ScrollView>
        </View>
      </Modal>

      <TouchableOpacity
        style={[styles.logoutBtn, { backgroundColor: theme.surface }]}
        onPress={signOut}
      >
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={[styles.version, { color: theme.textSecondary }]}>
          Phiên bản 1.0.0
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 50, marginBottom: 20 },
  title: { fontSize: 32, fontWeight: '800' },
  profileSection: { alignItems: 'center', marginBottom: 30 },
  avatarWrapper: { position: 'relative', marginBottom: 15 },
  avatar: { width: 120, height: 120, borderRadius: 60 },
  cameraBtn: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  profileName: { fontSize: 24, fontWeight: '700' },
  profileBio: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 2,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuContent: { flex: 1 },
  menuLabel: { fontSize: 16, fontWeight: '600' },
  menuValue: { fontSize: 14, marginTop: 2 },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  menuBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  menuBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  logoutBtn: {
    marginHorizontal: 16,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  logoutText: { color: '#FF4D4F', fontSize: 16, fontWeight: 'bold' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: { borderRadius: 20, padding: 20, elevation: 5 },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInput: {
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 10 },
  modalBtn: {
    flex: 1,
    height: 45,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: { alignItems: 'center', paddingBottom: 40 },
  version: { fontSize: 12, opacity: 0.6 },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' },
  modalImage: { width: '100%', height: '100%' },
  zoomCloseBtn: {
    position: 'absolute',
    top: 44,
    right: 18,
    zIndex: 10,
    padding: 8,
  },
});

export default Profile;
