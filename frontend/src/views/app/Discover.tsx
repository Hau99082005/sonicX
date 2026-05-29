import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, TextInput } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

const Discover = () => {
  const { theme } = useTheme();

  const businesses = [
    { id: '1', name: 'Apple', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg' },
    { id: '2', name: 'Samsung', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg' },
    { id: '3', name: 'Airbnb', logo: 'https://upload.wikimedia.org/wikipedia/commons/6/69/Airbnb_Logo_B%C3%A9lo.svg' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Khám phá</Text>
      </View>

      <View style={[styles.searchBar, { backgroundColor: theme.surface }]}>
        <FontAwesome5 name={"search" as any} size={16} color={theme.textSecondary} style={styles.searchIcon} />
        <TextInput
          placeholder="Tìm kiếm"
          placeholderTextColor={theme.textSecondary}
          style={[styles.searchInput, { color: theme.text }]}
        />
      </View>

      <View style={styles.tabHeader}>
        <TouchableOpacity style={[styles.tab, { borderBottomColor: theme.text }]}>
          <Text style={[styles.tabText, { color: theme.text }]}>DÀNH CHO BẠN</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={[styles.tabText, { color: theme.textSecondary }]}>DOANH NGHIỆP</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Gần đây</Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={businesses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.businessItem}>
            <View style={[styles.logoContainer, { backgroundColor: theme.surface }]}>
              <FontAwesome5 name={"briefcase" as any} size={24} color={theme.text} />
            </View>
            <Text style={[styles.businessName, { color: theme.text }]}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />

      <Text style={[styles.sectionTitle, { color: theme.textSecondary, marginTop: 25 }]}>Xem thêm</Text>
      <View style={styles.moreItem}>
        <View style={[styles.moreIcon, { backgroundColor: '#FF4500' }]}>
          <FontAwesome5 name={"rocket" as any} size={20} color="#fff" />
        </View>
        <View style={styles.moreInfo}>
          <Text style={[styles.moreTitle, { color: theme.text }]}>Microsoft</Text>
          <Text style={[styles.moreSub, { color: theme.textSecondary }]}>Science, Technology & Engineering</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 50 },
  header: { marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold' },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderRadius: 20, height: 40, marginBottom: 20 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16 },
  tabHeader: { flexDirection: 'row', marginBottom: 20 },
  tab: { flex: 1, alignItems: 'center', paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontSize: 13, fontWeight: '700' },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 15 },
  businessItem: { alignItems: 'center', marginRight: 20 },
  logoContainer: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  businessName: { fontSize: 13, fontWeight: '500' },
  moreItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  moreIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  moreInfo: { flex: 1 },
  moreTitle: { fontSize: 16, fontWeight: '600' },
  moreSub: { fontSize: 13 },
});

export default Discover;
