import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { getMessages, sendMessage } from '../../api/chat';
import moment from 'moment';

const ChatWindow = ({ route, navigation }: any) => {
  const { theme } = useTheme();
  const { profile } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const { conversation } = route.params;
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [remoteTyping, setRemoteTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<any>(null);

  const otherMember = conversation.members.find((m: any) => m.user._id !== profile?.id)?.user;
  const isOnline = otherMember ? onlineUsers.has(otherMember._id) : false;

  useEffect(() => {
    if (socket) {
      socket.emit('join-conversation', conversation._id);

      socket.on('typing-status', (data: { userId: string; conversationId: string; typing: boolean }) => {
        if (data.conversationId === conversation._id && data.userId !== profile?.id) {
          setRemoteTyping(data.typing);
        }
      });

      return () => {
        socket.emit('leave-conversation', conversation._id);
        socket.off('typing-status');
      };
    }
  }, [socket, conversation._id]);

  useEffect(() => {
    const fetchMessages = async () => {
      const data = await getMessages(conversation._id);
      setMessages(data.reverse());
    };
    fetchMessages();
  }, [conversation._id]);

  const handleTyping = (text: string) => {
    setInput(text);
    if (socket) {
      if (!isTyping) {
        setIsTyping(true);
        socket.emit('typing', { conversationId: conversation._id, typing: true });
      }

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        socket.emit('typing', { conversationId: conversation._id, typing: false });
      }, 2000);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    if (socket && isTyping) {
      setIsTyping(false);
      socket.emit('typing', { conversationId: conversation._id, typing: false });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }

    const formData = new FormData();
    formData.append('conversationId', conversation._id);
    formData.append('message', input);
    formData.append('type', 'text');
    
    const newMsg = await sendMessage(formData);
    setMessages([...messages, newMsg]);
    setInput('');
    setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
  };

  const getStatusText = () => {
    if (!otherMember?.show_online_status) return 'Ngoại tuyến';
    if (isOnline) return 'Đang hoạt động';
    if (otherMember?.last_seen) {
      return `Hoạt động ${moment(otherMember.last_seen).fromNow()}`;
    }
    return 'Ngoại tuyến';
  };

  const renderMessage = ({ item }: any) => {
    const isSelf = item.sender._id === profile?.id;
    return (
      <View style={[styles.messageWrapper, isSelf ? styles.selfWrapper : styles.otherWrapper]}>
        {!isSelf && <Image source={{ uri: item.sender.avatar?.url }} style={styles.miniAvatar} />}
        <View style={[
          styles.bubble, 
          { backgroundColor: isSelf ? theme.bubbleSelf : theme.bubbleOther },
          isSelf ? styles.selfBubble : styles.otherBubble
        ]}>
          <Text style={{ color: isSelf ? theme.textSelf : theme.textOther, fontSize: 16 }}>{item.message}</Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.background }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FontAwesome5 name={"arrow-left" as any} size={20} color={theme.primary} />
        </TouchableOpacity>
        <Image source={{ uri: conversation.members[0].user.avatar?.url }} style={styles.headerAvatar} />
        <View style={styles.headerInfo}>
          <Text style={[styles.headerName, { color: theme.text }]}>{conversation.name || 'Chat'}</Text>
          <Text style={[styles.headerStatus, { color: isOnline ? theme.active : theme.textSecondary }]}>{getStatusText()}</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconBtn}><FontAwesome5 name={"phone-alt" as any} size={18} color={theme.primary} /></TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}><FontAwesome5 name={"video" as any} size={18} color={theme.primary} /></TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}><FontAwesome5 name={"info-circle" as any} size={18} color={theme.primary} /></TouchableOpacity>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item: any) => item._id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        ListFooterComponent={
          remoteTyping ? (
            <View style={styles.typingContainer}>
              <Text style={[styles.typingText, { color: theme.textSecondary }]}>
                {otherMember?.name || 'Ai đó'} đang soạn tin nhắn...
              </Text>
            </View>
          ) : null
        }
      />

      <View style={[styles.inputContainer, { borderTopColor: theme.border }]}>
        <TouchableOpacity style={styles.inputIcon}><FontAwesome5 name={"th" as any} size={20} color={theme.primary} /></TouchableOpacity>
        <TouchableOpacity style={styles.inputIcon}><FontAwesome5 name={"camera" as any} size={20} color={theme.primary} /></TouchableOpacity>
        <TouchableOpacity style={styles.inputIcon}><FontAwesome5 name={"image" as any} size={20} color={theme.primary} /></TouchableOpacity>
        <TouchableOpacity style={styles.inputIcon}><FontAwesome5 name={"microphone" as any} size={20} color={theme.primary} /></TouchableOpacity>
        <View style={[styles.inputWrapper, { backgroundColor: theme.surface }]}>
          <TextInput
            style={[styles.textInput, { color: theme.text }]}
            placeholder="Aa"
            placeholderTextColor={theme.textSecondary}
            value={input}
            onChangeText={handleTyping}
            multiline
          />
          <TouchableOpacity><FontAwesome5 name={"smile" as any} size={20} color={theme.primary} /></TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleSend} style={styles.inputIcon}>
          <FontAwesome5 name={(input ? "paper-plane" : "thumbs-up") as any} size={22} color={theme.primary} {...({ solid: true } as any)} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 0.5, paddingTop: 50 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, marginLeft: 15, marginRight: 10 },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: '700' },
  headerStatus: { fontSize: 12 },
  headerIcons: { flexDirection: 'row' },
  iconBtn: { marginLeft: 15 },
  messageList: { padding: 16 },
  messageWrapper: { flexDirection: 'row', marginBottom: 8, maxWidth: '80%' },
  selfWrapper: { alignSelf: 'flex-end' },
  otherWrapper: { alignSelf: 'flex-start' },
  miniAvatar: { width: 28, height: 28, borderRadius: 14, marginRight: 8, alignSelf: 'flex-end' },
  bubble: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18 },
  selfBubble: { borderBottomRightRadius: 4 },
  otherBubble: { borderBottomLeftRadius: 4 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 8, paddingBottom: 30 },
  inputIcon: { padding: 8 },
  inputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 12, height: 36 },
  textInput: { flex: 1, fontSize: 16, padding: 0 },
  typingContainer: { paddingVertical: 5, paddingLeft: 40 },
  typingText: { fontSize: 12, fontStyle: 'italic' },
});

export default ChatWindow;
