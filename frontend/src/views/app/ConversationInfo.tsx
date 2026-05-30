import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useTheme } from '../../context/ThemeContext';
import { getAvatarUrl } from '../../utils/helper';

const ConversationInfo = ({ route, navigation }: any) => {
  const { theme } = useTheme();
  const { otherMember, conversation } = route.params || {};

  const name = otherMember?.name || conversation?.name || 'Người dùng';
  const avatar = otherMember?.avatar;
  const [zoomVisible, setZoomVisible] = useState(false);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FontAwesome5
            name={'arrow-left' as any}
            size={20}
            color={theme.primary}
          />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Thông tin</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileRow}>
          <TouchableOpacity
            onPress={() => setZoomVisible(true)}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: getAvatarUrl(avatar, name) }}
              style={[styles.avatar, { borderColor: theme.background }]}
            />
          </TouchableOpacity>
          <View style={styles.profileInfo}>
            <Text style={[styles.name, { color: theme.text }]}>{name}</Text>
            <Text style={[styles.status, { color: theme.textSecondary }]}>
              {otherMember?.bio || 'Không có mô tả'}
            </Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn}>
            <View
              style={[styles.actionIcon, { backgroundColor: theme.surface }]}
            >
              <FontAwesome5 name="phone" size={20} color={theme.primary} />
            </View>
            <Text style={[styles.actionLabel, { color: theme.text }]}>
              Âm thanh
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn}>
            <View
              style={[styles.actionIcon, { backgroundColor: theme.surface }]}
            >
              <FontAwesome5 name="video" size={20} color={theme.primary} />
            </View>
            <Text style={[styles.actionLabel, { color: theme.text }]}>
              Video
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn}>
            <View
              style={[styles.actionIcon, { backgroundColor: theme.surface }]}
            >
              <FontAwesome5 name="user" size={20} color={theme.primary} />
            </View>
            <Text style={[styles.actionLabel, { color: theme.text }]}>
              Hồ sơ
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn}>
            <View
              style={[styles.actionIcon, { backgroundColor: theme.surface }]}
            >
              <FontAwesome5 name="bell" size={20} color={theme.primary} />
            </View>
            <Text style={[styles.actionLabel, { color: theme.text }]}>
              Tắt thông báo
            </Text>
          </TouchableOpacity>
        </View>

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
                source={{ uri: getAvatarUrl(avatar, name) }}
                style={styles.modalImage}
                resizeMode="contain"
              />
            </ScrollView>
          </View>
        </Modal>

        <View style={[styles.section, { borderTopColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Tùy chỉnh
          </Text>
          <TouchableOpacity
            style={[styles.row, { backgroundColor: theme.surface }]}
          >
            <Text style={[styles.rowLabel, { color: theme.text }]}>Màu</Text>
            <View style={styles.rowValue}>
              <FontAwesome5
                name="chevron-right"
                size={14}
                color={theme.textSecondary}
                style={styles.rowChevron}
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.row, { backgroundColor: theme.surface }]}
          >
            <Text style={[styles.rowLabel, { color: theme.text }]}>
              Biểu tượng cảm xúc
            </Text>
            <View style={styles.rowValue}>
              <FontAwesome5
                name="chevron-right"
                size={14}
                color={theme.textSecondary}
                style={styles.rowChevron}
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.row, { backgroundColor: theme.surface }]}
          >
            <Text style={[styles.rowLabel, { color: theme.text }]}>
              Biệt hiệu
            </Text>
            <FontAwesome5
              name="chevron-right"
              size={14}
              color={theme.textSecondary}
              style={styles.rowChevron}
            />
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { borderTopColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Hành động khác
          </Text>
          <TouchableOpacity
            style={[styles.row, { backgroundColor: theme.surface }]}
          >
            <Text style={[styles.rowLabel, { color: theme.text }]}>
              Tìm trong đoạn chat
            </Text>
            <FontAwesome5 name="search" size={16} color={theme.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.row, { backgroundColor: theme.surface }]}
          >
            <Text style={[styles.rowLabel, { color: theme.text }]}>
              Tạo nhóm
            </Text>
            <FontAwesome5 name="users" size={16} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.section,
            { borderTopColor: theme.border, marginBottom: 40 },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Quyền riêng tư
          </Text>
          <TouchableOpacity
            style={[styles.row, { backgroundColor: theme.surface }]}
          >
            <Text style={[styles.rowLabel, { color: theme.text }]}>
              Thông báo
            </Text>
            <Text style={{ color: theme.textSecondary }}>Bật</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.row, { backgroundColor: theme.surface }]}
          >
            <Text style={[styles.rowLabel, { color: theme.text }]}>Chặn</Text>
            <FontAwesome5 name="ban" size={16} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    paddingTop: 50,
    borderBottomWidth: 0.5,
  },
  title: { fontSize: 18, fontWeight: '700' },
  content: { padding: 16 },
  profileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatar: { width: 84, height: 84, borderRadius: 42, marginRight: 12 },
  profileInfo: { flex: 1 },
  name: { fontSize: 20, fontWeight: '700' },
  status: { fontSize: 14, marginTop: 4 },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    maxWidth: 92,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  actionIcon: {
    width: 68,
    height: 68,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  actionLabel: { marginTop: 8, fontSize: 13, fontWeight: '600' },
  section: { marginTop: 10, borderTopWidth: 0.5, paddingTop: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    minHeight: 56,
    borderRadius: 12,
    marginBottom: 10,
  },
  rowLabel: { fontSize: 16, fontWeight: '600' },
  rowValue: { flexDirection: 'row', alignItems: 'center' },
  rowChevron: { marginLeft: 10 },
  emojiValue: { fontSize: 18, marginRight: 6 },
  colorDot: { width: 20, height: 20, borderRadius: 10, marginRight: 10 },
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

export default ConversationInfo;
