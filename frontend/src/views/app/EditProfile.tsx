import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  TextInput,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@react-native-vector-icons/fontawesome5';
import { getUser, saveUser } from '@utils/storage';
import { updateProfile } from '@api/music';
import { pick, types } from '@react-native-documents/picker';
import Toast from 'react-native-toast-message';

const C = {
  bg: '#000000',
  surface: '#0A0A0A',
  border: 'rgba(255, 255, 255, 0.08)',
  text: '#FFFFFF',
  sub: '#94A3B8',
  accent: '#7C3AED',
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  loadingContainer: { flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, height: 60, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0A0A0A', borderRadius: 20 },
  headerTitle: { fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  saveText: { fontSize: 15, fontWeight: '900', color: '#7C3AED' },
  content: { padding: 24, alignItems: 'center' },
  avatarSection: { alignItems: 'center', marginBottom: 40 },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#0A0A0A', borderWidth: 3, borderColor: 'rgba(255,255,255,0.08)' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, width: 36, height: 36, backgroundColor: '#7C3AED', borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#000000' },
  avatarHint: { marginTop: 16, fontSize: 13, fontWeight: '600', color: '#94A3B8' },
  form: { width: '100%', gap: 24 },
  inputGroup: { gap: 10 },
  label: { fontSize: 13, fontWeight: '900', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginLeft: 4 },
  input: { height: 56, backgroundColor: '#0A0A0A', borderRadius: 10, paddingHorizontal: 16, color: '#fff', fontSize: 15, fontWeight: '700', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  disabledInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', opacity: 0.6 },
  disabledText: { color: '#94A3B8', fontSize: 15, fontWeight: '700' },
  inputHint: { fontSize: 12, color: '#94A3B8', marginLeft: 4, fontWeight: '500' },
});

const EditProfile = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<any>(null);
  const [initialData, setInitialData] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const user = await getUser();
        if (user) {
          setInitialData(user);
          setName(user.name || '');
        }
      } catch (error) {
        console.error('EditProfile init error:', error);
      } finally {
        setFetching(false);
      }
    };
    init();
  }, []);

  const pickImage = async () => {
    try {
      const res = await pick({ type: [types.images] });
      if (res && res[0]) setAvatar(res[0]);
    } catch (err) {
      console.log('User cancelled or picker error', err);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      return Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Tên không được để trống',
      });
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('name', name.trim());
      if (avatar) {
        formData.append('avatar', {
          uri: avatar.uri,
          name: avatar.name || 'avatar.jpg',
          type: avatar.type || 'image/jpeg',
        } as any);
      }

      const { data } = await updateProfile(formData);
      if (data?.profile) {
        await saveUser(data.profile);
        Toast.show({
          type: 'success',
          text1: 'Thành công',
          text2: 'Đã cập nhật hồ sơ',
        });
        navigation.goBack();
      }
    } catch (error) {
      console.error('Update profile error:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không thể cập nhật hồ sơ',
      });
    } finally {
      setLoading(false);
    }
  };

  const displayAvatar =
    avatar?.uri ||
    (typeof initialData?.avatar === 'string'
      ? initialData?.avatar
      : initialData?.avatar?.url || initialData?.picture) ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name || 'U',
    )}&background=1E2235&color=F1F5F9&size=200`;

  if (fetching) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }} edges={['top']}>
      <View style={s.header}>
        <Pressable onPress={() => navigation.goBack()} style={s.backBtn}>
          <FontAwesome5
            name="chevron-left"
            iconStyle="solid"
            size={18}
            color="#fff"
          />
        </Pressable>
        <Text style={s.headerTitle}>Chỉnh sửa hồ sơ</Text>
        <Pressable onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#7C3AED" />
          ) : (
            <Text style={s.saveText}>Lưu</Text>
          )}
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ padding: 24, alignItems: 'center' }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={s.avatarSection}>
            <View style={s.avatarWrapper}>
              <Image source={{ uri: displayAvatar }} style={s.avatar} />
              <Pressable style={s.editBadge} onPress={pickImage}>
                <FontAwesome5
                  name="camera"
                  iconStyle="solid"
                  size={12}
                  color="#fff"
                />
              </Pressable>
            </View>
            <Text style={s.avatarHint}>Nhấn vào camera để đổi ảnh</Text>
          </View>

          <View style={s.form}>
            <View style={s.inputGroup}>
              <Text style={s.label}>Họ và tên</Text>
              <TextInput
                style={s.input}
                value={name}
                onChangeText={setName}
                placeholder="Nhập tên của bạn..."
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={s.inputGroup}>
              <Text style={s.label}>Email</Text>
              <View style={[s.input, s.disabledInput]}>
                <Text style={s.disabledText}>
                  {initialData?.email || 'Chưa cập nhật'}
                </Text>
                <FontAwesome5
                  name="lock"
                  iconStyle="solid"
                  size={12}
                  color="#94A3B8"
                />
              </View>
              <Text style={s.inputHint}>Email không thể thay đổi</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EditProfile;
