import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ActivityIndicator,
  Alert,
  TextInput,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@react-native-vector-icons/fontawesome5';
import LinearGradient from 'react-native-linear-gradient';
import { getFavoriteMusic, updateProfile } from '@api/music';
import { getUser, clearStorage } from '@utils/storage';
import Toast from 'react-native-toast-message';
import { appLogout } from '../../utils/auth';
import { usePlayer } from '../../context/PlayerContext';

const C = {
  bg: '#000000',
  surface: '#0A0A0A',
  card: '#121212',
  border: 'rgba(255, 255, 255, 0.08)',
  text: '#FFFFFF',
  sub: '#94A3B8',
  accent: '#7C3AED',
  gold: '#F59E0B',
  danger: '#EF4444',
};

const MenuRow = ({
  icon,
  label,
  value,
  onPress,
  isInfo,
}: {
  icon: any;
  label: string;
  value?: string;
  onPress: () => void;
  isInfo?: boolean;
}) => (
  <Pressable style={s.menuRow} onPress={onPress}>
    <View style={s.menuIconWrap}>
      <FontAwesome5 name={icon} iconStyle="solid" size={14} color={C.sub} />
    </View>
    <Text style={s.menuLabel}>{label}</Text>
    <View style={s.menuRight}>
      {value && <Text style={s.menuValue}>{value}</Text>}
      {!isInfo && (
        <FontAwesome5
          name="chevron-right"
          iconStyle="solid"
          size={10}
          color={C.border}
        />
      )}
    </View>
  </Pressable>
);

