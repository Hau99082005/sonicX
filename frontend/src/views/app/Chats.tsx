import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { getConversations } from '../../api/chat';
import { getStories } from '../../api/story';

const Chats = ({ navigation }: any) => {
  const { theme } = useTheme();
  const { profile } = useAuth();
  const { onlineUsers } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [stories, setStories] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const convs = await getConversations();
      const strs = await getStories();
      setConversations(convs);
      setStories(strs);
    };
    fetchData();
  }, []);

  const renderStoryItem = ({ item }: any) => (
    <TouchableOpacity style={styles.storyItem}>
      <View style={[styles.storyAvatarContainer, { borderColor: theme.primary }]}>
        <Image source={{ uri: item.user.avatar?.url }} style={styles.storyAvatar} />
      </View>
      <Text style={[styles.storyName, { color: theme.text }]} numberOfLines={1}>
        {item.user.username}
      </Text>
    </TouchableOpacity>
  );

  const renderConversationItem = ({ item }: any) => {
    const otherMember = item.members.find((m: any) => m.user._id !== profile?.id)?.user;
    const isOnline = otherMember?.show_online_status && otherMember ? onlineUsers.has(otherMember._id) : false;
    
    return (
      <TouchableOpacity 
        style={styles.conversationItem}
        onPress={() => navigation.navigate('ChatWindow', { conversation: item })}
      >
        <View style={styles.avatarContainer}>
          <Image source={{ uri: otherMember?.avatar?.url }} style={styles.avatar} />
          {isOnline && <View style={[styles.onlineIndicator, { backgroundColor: theme.active, borderColor: theme.background }]} />}
        </View>
        <View style={styles.conversationInfo}>
          <Text style={[styles.conversationName, { color: theme.text }]}>{item.name || otherMember?.username}</Text>
          <Text style={[styles.lastMessage, { color: theme.textSecondary }]} numberOfLines={1}>
            {item.lastMessage?.message || 'Bắt đầu cuộc trò chuyện'}
          </Text>
        </View>
        <Text style={[styles.time, { color: theme.textSecondary }]}>9:40 AM</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.userAvatarContainer}>
            <Image source={{ uri: profile?.avatar || 'https://via.placeholder.com/40' }} style={styles.userAvatar} />
            <View style={[
              styles.userStatusIndicator, 
              { 
                backgroundColor: profile?.show_online_status ? theme.active : theme.surface,
                borderColor: theme.background 
              }
            ]}>
              {!profile?.show_online_status && (
                <FontAwesome5 name="moon" size={8} color={theme.textSecondary} {...({ solid: true } as any)} />
              )}
            </View>
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>Đoạn chat</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: theme.surface }]}>
            <FontAwesome5 name={"camera" as any} size={18} color={theme.text} {...({ solid: true } as any)} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: theme.surface }]}>
            <FontAwesome5 name={"pen" as any} size={18} color={theme.text} {...({ solid: true } as any)} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.searchBar, { backgroundColor: theme.surface }]}>
        <FontAwesome5 name={"search" as any} size={16} color={theme.textSecondary} style={styles.searchIcon} />
        <TextInput
          placeholder="Tìm kiếm"
          placeholderTextColor={theme.textSecondary}
          style={[styles.searchInput, { color: theme.text }]}
        />
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item: any) => item._id}
        renderItem={renderConversationItem}
        ListHeaderComponent={
          <View style={styles.storiesContainer}>
            <TouchableOpacity style={styles.storyItem}>
              <View style={[styles.addStoryBtn, { backgroundColor: theme.surface }]}>
                <FontAwesome5 name={"plus" as any} size={20} color={theme.text} />
              </View>
              <Text style={[styles.storyName, { color: theme.text }]}>Tin của bạn</Text>
            </TouchableOpacity>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={stories}
              keyExtractor={(item: any) => item._id}
              renderItem={renderStoryItem}
            />
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  userAvatarContainer: { position: 'relative', marginRight: 12 },
  userAvatar: { width: 40, height: 40, borderRadius: 20 },
  userStatusIndicator: { 
    position: 'absolute', 
    right: -2, 
    bottom: 0, 
    width: 14, 
    height: 14, 
    borderRadius: 7, 
    borderWidth: 2, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  title: { fontSize: 26, fontWeight: 'bold' },
  headerIcons: { flexDirection: 'row' },
  iconButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderRadius: 20, height: 40, marginBottom: 20 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16 },
  storiesContainer: { flexDirection: 'row', marginBottom: 20 },
  storyItem: { alignItems: 'center', marginRight: 15, width: 65 },
  storyAvatarContainer: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, padding: 2, marginBottom: 5 },
  storyAvatar: { width: '100%', height: '100%', borderRadius: 30 },
  addStoryBtn: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
  storyName: { fontSize: 12, textAlign: 'center' },
  conversationItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatarContainer: { position: 'relative', marginRight: 12 },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  onlineIndicator: { position: 'absolute', right: 0, bottom: 0, width: 16, height: 16, borderRadius: 8, borderWidth: 3 },
  conversationInfo: { flex: 1 },
  conversationName: { fontSize: 17, fontWeight: '600', marginBottom: 2 },
  lastMessage: { fontSize: 14 },
  time: { fontSize: 12 },
});

export default Chats;
