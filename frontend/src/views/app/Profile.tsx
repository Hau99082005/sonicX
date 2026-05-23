import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@react-native-vector-icons/fontawesome5';
import { getProfile, getFavoriteMusic, updateProfile } from '@api/music';
import { getUser, clearStorage } from '@utils/storage';
import Toast from 'react-native-toast-message';
import { appLogout } from '../../../App';
import { usePlayer } from '../../context/PlayerContext';

const C = {
  bg: '#0D0F1E',
  surface: '#161829',
  card: '#1C1F35',
  border: '#1E2140',
  text: '#FFFFFF',
  sub: '#8A8FAD',
  accent: '#6C63FF',
  accentDim: 'rgba(108,99,255,0.12)',
  gold: '#F59E0B',
  goldDim: 'rgba(245,158,11,0.12)',
  danger: '#EF4444',
  dangerDim: 'rgba(239,68,68,0.08)',
  green: '#10B981',
  greenDim: 'rgba(16,185,129,0.12)',
};

const Profile = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [editingBio, setEditingBio] = useState(false);
  const [bioValue, setBioValue] = useState('');
  const [savingBio, setSavingBio] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { stopAndReset } = usePlayer();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const [userData, favRes] = await Promise.all([
        getUser(),
        getFavoriteMusic(),
      ]);
      setUser(userData);
      setBioValue(userData?.bio ?? '');
      setFavoriteCount(favRes.data.audios?.length ?? 0);
    } catch {
      Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Không thể tải hồ sơ' });
    } finally {
      setLoading(false);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleSaveBio = async () => {
    try {
      setSavingBio(true);
      await updateProfile({ bio: bioValue });
      setUser((prev: any) => ({ ...prev, bio: bioValue }));
      setEditingBio(false);
      Toast.show({
        type: 'success',
        text1: 'Đã lưu',
        text2: 'Bio đã được cập nhật',
      });
    } catch {
      Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Không thể lưu bio' });
    } finally {
      setSavingBio(false);
    }
  };

  const confirmLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất không?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: handleLogout },
    ]);
  };

  const handleLogout = async () => {
    try {
      stopAndReset();
      await clearStorage();
      setTimeout(() => appLogout(), 300);
    } catch {
      Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Không thể đăng xuất' });
    }
  };

  const avatarUri =
    user?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      user?.name || 'U',
    )}&background=1C1F35&color=6C63FF&size=200`;

  if (loading) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={C.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        style={{ opacity: fadeAnim }}
      >
        <View style={s.topBar}>
          <Text style={s.topBarTitle}>Hồ sơ</Text>
          <Pressable style={s.iconBtn} onPress={confirmLogout} hitSlop={8}>
            <FontAwesome5
              name="sign-out-alt"
              iconStyle="solid"
              size={15}
              color={C.sub}
            />
          </Pressable>
        </View>

        <View style={s.heroSection}>
          <View style={s.avatarWrap}>
            <Image source={{ uri: avatarUri }} style={s.avatar} />
            <View style={s.avatarRing} />
            <View style={s.avatarBadge}>
              <FontAwesome5
                name="music"
                iconStyle="solid"
                size={9}
                color="#fff"
              />
            </View>
          </View>

          <Text style={s.name}>{user?.name ?? 'Người dùng'}</Text>

          <View style={s.memberPill}>
            <FontAwesome5
              name="star"
              iconStyle="solid"
              size={9}
              color={C.gold}
            />
            <Text style={s.memberText}>Thành viên Vàng</Text>
          </View>

          {editingBio ? (
            <View style={s.bioEditWrap}>
              <TextInput
                style={s.bioInput}
                value={bioValue}
                onChangeText={setBioValue}
                placeholder="Viết gì đó về bạn..."
                placeholderTextColor={C.sub}
                multiline
                maxLength={120}
                autoFocus
              />
              <View style={s.bioActions}>
                <Pressable
                  style={s.bioCancel}
                  onPress={() => {
                    setEditingBio(false);
                    setBioValue(user?.bio ?? '');
                  }}
                >
                  <Text style={s.bioCancelText}>Hủy</Text>
                </Pressable>
                <Pressable
                  style={s.bioSave}
                  onPress={handleSaveBio}
                  disabled={savingBio}
                >
                  {savingBio ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={s.bioSaveText}>Lưu</Text>
                  )}
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable style={s.bioRow} onPress={() => setEditingBio(true)}>
              <Text style={s.bioText}>
                {user?.bio || 'Thêm giới thiệu của bạn...'}
              </Text>
              <FontAwesome5
                name="pen"
                iconStyle="solid"
                size={10}
                color={C.sub}
                style={{ marginLeft: 6 }}
              />
            </Pressable>
          )}
        </View>

        <View style={s.statsRow}>
          <View style={s.statItem}>
            <Text style={s.statNum}>{user?.followers ?? 0}</Text>
            <Text style={s.statLbl}>Theo dõi</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statNum}>{user?.following ?? 0}</Text>
            <Text style={s.statLbl}>Đang theo dõi</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statNum}>{favoriteCount}</Text>
            <Text style={s.statLbl}>Yêu thích</Text>
          </View>
        </View>

        <View style={s.insightRow}>
          <View
            style={[s.insightCard, { borderColor: 'rgba(108,99,255,0.25)' }]}
          >
            <View style={[s.insightIcon, { backgroundColor: C.accentDim }]}>
              <FontAwesome5
                name="headphones"
                iconStyle="solid"
                size={14}
                color={C.accent}
              />
            </View>
            <Text style={s.insightNum}>{user?.totalListened ?? 0}</Text>
            <Text style={s.insightLbl}>Bài đã nghe</Text>
          </View>
          <View
            style={[s.insightCard, { borderColor: 'rgba(16,185,129,0.25)' }]}
          >
            <View style={[s.insightIcon, { backgroundColor: C.greenDim }]}>
              <FontAwesome5
                name="fire"
                iconStyle="solid"
                size={14}
                color={C.green}
              />
            </View>
            <Text style={s.insightNum}>{user?.streak ?? 0}</Text>
            <Text style={s.insightLbl}>Ngày liên tiếp</Text>
          </View>
          <View
            style={[s.insightCard, { borderColor: 'rgba(245,158,11,0.25)' }]}
          >
            <View style={[s.insightIcon, { backgroundColor: C.goldDim }]}>
              <FontAwesome5
                name="clock"
                iconStyle="regular"
                size={14}
                color={C.gold}
              />
            </View>
            <Text style={s.insightNum}>{user?.hoursListened ?? 0}h</Text>
            <Text style={s.insightLbl}>Tổng giờ nghe</Text>
          </View>
        </View>

        <Text style={s.groupLabel}>TÀI KHOẢN</Text>
        <View style={s.menuGroup}>
          <MenuRow
            icon="user-shield"
            label="Quản trị âm nhạc"
            onPress={() => navigation.navigate('AdminDashboard')}
          />
          <MenuRow
            icon="user-edit"
            label="Chỉnh sửa hồ sơ"
            onPress={() => setEditingBio(true)}
            showDivider
          />
          <MenuRow
            icon="bell"
            label="Thông báo"
            onPress={() => {}}
            showDivider
          />
          <MenuRow
            icon="shield-alt"
            label="Bảo mật & Quyền riêng tư"
            onPress={() => {}}
            showDivider
          />
        </View>

        <Text style={s.groupLabel}>ỨNG DỤNG</Text>
        <View style={s.menuGroup}>
          <MenuRow
            icon="download"
            label="Tải xuống & Bộ nhớ đệm"
            onPress={() => {}}
          />
          <MenuRow
            icon="wifi"
            label="Chất lượng âm thanh"
            onPress={() => {}}
            showDivider
          />
          <MenuRow
            icon="language"
            label="Ngôn ngữ"
            value="Tiếng Việt"
            onPress={() => {}}
            showDivider
          />
        </View>

        <Text style={s.groupLabel}>HỖ TRỢ</Text>
        <View style={s.menuGroup}>
          <MenuRow
            icon="question-circle"
            label="Trung tâm trợ giúp"
            onPress={() => {}}
          />
          <MenuRow
            icon="star"
            label="Đánh giá ứng dụng"
            onPress={() => {}}
            showDivider
          />
          <MenuRow
            icon="info-circle"
            label="Phiên bản 1.0.0"
            onPress={() => {}}
            showDivider
            isInfo
          />
        </View>

        <Pressable style={s.logoutBtn} onPress={confirmLogout}>
          <FontAwesome5
            name="sign-out-alt"
            iconStyle="solid"
            size={14}
            color={C.danger}
          />
          <Text style={s.logoutText}>Đăng xuất</Text>
        </Pressable>
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const MenuRow = ({
  icon,
  label,
  value,
  onPress,
  showDivider,
  isInfo,
}: {
  icon: any;
  label: string;
  value?: string;
  onPress: () => void;
  showDivider?: boolean;
  isInfo?: boolean;
}) => (
  <>
    {showDivider && <View style={s.rowDivider} />}
    <Pressable style={s.menuRow} onPress={onPress}>
      <View style={s.menuIconWrap}>
        <FontAwesome5 name={icon} iconStyle="solid" size={13} color={C.sub} />
      </View>
      <Text style={s.menuLabel}>{label}</Text>
      <View style={s.menuRight}>
        {value && <Text style={s.menuValue}>{value}</Text>}
        {!isInfo && (
          <FontAwesome5
            name="chevron-right"
            iconStyle="solid"
            size={11}
            color={C.sub}
          />
        )}
      </View>
    </Pressable>
  </>
);

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingBottom: 130 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
  },
  topBarTitle: {
    fontFamily: 'Inter',
    fontSize: 26,
    fontWeight: '700',
    color: C.text,
    letterSpacing: -0.5,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroSection: {
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  avatarWrap: { position: 'relative', marginBottom: 16 },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: C.surface,
  },
  avatarRing: {
    position: 'absolute',
    top: -3,
    left: -3,
    width: 98,
    height: 98,
    borderRadius: 49,
    borderWidth: 2,
    borderColor: C.accent,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: C.bg,
  },
  name: {
    fontFamily: 'Inter',
    fontSize: 22,
    fontWeight: '700',
    color: C.text,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  memberPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: C.goldDim,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 14,
  },
  memberText: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '600',
    color: C.gold,
  },

  bioRow: { flexDirection: 'row', alignItems: 'center' },
  bioText: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '400',
    color: C.sub,
    textAlign: 'center',
  },
  bioEditWrap: { width: '100%', gap: 10 },
  bioInput: {
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.accent,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: 'Inter',
    fontSize: 13,
    color: C.text,
    minHeight: 72,
    textAlignVertical: 'top',
  },
  bioActions: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  bioCancel: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  bioCancelText: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '500',
    color: C.sub,
  },
  bioSave: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: C.accent,
    minWidth: 64,
    alignItems: 'center',
  },
  bioSaveText: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 18,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 30, backgroundColor: C.border },
  statNum: {
    fontFamily: 'Inter',
    fontSize: 20,
    fontWeight: '700',
    color: C.text,
    marginBottom: 3,
  },
  statLbl: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '400',
    color: C.sub,
  },

  insightRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 28,
  },
  insightCard: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    paddingVertical: 14,
    gap: 6,
  },
  insightIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightNum: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
  },
  insightLbl: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '400',
    color: C.sub,
    textAlign: 'center',
  },

  groupLabel: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '600',
    color: C.sub,
    letterSpacing: 1.2,
    marginHorizontal: 20,
    marginBottom: 8,
    marginTop: 4,
  },
  menuGroup: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  rowDivider: { height: 1, backgroundColor: C.border, marginLeft: 52 },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '400',
    color: C.text,
    flex: 1,
  },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  menuValue: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '400',
    color: C.sub,
  },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: C.dangerDim,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.18)',
    gap: 10,
    marginBottom: 10,
  },
  logoutText: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '600',
    color: C.danger,
  },
});

export default Profile;