const Profile = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { stopAndReset } = usePlayer();

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const [userData, favRes] = await Promise.all([
        getUser(),
        getFavoriteMusic().catch(() => ({ data: { audios: [] } })),
      ]);
      setUser(userData);
      setFavoriteCount(favRes.data?.audios?.length ?? 0);
    } catch (error) {
      console.error('Profile load error:', error);
      Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Không thể tải hồ sơ' });
    } finally {
      setLoading(false);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [fadeAnim]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

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
    (typeof user?.avatar === 'string'
      ? user?.avatar
      : user?.avatar?.url || user?.picture) ||
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
        <View style={s.heroContainer}>
          <View style={s.heroImgWrap}>
            <Image
              source={{ uri: avatarUri }}
              style={s.heroBg}
              blurRadius={15}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)', '#000']}
              style={StyleSheet.absoluteFill}
            />
          </View>

          <View style={s.heroTopActions}>
            <Pressable style={s.iconBtn} onPress={() => navigation.goBack()}>
              <FontAwesome5
                name="chevron-left"
                iconStyle="solid"
                size={16}
                color="#fff"
              />
            </Pressable>
            <Pressable
              style={s.iconBtn}
              onPress={() => navigation.navigate('Settings')}
            >
              <FontAwesome5
                name="cog"
                iconStyle="solid"
                size={16}
                color="#fff"
              />
            </Pressable>
          </View>

          <View style={s.profileHeader}>
            <View style={s.avatarWrap}>
              <Image source={{ uri: avatarUri }} style={s.avatar} />
              <View style={s.avatarBadge}>
                <FontAwesome5
                  name="check"
                  iconStyle="solid"
                  size={8}
                  color="#fff"
                />
              </View>
            </View>
            <Text style={s.name}>{user?.name || 'SonicX User'}</Text>
            <View style={s.memberBadge}>
              <FontAwesome5
                name="star"
                iconStyle="solid"
                size={10}
                color={C.gold}
              />
              <Text style={s.memberText}>Thành viên Premium</Text>
            </View>
          </View>
        </View>

        <View style={s.statsCard}>
          <View style={s.statItem}>
            <Text style={s.statNum}>{user?.followers?.length ?? 0}</Text>
            <Text style={s.statLbl}>Người theo dõi</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statNum}>{user?.followings?.length ?? 0}</Text>
            <Text style={s.statLbl}>Đang theo dõi</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statNum}>{favoriteCount}</Text>
            <Text style={s.statLbl}>Yêu thích</Text>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Bảng điều khiển</Text>
          <View style={s.dashboardGrid}>
            <View style={[s.dashCard, { backgroundColor: '#1E1B4B' }]}>
              <FontAwesome5
                name="headphones"
                iconStyle="solid"
                size={18}
                color="#A5B4FC"
              />
              <View>
                <Text style={s.dashNum}>{user?.totalListened ?? 0}</Text>
                <Text style={s.dashLbl}>Đã phát</Text>
              </View>
            </View>
            <View style={[s.dashCard, { backgroundColor: '#064E3B' }]}>
              <FontAwesome5
                name="fire"
                iconStyle="solid"
                size={18}
                color="#6EE7B7"
              />
              <View>
                <Text style={s.dashNum}>{user?.streak ?? 0}</Text>
                <Text style={s.dashLbl}>Chuỗi ngày</Text>
              </View>
            </View>
            <View style={[s.dashCard, { backgroundColor: '#451A03' }]}>
              <FontAwesome5
                name="clock"
                iconStyle="solid"
                size={18}
                color="#FDE047"
              />
              <View>
                <Text style={s.dashNum}>{user?.hoursListened ?? 0}h</Text>
                <Text style={s.dashLbl}>Tổng cộng</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={s.menuSection}>
          <Text style={s.groupLabel}>TÀI KHOẢN</Text>
          <View style={s.menuGroup}>
            <MenuRow icon="user-shield" label="Bảng quản trị" onPress={() => navigation.navigate('AdminDashboard')} />
            <MenuRow icon="user-edit" label="Chỉnh sửa hồ sơ" onPress={() => navigation.navigate('EditProfile')} />
            <MenuRow icon="cog" label="Cài đặt" onPress={() => navigation.navigate('Settings')} />
            <MenuRow icon="bell" label="Thông báo" onPress={() => {}} />
          </View>

          <Text style={[s.groupLabel, { marginTop: 24 }]}>ỨNG DỤNG</Text>
          <View style={s.menuGroup}>
            <MenuRow
              icon="download"
              label="Tải xuống & Bộ nhớ đệm"
              onPress={() => {}}
            />
            <MenuRow icon="wifi" label="Chất lượng âm thanh" onPress={() => {}} />
            <MenuRow
              icon="language"
              label="Ngôn ngữ"
              value="Tiếng Việt"
              onPress={() => {}}
            />
          </View>

          <Text style={[s.groupLabel, { marginTop: 24 }]}>HỖ TRỢ</Text>
          <View style={s.menuGroup}>
            <MenuRow
              icon="question-circle"
              label="Trung tâm trợ giúp"
              onPress={() => {}}
            />
            <MenuRow icon="star" label="Đánh giá SonicX" onPress={() => {}} />
            <MenuRow
              icon="info-circle"
              label="Phiên bản"
              value="1.0.4"
              onPress={() => {}}
              isInfo
            />
          </View>
        </View>

        <Pressable style={s.logoutBtn} onPress={confirmLogout}>
          <Text style={s.logoutText}>Đăng xuất</Text>
        </Pressable>
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingBottom: 140 },

  heroContainer: { height: 380, justifyContent: 'flex-end', paddingBottom: 40 },
  heroImgWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  heroBg: { width: '100%', height: '100%', opacity: 0.4 },
  heroTopActions: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  iconBtn: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  profileHeader: { alignItems: 'center', gap: 16 },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 110,
    height: 110,
    backgroundColor: C.surface,
    borderWidth: 3,
    borderColor: '#fff',
    borderRadius: 55,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 12,
  },
  name: { fontSize: 32, fontWeight: '900', color: C.text, letterSpacing: -1 },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245,158,11,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  memberText: {
    fontSize: 11,
    fontWeight: '800',
    color: C.gold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    marginHorizontal: 24,
    paddingVertical: 24,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    marginTop: -20,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 30, backgroundColor: C.border },
  statNum: { fontSize: 22, fontWeight: '900', color: C.text },
  statLbl: { fontSize: 12, fontWeight: '600', color: C.sub, marginTop: 2 },

  section: { paddingHorizontal: 24, marginTop: 32 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: C.sub,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  dashboardGrid: { flexDirection: 'row', gap: 12 },
  dashCard: {
    flex: 1,
    padding: 16,
    gap: 16,
    justifyContent: 'space-between',
    height: 110,
    borderRadius: 10,
  },
  dashNum: { fontSize: 20, fontWeight: '900', color: '#fff' },
  dashLbl: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },

  menuSection: { paddingHorizontal: 24, marginTop: 32 },
  groupLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: C.sub,
    letterSpacing: 2,
    marginBottom: 12,
    marginLeft: 8,
  },
  menuGroup: {
    backgroundColor: C.surface,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 64,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: C.text,
    marginLeft: 12,
  },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuValue: { fontSize: 14, fontWeight: '600', color: C.sub },

  logoutBtn: {
    margin: 24,
    height: 56,
    backgroundColor: 'rgba(239,68,68,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.1)',
  },
  logoutText: { fontSize: 16, fontWeight: '900', color: C.danger },
});

export default Profile;
