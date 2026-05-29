import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

const Profile = ({ navigation }: any) => {
  const { theme, isDark, toggleTheme } = useTheme();
  const { profile, signOut } = useAuth();

  const MenuItem = ({ icon, label, value, color, onPress, type = 'link' }: any) => (
    <TouchableOpacity 
      style={[styles.menuItem, { backgroundColor: theme.surface }]} 
      onPress={onPress}
      disabled={type === 'info'}
    >
      <View style={[styles.menuIconContainer, { backgroundColor: color }]}>
        <FontAwesome5 name={icon} size={16} color="#fff" {...({ solid: true } as any)} />
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuLabel, { color: theme.text }]}>{label}</Text>
        {value && <Text style={[styles.menuValue, { color: theme.textSecondary }]}>{value}</Text>}
      </View>
      {type === 'link' && (
        <FontAwesome5 name="chevron-right" size={12} color={theme.textSecondary} />
      )}
      {type === 'switch' && (
        <Switch value={isDark} onValueChange={toggleTheme} />
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Tôi</Text>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.avatarWrapper}>
          <Image
            source={{ uri: profile?.avatar || 'https://via.placeholder.com/120' }}
            style={styles.avatar}
          />
          <TouchableOpacity 
            style={[styles.cameraBtn, { backgroundColor: theme.surface, borderColor: theme.background }]}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <FontAwesome5 name="camera" size={14} color={theme.text} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.profileName, { color: theme.text }]}>{profile?.name || 'User'}</Text>
      </View>

      <View style={styles.section}>
        <MenuItem 
          icon="moon" 
          label="Chế độ tối" 
          color="#000" 
          type="switch" 
        />
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
          onPress={() => {}}
        />
        <MenuItem 
          icon="user-slash" 
          label="Xóa tài khoản" 
          color="#FF4D4F" 
          onPress={() => {}}
        />
      </View>

      <TouchableOpacity 
        style={[styles.logoutBtn, { backgroundColor: theme.surface }]}
        onPress={signOut}
      >
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </TouchableOpacity>
      
      <View style={styles.footer}>
        <Text style={[styles.version, { color: theme.textSecondary }]}>Phiên bản 1.0.0</Text>
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
  logoutBtn: {
    marginHorizontal: 16,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  logoutText: { color: '#FF4D4F', fontSize: 16, fontWeight: '700' },
  footer: { alignItems: 'center', paddingBottom: 40 },
  version: { fontSize: 12, opacity: 0.6 },
});

export default Profile;
