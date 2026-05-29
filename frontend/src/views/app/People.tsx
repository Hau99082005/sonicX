import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  SectionList,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { getFriends } from '../../api/friendship';

const People = () => {
  const { theme } = useTheme();
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    const fetchFriends = async () => {
      const data = await getFriends();
      setFriends(data);
    };
    fetchFriends();
  }, []);

  const renderFriendItem = ({ item }: any) => (
    <TouchableOpacity style={styles.friendItem}>
      <View style={styles.avatarContainer}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        {item.is_online && (
          <View
            style={[
              styles.onlineIndicator,
              { backgroundColor: theme.active, borderColor: theme.background },
            ]}
          />
        )}
      </View>
      <Text style={[styles.friendName, { color: theme.text }]}>
        {item.username}
      </Text>
      <TouchableOpacity
        style={[styles.waveButton, { backgroundColor: theme.surface }]}
      >
        <FontAwesome5 name={'hand-paper' as any} size={16} color={theme.text} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Danh bạ</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: theme.surface }]}
          >
            <FontAwesome5
              name={'address-book' as any}
              size={18}
              color={theme.text}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: theme.surface }]}
          >
            <FontAwesome5
              name={'user-plus' as any}
              size={18}
              color={theme.text}
            />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.storiesEntry}>
        <View style={[styles.addStoryBtn, { backgroundColor: theme.surface }]}>
          <FontAwesome5 name={'plus' as any} size={18} color={theme.text} />
        </View>
        <Text style={[styles.entryText, { color: theme.text }]}>
          Tin của bạn
        </Text>
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
        MỚI HOẠT ĐỘNG
      </Text>
      <FlatList
        data={friends}
        keyExtractor={(item: any) => item._id}
        renderItem={renderFriendItem}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 50 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 28, fontWeight: 'bold' },
  headerIcons: { flexDirection: 'row' },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  storiesEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  addStoryBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  entryText: { fontSize: 16, fontWeight: '600' },
  sectionTitle: { fontSize: 13, fontWeight: '700', marginBottom: 15 },
  friendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  avatarContainer: { position: 'relative', marginRight: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  onlineIndicator: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  friendName: { flex: 1, fontSize: 16, fontWeight: '500' },
  waveButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default People;
