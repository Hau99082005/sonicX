import React, { useEffect, useRef } from 'react';
import {
  Animated,
  TouchableOpacity,
  View,
  Text,
  Image,
  StyleSheet,
  Platform,
} from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { getAvatarUrl } from '../utils/helper';
import { navigate } from '../navigation/navigationRef';

const NotificationBanner = () => {
  const { theme } = useTheme();
  const { banner, dismissBanner } = useNotifications();
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (banner) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 10,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -120,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [banner]);

  if (!banner) return null;

  const senderName = banner.sender?.name || banner.sender?.username || 'Thông báo';
  const senderAvatar = banner.sender?.avatar;

  const typeIcon = () => {
    switch (banner.type) {
      case 'call': return 'phone-alt';
      case 'friend_request': return 'user-plus';
      case 'group_invite': return 'users';
      default: return 'comment-alt';
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: theme.surface,
          transform: [{ translateY }],
          opacity,
          shadowColor: theme.text,
        },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        style={styles.inner}
        activeOpacity={0.9}
        onPress={() => {
          dismissBanner();
          if (banner.conversationId) {
            navigate('ChatWindow', { conversation: { _id: banner.conversationId } });
          }
        }}
      >
        <View style={styles.avatarWrap}>
          <Image
            source={{ uri: getAvatarUrl(senderAvatar, senderName) }}
            style={styles.avatar}
          />
          <View style={[styles.typeIcon, { backgroundColor: theme.primary }]}>
            <FontAwesome5 name={typeIcon() as any} size={8} color="#fff" {...({ solid: true } as any)} />
          </View>
        </View>

        <View style={styles.textWrap}>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
            {senderName}
          </Text>
          <Text style={[styles.content, { color: theme.textSecondary }]} numberOfLines={1}>
            {banner.content}
          </Text>
        </View>

        <TouchableOpacity style={styles.closeBtn} onPress={dismissBanner} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
          <FontAwesome5 name="times" size={12} color={theme.textSecondary} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 14,
    left: 12,
    right: 12,
    borderRadius: 16,
    zIndex: 9999,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 12,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  avatarWrap: { position: 'relative' },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  typeIcon: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1, minWidth: 0 },
  name: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  content: { fontSize: 13 },
  closeBtn: { padding: 4 },
});

export default NotificationBanner;
