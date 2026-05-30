import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { pick, types } from '@react-native-documents/picker';
import Toast from 'react-native-toast-message';
import client from '../../api/client';
import { getAvatarUrl } from '../../utils/helper';

const EditProfile = ({ navigation }: any) => {
  const { theme } = useTheme();
  const { profile, token, updateAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState<string>(profile?.name || '');
  const [username, setUsername] = useState<string>(profile?.username || '');
  const [bio, setBio] = useState<string>(profile?.bio || '');
  const [phone, setPhone] = useState<string>(profile?.phone || '');
  const [showOnlineStatus, setShowOnlineStatus] = useState<boolean>(profile?.show_online_status ?? true);
  const [avatar, setAvatar] = useState<any>(null);

  const pickImage = async () => {
    try {
      const res = await pick({ type: [types.images] });
      if (res && res[0]) {
        const file = res[0];
        if (file.size && file.size > 5 * 1024 * 1024) {
          return Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Ảnh quá nặng (tối đa 5MB)' });
        }
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (file.type && !validTypes.includes(file.type)) {
          return Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Định dạng file không hỗ trợ' });
        }
        setAvatar(file);
      }
    } catch (err) {
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Tên không được để trống' });
    if (!username.trim()) return Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Tên người dùng không được để trống' });

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('username', username.trim().toLowerCase());
      formData.append('bio', bio.trim());
      formData.append('phone', phone.trim());
      formData.append('show_online_status', showOnlineStatus ? 'true' : 'false');
      if (avatar) {
        formData.append('avatar', {
          uri: avatar.uri,
          name: avatar.name || 'avatar.jpg',
          type: avatar.type || 'image/jpeg',
        } as any);
      }

      const { data } = await client.patch('/auth/update-profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      await updateAuth(data.token || token || '', data.profile);
      Toast.show({ type: 'success', text1: 'Thành công', text2: 'Hồ sơ đã được cập nhật' });
      navigation.goBack();
    } catch (error: any) {
      const msg = error?.response?.data?.error || 'Cập nhật thất bại';
      Toast.show({ type: 'error', text1: 'Lỗi', text2: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.background }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FontAwesome5 name={"arrow-left" as any} size={20} color={theme.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Chỉnh sửa hồ sơ</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator size="small" color={theme.primary} /> : <Text style={[styles.saveText, { color: theme.primary }]}>Lưu</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.avatarSection} onPress={pickImage}>
          <View style={styles.avatarWrapper}>
            <Image 
              source={{ uri: avatar?.uri || getAvatarUrl(profile?.avatar, profile?.name) }} 
              style={styles.avatar} 
            />
            <View style={[styles.editBadge, { backgroundColor: theme.primary, borderColor: theme.background }]}>
              <FontAwesome5 name={"camera" as any} size={16} color="#fff" />
            </View>
          </View>
          <Text style={[styles.avatarHint, { color: theme.textSecondary }]}>Thay đổi ảnh đại diện</Text>
        </TouchableOpacity>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Họ và tên</Text>
            <TextInput
              style={[styles.input, { color: theme.text, backgroundColor: theme.surface }]}
              value={name}
              onChangeText={setName}
              placeholder="Nhập họ và tên"
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Tên người dùng</Text>
            <TextInput
              style={[styles.input, { color: theme.text, backgroundColor: theme.surface }]}
              value={username}
              onChangeText={setUsername}
              placeholder="Nhập tên người dùng"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Số điện thoại</Text>
            <TextInput
              style={[styles.input, { color: theme.text, backgroundColor: theme.surface }]}
              value={phone}
              onChangeText={setPhone}
              placeholder="Nhập số điện thoại"
              placeholderTextColor={theme.textSecondary}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Tiểu sử</Text>
            <TextInput
              style={[styles.input, styles.bioInput, { color: theme.text, backgroundColor: theme.surface }]}
              value={bio}
              onChangeText={setBio}
              placeholder="Viết gì đó về bạn..."
              placeholderTextColor={theme.textSecondary}
              multiline
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Email</Text>
            <View style={[styles.input, styles.disabledInput, { backgroundColor: theme.surface }]}>
              <Text style={{ color: theme.textSecondary }}>{profile?.email}</Text>
              <FontAwesome5 name={"lock" as any} size={14} color={theme.textSecondary} />
            </View>
          </View>

          <View style={[styles.inputGroup, styles.switchGroup]}>
            <View>
              <Text style={[styles.label, { color: theme.text }]}>Hiển thị trạng thái online</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 12, marginLeft: 4 }}>Cho phép người khác thấy bạn đang online</Text>
            </View>
            <Switch
              value={showOnlineStatus}
              onValueChange={setShowOnlineStatus}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor={Platform.OS === 'ios' ? undefined : '#fff'}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    height: Platform.OS === 'ios' ? 115 : 85, 
    borderBottomWidth: 0.5, 
    paddingTop: Platform.OS === 'ios' ? 60 : 25 
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  saveText: { fontSize: 16, fontWeight: 'bold' },
  content: { padding: 20 },
  avatarSection: { alignItems: 'center', marginBottom: 30 },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 120, height: 120, borderRadius: 60 },
  editBadge: { position: 'absolute', bottom: 0, right: 0, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 3 },
  avatarHint: { marginTop: 10, fontSize: 14, fontWeight: '500' },
  form: { gap: 20 },
  inputGroup: { gap: 8 },
  switchGroup: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  label: { fontSize: 14, fontWeight: 'bold', marginLeft: 4 },
  input: { height: 50, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, borderWidth: 1, borderColor: 'transparent' },
  bioInput: { height: 100, textAlignVertical: 'top', paddingTop: 12 },
  disabledInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', opacity: 0.7 },
});

export default EditProfile;
