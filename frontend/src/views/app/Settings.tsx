import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@react-native-vector-icons/fontawesome5';
import Toast from 'react-native-toast-message';

const C = {
  bg: '#000000',
  surface: '#000000',
  border: 'rgba(255, 255, 255, 0.08)',
  text: '#FFFFFF',
  sub: '#94A3B8',
  accent: '#7C3AED',
  danger: '#EF4444',
};

const SettingRow = ({ 
  icon, 
  label, 
  value, 
  onPress, 
  type = 'link' 
}: { 
  icon: string; 
  label: string; 
  value?: string | boolean; 
  onPress?: () => void;
  type?: 'link' | 'switch' | 'info';
}) => (
  <Pressable 
    style={s.row} 
    onPress={type !== 'info' ? onPress : undefined}
  >
    <View style={s.rowLeft}>
      <View style={s.iconWrap}>
        <FontAwesome5 name={icon as any} iconStyle="solid" size={14} color={C.sub} />
      </View>
      <Text style={s.label}>{label}</Text>
    </View>
    <View style={s.rowRight}>
      {type === 'link' && (
        <>
          {value && <Text style={s.value}>{value}</Text>}
          <FontAwesome5 name="chevron-right" iconStyle="solid" size={10} color={C.border} />
        </>
      )}
      {type === 'switch' && (
        <Switch 
          value={value as boolean} 
          onValueChange={onPress as any}
          trackColor={{ false: '#262626', true: C.accent }}
          thumbColor="#fff"
        />
      )}
      {type === 'info' && <Text style={s.value}>{value}</Text>}
    </View>
  </Pressable>
);

const Settings = ({ navigation }: any) => {
  const [notifs, setNotifs] = React.useState(true);
  const [highQual, setHighQual] = React.useState(true);
  const [dataSaver, setDataSaver] = React.useState(false);

  const handleClearCache = () => {
    Alert.alert('Xóa bộ nhớ đệm', 'Bạn có chắc chắn muốn xóa toàn bộ dữ liệu tạm thời?', [
      { text: 'Hủy', style: 'cancel' },
      { 
        text: 'Xóa', 
        style: 'destructive', 
        onPress: () => Toast.show({ type: 'success', text1: 'Đã xóa bộ nhớ đệm' }) 
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.header}>
          <Pressable style={s.backBtn} onPress={() => navigation.goBack()}>
            <FontAwesome5 name="chevron-left" iconStyle="solid" size={16} color={C.text} />
          </Pressable>
          <Text style={s.title}>Cài đặt</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          style={s.scrollView}
          contentContainerStyle={s.content}
        >
          <View style={s.section}>
            <Text style={s.sectionTitle}>TÀI KHOẢN</Text>
            <View style={s.group}>
              <SettingRow icon="user-edit" label="Thông tin cá nhân" onPress={() => {}} />
              <SettingRow icon="shield-alt" label="Bảo mật & Mật khẩu" onPress={() => {}} />
              <SettingRow icon="bell" label="Thông báo đẩy" type="switch" value={notifs} onPress={() => setNotifs(!notifs)} />
            </View>
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>CHẤT LƯỢNG ÂM THANH</Text>
            <View style={s.group}>
              <SettingRow icon="broadcast-tower" label="Streaming chất lượng cao" type="switch" value={highQual} onPress={() => setHighQual(!highQual)} />
              <SettingRow icon="database" label="Tiết kiệm dữ liệu" type="switch" value={dataSaver} onPress={() => setDataSaver(!dataSaver)} />
              <SettingRow icon="sliders-h" label="Bộ chỉnh âm (EQ)" onPress={() => {}} />
            </View>
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>BỘ NHỚ</Text>
            <View style={s.group}>
              <SettingRow icon="trash-alt" label="Xóa bộ nhớ đệm" onPress={handleClearCache} />
              <SettingRow icon="folder-open" label="Vị trí tải xuống" value="Bộ nhớ trong" onPress={() => {}} />
            </View>
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>THÔNG TIN</Text>
            <View style={s.group}>
              <SettingRow icon="info-circle" label="Phiên bản" value="1.0.4" type="info" />
              <SettingRow icon="file-alt" label="Điều khoản dịch vụ" onPress={() => {}} />
              <SettingRow icon="heart" label="Đánh giá ứng dụng" onPress={() => {}} />
            </View>
          </View>

          <Pressable style={s.logoutBtn} onPress={() => navigation.goBack()}>
            <Text style={s.logoutText}>Quay lại</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#000',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 18, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  scrollView: { flex: 1, backgroundColor: '#000' },
  content: { paddingBottom: 60, backgroundColor: '#000' },
  section: { marginTop: 28 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#666',
    letterSpacing: 1.5,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  group: {
    backgroundColor: '#000',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconWrap: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  value: { fontSize: 14, fontWeight: '600', color: '#94A3B8' },
  logoutBtn: {
    margin: 24,
    height: 56,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  logoutText: { fontSize: 15, fontWeight: '900', color: '#FFF' },
});

export default Settings;
