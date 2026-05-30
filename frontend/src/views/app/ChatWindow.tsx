import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { getMessages, sendMessage } from '../../api/chat';
import client from '../../api/client';
import moment from 'moment';
import Markdown from 'react-native-markdown-display';
import SyntaxHighlighter from 'react-native-syntax-highlighter';
import { tomorrowNight } from 'react-syntax-highlighter/dist/esm/styles/hljs';

const ChatWindow = ({ route, navigation }: any) => {
  const { theme } = useTheme();
  const { profile } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const { conversation } = route.params;
  const [messages, setMessages] = useState<any[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState(
    conversation._id,
  );
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [remoteTyping, setRemoteTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<any>(null);

  const otherMember = conversation.members.find(
    (m: any) => m.user._id !== profile?.id,
  )?.user;
  const isOnline = otherMember ? onlineUsers.has(otherMember._id) : false;

  useEffect(() => {
    if (socket && currentConversationId !== 'new') {
      socket.emit('join-conversation', currentConversationId);

      socket.on(
        'typing-status',
        (data: { userId: string; conversationId: string; typing: boolean }) => {
          if (
            data.conversationId === currentConversationId &&
            data.userId !== profile?.id
          ) {
            setRemoteTyping(data.typing);
          }
        },
      );

      return () => {
        socket.emit('leave-conversation', currentConversationId);
        socket.off('typing-status');
      };
    }
  }, [socket, currentConversationId]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (currentConversationId !== 'new') {
        const data = await getMessages(currentConversationId);
        setMessages(data.reverse());
      }
    };
    fetchMessages();
  }, [currentConversationId]);

  const handleTyping = (text: string) => {
    setInput(text);
    if (socket && currentConversationId !== 'new') {
      if (!isTyping) {
        setIsTyping(true);
        socket.emit('typing', {
          conversationId: currentConversationId,
          typing: true,
        });
      }

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        socket.emit('typing', {
          conversationId: currentConversationId,
          typing: false,
        });
      }, 2000);
    }
  };

  const handleSend = async (customMessage?: string, customType?: string) => {
    const messageText = (customMessage || input).trim();
    if (!messageText || isSending) return;

    setIsSending(true);
    if (socket && isTyping && currentConversationId !== 'new') {
      setIsTyping(false);
      socket.emit('typing', {
        conversationId: currentConversationId,
        typing: false,
      });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }

    let type = customType || 'text';
    if (!customType) {
      if (messageText.startsWith('```')) type = 'code';
      else if (
        messageText.includes('#') ||
        messageText.includes('*') ||
        messageText.includes('[')
      )
        type = 'markdown';
      else if (messageText.match(/^(http|https):\/\/[^\s]+$/))
        type = 'markdown'; // Treat single links as markdown for clickable
    }

    try {
      let convId = currentConversationId;
      if (convId === 'new') {
        const targetUserId = otherMember?._id || otherMember?.id;
        if (!targetUserId) return;

        const { data } = await client.post('/conversation/create', {
          type: 'private',
          members: [targetUserId],
        });
        convId = data.conversation._id;
        setCurrentConversationId(convId);
        socket?.emit('join-conversation', convId);
      }

      const formData = new FormData();
      formData.append('conversationId', convId);
      formData.append('message', messageText);
      formData.append('type', type);

      const newMsg = await sendMessage(formData);
      setMessages(prev => [...prev, newMsg]);
      if (!customMessage) setInput('');
      setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
    } catch (error) {
    } finally {
      setTimeout(() => setIsSending(false), 500);
    }
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
    const isCode = item.type === 'code';
    const isMarkdown = item.type === 'markdown';
    const isSticker = item.type === 'sticker';
    const isGif = item.type === 'gif';

    return (
      <View
        style={[
          styles.messageWrapper,
          isSelf ? styles.selfWrapper : styles.otherWrapper,
        ]}
      >
        {!isSelf && (
          <Image
            source={{ uri: item.sender.avatar?.url }}
            style={styles.miniAvatar}
          />
        )}
        <View
          style={[
            styles.bubble,
            {
              backgroundColor:
                isSticker || isGif
                  ? 'transparent'
                  : isSelf
                  ? theme.bubbleSelf
                  : theme.bubbleOther,
            },
            isSelf ? styles.selfBubble : styles.otherBubble,
            (isCode || isMarkdown) && { maxWidth: '100%', padding: 10 },
          ]}
        >
          {isCode ? (
            <SyntaxHighlighter
              language="javascript"
              style={tomorrowNight}
              customStyle={{ borderRadius: 8, padding: 10 }}
            >
              {item.message.replace(/```/g, '')}
            </SyntaxHighlighter>
          ) : isMarkdown ? (
            <Markdown
              style={{
                body: { color: isSelf ? theme.textSelf : theme.textOther },
                link: { color: theme.primary },
              }}
            >
              {item.message}
            </Markdown>
          ) : isSticker || isGif ? (
            <Image
              source={{ uri: item.message }}
              style={isSticker ? styles.stickerImage : styles.gifImage}
            />
          ) : (
            <Text
              style={{
                color: isSelf ? theme.textSelf : theme.textOther,
                fontSize: 16,
              }}
            >
              {item.message}
            </Text>
          )}
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
          <FontAwesome5
            name={'arrow-left' as any}
            size={20}
            color={theme.primary}
          />
        </TouchableOpacity>
        <Image
          source={{ uri: conversation.members[0].user.avatar?.url }}
          style={styles.headerAvatar}
        />
        <View style={styles.headerInfo}>
          <Text style={[styles.headerName, { color: theme.text }]}>
            {conversation.name || 'Chat'}
          </Text>
          <Text
            style={[
              styles.headerStatus,
              { color: isOnline ? theme.active : theme.textSecondary },
            ]}
          >
            {getStatusText()}
          </Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconBtn}>
            <FontAwesome5
              name={'phone-alt' as any}
              size={18}
              color={theme.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <FontAwesome5
              name={'video' as any}
              size={18}
              color={theme.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <FontAwesome5
              name={'info-circle' as any}
              size={18}
              color={theme.primary}
            />
          </TouchableOpacity>
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
        <TouchableOpacity
          style={styles.inputIcon}
          onPress={() =>
            handleSend(
              'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJmZ3NnZ3NnZ3NnZ3NnZ3NnZ3NnZ3NnZ3NnZ3NnZ3NnZ3NnJmZ3NnJmcm9tPXNlYXJjaCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/3o7TKMGpxP6tX0c0aI/giphy.gif',
              'sticker',
            )
          }
        >
          <FontAwesome5 name={'th' as any} size={20} color={theme.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.inputIcon}
          onPress={() =>
            handleSend(
              'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJmZ3NnZ3NnZ3NnZ3NnZ3NnZ3NnZ3NnZ3NnZ3NnZ3NnZ3NnJmZ3NnJmcm9tPXNlYXJjaCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/26AHONpT99J7Xz79C/giphy.gif',
              'gif',
            )
          }
        >
          <FontAwesome5
            name={'camera' as any}
            size={20}
            color={theme.primary}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.inputIcon}>
          <FontAwesome5 name={'image' as any} size={20} color={theme.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.inputIcon}>
          <FontAwesome5
            name={'microphone' as any}
            size={20}
            color={theme.primary}
          />
        </TouchableOpacity>
        <View style={[styles.inputWrapper, { backgroundColor: theme.surface }]}>
          <TextInput
            style={[styles.textInput, { color: theme.text }]}
            placeholder="Aa"
            placeholderTextColor={theme.textSecondary}
            value={input}
            onChangeText={handleTyping}
            multiline
          />
          <TouchableOpacity>
            <FontAwesome5
              name={'smile' as any}
              size={20}
              color={theme.primary}
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => handleSend()} style={styles.inputIcon}>
          <FontAwesome5
            name={(input ? 'paper-plane' : 'thumbs-up') as any}
            size={22}
            color={theme.primary}
            {...({ solid: true } as any)}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 0.5,
    paddingTop: 50,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginLeft: 15,
    marginRight: 10,
  },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: '700' },
  headerStatus: { fontSize: 12 },
  headerIcons: { flexDirection: 'row' },
  iconBtn: { marginLeft: 15 },
  messageList: { padding: 16 },
  messageWrapper: { flexDirection: 'row', marginBottom: 8, maxWidth: '80%' },
  selfWrapper: { alignSelf: 'flex-end' },
  otherWrapper: { alignSelf: 'flex-start' },
  miniAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  bubble: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18 },
  selfBubble: { borderBottomRightRadius: 4 },
  otherBubble: { borderBottomLeftRadius: 4 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingBottom: 30,
  },
  inputIcon: { padding: 8 },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 36,
  },
  textInput: { flex: 1, fontSize: 16, padding: 0 },
  typingContainer: { paddingVertical: 5, paddingLeft: 40 },
  typingText: { fontSize: 12, fontStyle: 'italic' },
  stickerImage: { width: 120, height: 120, borderRadius: 10 },
  gifImage: { width: 180, height: 120, borderRadius: 10 },
});

export default ChatWindow;
