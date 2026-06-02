import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
} from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';

const NotificationSettings = ({ navigation }: any) => {
  const { theme } = useTheme();
  const { settings, handleUpdateSettings } = useNotifications();
  const [saving, setSaving] = useState(false);

  const toggle = async (key: keyof typeof settings) => {
    try {
      setSaving(true);
      await handleUpdateSettings({ [key]: !settings[key] });
    } catch {
      Toast.show({ type: 'error', text1: 'Không thể cập nhật cài đặt' });
    } finally {
      setSaving(false);
    }
  };

  const SettingRow = ({
    icon,
    iconBg,
    label,
    sub,
    settingKey,
    disabled,
  }: {
    icon: string;
    iconBg: string;
    label: string;
    sub?: string;
    settingKey: keyof typeof settings;
    disabled?: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: theme.border }]}
      onPress={() => !disabled && toggle(settingKey)}
      activeOpacity={0.75}
      disabled={disabled || saving}
    >
      <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
        <FontAwesome5 name={icon as any} size={15} color="#fff" {...({ solid: true } as any)} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, { color: disabled ? theme.textSecondary : theme.text }]}>
          {label}
        </Text>
        {sub ? (
          <Text style={[styles.rowSub, { color: theme.textSecondary }]}>{sub}</Text>
        ) : null}
      </View>
      <Switch
        value={Boolean(settings[settingKey])}
        onValueChange={(_val: boolean) => { if (!disabled) toggle(settingKey); }}
        disabled={disabled || saving}
        trackColor={{ false: theme.border, true: theme.primary }}
        thumbColor="#fff"
      />
    </TouchableOpacity>
  );

  const disabled = !settings.enabled;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <FontAwesome5 name="arrow-left" size={18} color={theme.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Thông báo & âm thanh</Text>
        {saving ? (
          <ActivityIndicator size="small" color={theme.primary} style={{ width: 36 }} />
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>TỔNG QUAN</Text>
          <SettingRow
            icon="bell"
            iconBg={theme.primary}
            label="Bật thông báo"
            sub="Cho phép nhận tất cả thông báo"
            settingKey="enabled"
          />
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>ÂM THANH & RUNG</Text>
          <SettingRow
            icon="volume-up"
            iconBg="#31A24C"
            label="Âm thanh thông báo"
            sub="Phát âm thanh khi nhận thông báo"
            settingKey="sound"
            disabled={disabled}
          />
          <SettingRow
            icon="mobile-alt"
            iconBg="#FF6B00"
            label="Rung"
            sub="Rung thiết bị khi nhận thông báo"
            settingKey="vibration"
            disabled={disabled}
          />
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>NỘI DUNG HIỂN THỊ</Text>
          <SettingRow
            icon="eye"
            iconBg="#0084FF"
            label="Xem trước nội dung"
            sub="Hiển thị nội dung tin nhắn trong thông báo"
            settingKey="preview"
            disabled={disabled}
          />
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>LOẠI THÔNG BÁO</Text>
          <SettingRow
            icon="comment-alt"
            iconBg="#0084FF"
            label="Tin nhắn"
            settingKey="messages"
            disabled={disabled}
          />
          <SettingRow
            icon="phone-alt"
            iconBg="#31A24C"
            label="Cuộc gọi"
            settingKey="calls"
            disabled={disabled}
          />
          <SettingRow
            icon="user-plus"
            iconBg="#7C3AED"
            label="Lời mời kết bạn"
            settingKey="friendRequests"
            disabled={disabled}
          />
          <SettingRow
            icon="users"
            iconBg="#FF6B00"
            label="Lời mời vào nhóm"
            settingKey="groupInvites"
            disabled={disabled}
          />
        </View>

        {disabled && (
          <View style={[styles.disabledNote, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <FontAwesome5 name="info-circle" size={14} color={theme.textSecondary} />
            <Text style={[styles.disabledNoteText, { color: theme.textSecondary }]}>
              Bật thông báo để có thể tuỳ chỉnh các cài đặt bên dưới
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 14,
    borderBottomWidth: 0.5,
  },
  backBtn: { padding: 4 },
  title: { flex: 1, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  section: {
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 0.4,
    gap: 14,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: '600' },
  rowSub: { fontSize: 12, marginTop: 2 },
  disabledNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 20,
    padding: 14,
    borderRadius: 12,
    borderWidth: 0.5,
  },
  disabledNoteText: { flex: 1, fontSize: 13, lineHeight: 18 },
});

export default NotificationSettings;
