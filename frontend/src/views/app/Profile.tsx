import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@react-native-vector-icons/fontawesome5';
import { getProfile } from '@api/music';
import { getUser, clearStorage } from '@utils/storage';
import Toast from 'react-native-toast-message';
import { appLogout } from '../../../App';

const COLORS = {
  primary: '#2563EB',
  background: '#0A0D14',
  surface: '#13172A',
  border: '#1E2235',
  text: '#F1F5F9',
  textSecondary: '#64748B',
  gold: '#F59E0B',
  danger: '#EF4444',
};

const Profile = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [favoriteAlbums, setFavoriteAlbums] = useState([]);
  const [favoriteMusics, setFavoriteMusics] = useState([]);

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const userData = await getUser();
      setUser(userData);
      const response = await getProfile();
      setFavoriteAlbums(response.data?.favoriteAlbums || []);
      setFavoriteMusics(response.data?.favoriteMusics || []);
    } catch {
      Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Không thể tải hồ sơ', visibilityTime: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const confirmLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc muốn đăng xuất không?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đăng xuất', style: 'destructive', onPress: handleLogout },
      ],
    );
  };

  const handleLogout = async () => {
    try {
      await clearStorage();
      Toast.show({
        type: 'success',
        text1: 'Đăng xuất thành công',
        text2: 'Hẹn gặp lại bạn!',
        visibilityTime: 2000,
      });
      setTimeout(() => appLogout(), 500);
    } catch {
      Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Không thể đăng xuất', visibilityTime: 3000 });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hồ sơ</Text>
        <Pressable onPress={confirmLogout} style={styles.logoutBtn} hitSlop={8}>
          <FontAwesome5 name="sign-out-alt" iconStyle="solid" size={17} color={COLORS.textSecondary} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroSection}>
          <View style={styles.avatarWrapper}>
            <Image
              source={{ uri: user?.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.name || 'U') + '&background=1E2235&color=F1F5F9&size=200' }}
              style={styles.avatar}
            />
            <View style={styles.avatarBadge}>
              <FontAwesome5 name="music" iconStyle="solid" size={10} color="#fff" />
            </View>
          </View>
          <Text style={styles.name}>{user?.name ?? 'Người dùng'}</Text>
          <View style={styles.memberBadge}>
            <FontAwesome5 name="star" iconStyle="solid" size={10} color={COLORS.gold} />
            <Text style={styles.memberText}>Thành viên Vàng</Text>
          </View>
          <Text style={styles.bio}>{user?.bio || 'Yêu âm nhạc'}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user?.followers ?? 0}</Text>
            <Text style={styles.statLabel}>Người theo dõi</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user?.following ?? 0}</Text>
            <Text style={styles.statLabel}>Đang theo dõi</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{favoriteMusics.length}</Text>
            <Text style={styles.statLabel}>Yêu thích</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <FontAwesome5 name="compact-disc" iconStyle="solid" size={13} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Album yêu thích</Text>
            </View>
            <Pressable hitSlop={8}>
              <Text style={styles.seeAll}>Xem tất cả</Text>
            </Pressable>
          </View>
          {favoriteAlbums.length === 0 ? (
            <View style={styles.emptyRow}>
              <FontAwesome5 name="compact-disc" iconStyle="solid" size={28} color={COLORS.border} />
              <Text style={styles.emptyText}>Chưa có album yêu thích</Text>
            </View>
          ) : (
            <View style={styles.albumGrid}>
              {favoriteAlbums.slice(0, 3).map((album: any, index) => (
                <Pressable key={index} style={styles.albumCard}>
                  <Image
                    source={{ uri: album.image || 'https://via.placeholder.com/100' }}
                    style={styles.albumImage}
                  />
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <FontAwesome5 name="heart" iconStyle="solid" size={13} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Nhạc yêu thích</Text>
            </View>
            <Pressable hitSlop={8}>
              <Text style={styles.seeAll}>Xem tất cả</Text>
            </Pressable>
          </View>
          {favoriteMusics.length === 0 ? (
            <View style={styles.emptyRow}>
              <FontAwesome5 name="music" iconStyle="solid" size={28} color={COLORS.border} />
              <Text style={styles.emptyText}>Chưa có nhạc yêu thích</Text>
            </View>
          ) : (
            <View style={styles.albumGrid}>
              {favoriteMusics.slice(0, 3).map((music: any, index) => (
                <Pressable key={index} style={styles.albumCard}>
                  <Image
                    source={{ uri: music.image || 'https://via.placeholder.com/100' }}
                    style={styles.albumImage}
                  />
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <View style={styles.actionGroup}>
          <Pressable style={styles.editButton}>
            <FontAwesome5 name="pen" iconStyle="solid" size={13} color="#fff" />
            <Text style={styles.editButtonText}>Chỉnh sửa hồ sơ</Text>
          </Pressable>

          <Pressable style={styles.logoutButton} onPress={confirmLogout}>
            <FontAwesome5 name="sign-out-alt" iconStyle="solid" size={13} color={COLORS.danger} />
            <Text style={styles.logoutButtonText}>Đăng xuất</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loaderWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: COLORS.text,
  },
  logoutBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 110,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 14,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.surface,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  name: {
    fontFamily: 'Inter-Bold',
    fontSize: 22,
    color: COLORS.text,
    marginBottom: 6,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(245,158,11,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 10,
  },
  memberText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: COLORS.gold,
  },
  bio: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 28,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.border,
  },
  statNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: COLORS.text,
    marginBottom: 3,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: COLORS.text,
  },
  seeAll: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: COLORS.primary,
  },
  emptyRow: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  albumGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  albumCard: {
    flex: 1,
  },
  albumImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
  },
  actionGroup: {
    paddingHorizontal: 20,
    gap: 10,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    gap: 8,
  },
  editButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: '#fff',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    gap: 8,
  },
  logoutButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: COLORS.danger,
  },
});

export default Profile;
