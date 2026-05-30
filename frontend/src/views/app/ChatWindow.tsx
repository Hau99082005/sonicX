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
  Animated,
  Pressable,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { getMessages, sendMessage } from '../../api/chat';
import client from '../../api/client';
import { fetchEmojiList } from '../../api/emoji';
import { fetchGifs } from '../../api/gif';
import moment from 'moment';
import Markdown from 'react-native-markdown-display';
import SyntaxHighlighter from 'react-native-syntax-highlighter';
import { tomorrowNight } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import Toast from 'react-native-toast-message';
import { getAvatarUrl } from '../../utils/helper';

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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [lastSentTime, setLastSentTime] = useState(0);
  const [likeScale] = useState(new Animated.Value(1));
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<any>(null);

  const emojiCategoryOptions = [
    { key: 'people', title: 'Người', icon: '😀' },
    { key: 'animals', title: 'Động vật', icon: '🐻' },
    { key: 'food', title: 'Ăn uống', icon: '🍔' },
    { key: 'activity', title: 'Hoạt động', icon: '⚽' },
    { key: 'travel', title: 'Du lịch', icon: '✈️' },
    { key: 'objects', title: 'Đồ vật', icon: '💡' },
    { key: 'symbols', title: 'Ký hiệu', icon: '🔣' },
    { key: 'flags', title: 'Cờ', icon: '🏳️' },
  ];
  const [emojiCategories, setEmojiCategories] = useState<
    Array<{ key: string; title: string; icon: string; emojis: string[] }>
  >([]);
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState('people');
  const [gifList, setGifList] = useState<
    Array<{ id: string; url: string; preview: string }>
  >([]);

  const getEmojiCategoryKey = (char: string) => {
    const code = char.codePointAt(0) ?? 0;
    if (code >= 0x1f1e6 && code <= 0x1f1ff) return 'flags';
    if (code >= 0x1f680 && code <= 0x1f6ff) return 'travel';
    if (code >= 0x1f300 && code <= 0x1f33f) return 'objects';
    if (code >= 0x1f340 && code <= 0x1f37f) return 'food';
    if (code >= 0x1f380 && code <= 0x1f3ff) return 'activity';
    if (code >= 0x1f400 && code <= 0x1f4ff) return 'animals';
    if (code >= 0x1f500 && code <= 0x1f5ff) return 'objects';
    if (code >= 0x1f600 && code <= 0x1f64f) return 'people';
    if (code >= 0x1f650 && code <= 0x1f67f) return 'people';
    if (code >= 0x1f680 && code <= 0x1f6ff) return 'travel';
    if (code >= 0x1f700 && code <= 0x1f77f) return 'symbols';
    if (
      (code >= 0x2600 && code <= 0x26ff) ||
      (code >= 0x2700 && code <= 0x27bf)
    )
      return 'symbols';
    if (code >= 0x1f900 && code <= 0x1f9ff) return 'people';
    return 'objects';
  };

  const buildEmojiCategories = (list: string[]) => {
    const groups = emojiCategoryOptions.reduce(
      (acc, item) => ({ ...acc, [item.key]: [] as string[] }),
      {} as Record<string, string[]>,
    );

    list.forEach(char => {
      const category = getEmojiCategoryKey(char);
      if (groups[category]) groups[category].push(char);
    });

    return emojiCategoryOptions
      .map(option => ({
        ...option,
        emojis: groups[option.key],
      }))
      .filter(option => option.emojis.length > 0);
  };

  const stickers = [
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJmZ3NnZ3NnZ3NnZ3NnZ3NnZ3NnZ3NnZ3NnZ3NnZ3NnZ3NnJmZ3NnJmcm9tPXNlYXJjaCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/3o7TKMGpxP6tX0c0aI/giphy.gif',
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJmZ3NnZ3NnZ3NnZ3NnZ3NnZ3NnZ3NnZ3NnZ3NnZ3NnZ3NnJmZ3NnJmcm9tPXNlYXJjaCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/l0HlT6E6pG9PqV8q4/giphy.gif',
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJmZ3NnZ3NnZ3NnZ3NnZ3NnZ3NnZ3NnZ3NnZ3NnZ3NnZ3NnJmZ3NnJmcm9tPXNlYXJjaCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/3o7TKVUn7iM8FMEU24/giphy.gif',
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJmZ3NnZ3NnZ3NnZ3NnZ3NnZ3NnZ3NnZ3NnZ3NnZ3NnZ3NnJmZ3NnJmcm9tPXNlYXJjaCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/l0HlHfrbO187gYxTq/giphy.gif',
  ];

  const otherMember = conversation.members.find(
    (m: any) => m.user._id !== profile?.id,
  )?.user;
  const isOnline = otherMember ? onlineUsers.has(otherMember._id) : false;

  useEffect(() => {
    (async () => {
      try {
        const list = await fetchEmojiList();
        if (Array.isArray(list)) {
          const chars = list.map(i => i.char);
          const grouped = buildEmojiCategories(chars);
          setEmojiCategories(grouped);
          if (grouped.length) setSelectedEmojiCategory(grouped[0].key);
        }
      } catch (e) {
        const fallback = ['😀', '😂', '😍', '😎', '👍', '🙏', '❤️', '✨'];
        const grouped = buildEmojiCategories(fallback);
        setEmojiCategories(grouped);
        if (grouped.length) setSelectedEmojiCategory(grouped[0].key);
      }
    })();

    (async () => {
      try {
        const gifs = await fetchGifs();
        setGifList(gifs);
      } catch (_) {
        setGifList([]);
      }
    })();

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

      socket.on('new-message', (data: { message: any }) => {
        if (
          data.message.conversation === currentConversationId &&
          data.message.sender._id !== profile?.id
        ) {
          setMessages(prev => [...prev, data.message]);
          setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
        }
      });

      return () => {
        socket.emit('leave-conversation', currentConversationId);
        socket.off('typing-status');
        socket.off('new-message');
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

  const handleSend = async (
    customMessage?: string,
    customType?: string,
    meta?: any,
  ) => {
    const messageText = (customMessage || input).trim();
    if (!messageText && !customType && isSending) return;

    // Spam prevention: limit sending to once every 500ms
    const now = Date.now();
    if (now - lastSentTime < 500) {
      console.log('Spam prevented');
      return;
    }
    setLastSentTime(now);

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

      const messageData = {
        conversationId: convId,
        message: type === 'like' ? '👍' : messageText,
        type: type,
        meta: meta,
      };

      const newMsg = await sendMessage(messageData);
      setMessages(prev => [...prev, newMsg]);
      if (!customMessage) setInput('');

      // Close pickers after sending
      setShowEmojiPicker(false);
      setShowStickerPicker(false);
      setShowGifPicker(false);

      setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
    } catch (error: any) {
      console.error('Send error:', error);
      const errorMsg = error.response?.data?.error || 'Không thể gửi tin nhắn';
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: errorMsg,
      });
    } finally {
      setTimeout(() => setIsSending(false), 500);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setInput(prev => prev + emoji);
  };

  const handleLikePressIn = () => {
    Animated.timing(likeScale, {
      toValue: 2.5,
      duration: 2000,
      useNativeDriver: true,
    }).start();
  };

  const handleLikePressOut = () => {
    // Get current scale value
    const currentScale = (likeScale as any)._value;
    Animated.spring(likeScale, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();

    handleSend('', 'like', { size: currentScale });
  };

  const getStatusText = () => {
    if (!otherMember?.show_online_status) return 'Ngoại tuyến';
    if (isOnline) return 'Đang hoạt động';
    if (otherMember?.last_seen) {
      return `Hoạt động ${moment(otherMember.last_seen).fromNow()}`;
    }
    return 'Ngoại tuyến';
  };

  const selectedEmojiCategoryData =
    emojiCategories.find(category => category.key === selectedEmojiCategory) ||
    emojiCategories[0] ||
    null;

  const renderMessage = ({ item }: any) => {
    const isSelf = item.sender._id === profile?.id;
    const isCode = item.type === 'code';
    const isMarkdown = item.type === 'markdown';
    const isSticker = item.type === 'sticker';
    const isGif = item.type === 'gif';
    const isLike = item.type === 'like';

    return (
      <View
        style={[
          styles.messageWrapper,
          isSelf ? styles.selfWrapper : styles.otherWrapper,
        ]}
      >
        {!isSelf && (
          <Image
            source={{
              uri: getAvatarUrl(
                item.sender.avatar,
                item.sender.name || item.sender.username,
              ),
            }}
            style={styles.miniAvatar}
          />
        )}
        <View
          style={[
            styles.bubble,
            {
              backgroundColor:
                isSticker || isGif || isLike
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
          ) : isLike ? (
            <View
              style={{
                transform: [{ scale: item.meta?.size || 1 }],
                padding: 10,
              }}
            >
              <FontAwesome5
                name="thumbs-up"
                size={30}
                color={theme.primary}
                {...({ solid: true } as any)}
              />
            </View>
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
        <TouchableOpacity
          style={styles.headerAvatarContainer}
          onPress={() =>
            navigation.navigate('ConversationInfo', {
              otherMember,
              conversation,
            })
          }
        >
          <Image
            source={{
              uri: getAvatarUrl(otherMember?.avatar, otherMember?.name),
            }}
            style={styles.headerAvatar}
          />
          {isOnline && (
            <View
              style={[
                styles.headerOnlineIndicator,
                {
                  backgroundColor: theme.active,
                  borderColor: theme.background,
                },
              ]}
            />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerInfo}
          onPress={() =>
            navigation.navigate('ConversationInfo', {
              otherMember,
              conversation,
            })
          }
        >
          <Text style={[styles.headerName, { color: theme.text }]}>
            {otherMember?.name || conversation.name || 'Chat'}
          </Text>
          <Text
            style={[
              styles.headerStatus,
              { color: isOnline ? theme.active : theme.textSecondary },
            ]}
          >
            {getStatusText()}
          </Text>
        </TouchableOpacity>
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
        onScrollBeginDrag={() => {
          setShowEmojiPicker(false);
          setShowStickerPicker(false);
          setShowGifPicker(false);
        }}
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

      {showEmojiPicker && (
        <View
          style={[styles.pickerContainer, { backgroundColor: theme.surface }]}
        >
          <View style={styles.categoryTabRow}>
            {emojiCategories.map(category => {
              const active = category.key === selectedEmojiCategory;
              return (
                <TouchableOpacity
                  key={category.key}
                  style={[
                    styles.categoryTab,
                    active
                      ? { backgroundColor: theme.primary }
                      : {
                          backgroundColor: theme.surface,
                          borderColor: theme.border,
                          borderWidth: 1,
                        },
                  ]}
                  onPress={() => setSelectedEmojiCategory(category.key)}
                >
                  <Text
                    style={[
                      styles.categoryTabText,
                      active ? { color: '#fff' } : { color: theme.text },
                    ]}
                  >
                    {category.icon}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <FlatList
            data={selectedEmojiCategoryData?.emojis ?? []}
            keyExtractor={item => item}
            numColumns={8}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.emojiBtn}
                onPress={() => handleEmojiSelect(item)}
              >
                <Text style={styles.emojiText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {showStickerPicker && (
        <View
          style={[styles.pickerContainer, { backgroundColor: theme.surface }]}
        >
          <FlatList
            data={stickers}
            keyExtractor={item => item}
            numColumns={3}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.stickerBtn}
                onPress={() => handleSend(item, 'sticker')}
              >
                <Image source={{ uri: item }} style={styles.pickerSticker} />
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {showGifPicker && (
        <View
          style={[styles.pickerContainer, { backgroundColor: theme.surface }]}
        >
          <FlatList
            data={gifList}
            keyExtractor={item => item.id}
            numColumns={2}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.gifBtn}
                onPress={() => handleSend(item.url, 'gif')}
              >
                <Image
                  source={{ uri: item.preview || item.url }}
                  style={styles.pickerGif}
                />
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      <View style={[styles.inputContainer, { borderTopColor: theme.border }]}>
        <TouchableOpacity
          style={styles.inputIcon}
          onPress={() => {
            setShowStickerPicker(!showStickerPicker);
            setShowEmojiPicker(false);
            setShowGifPicker(false);
          }}
        >
          <FontAwesome5
            name={'th' as any}
            size={20}
            color={showStickerPicker ? theme.primary : theme.textSecondary}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.inputIcon}
          onPress={() => {
            setShowGifPicker(!showGifPicker);
            setShowEmojiPicker(false);
            setShowStickerPicker(false);
          }}
        >
          <FontAwesome5
            name={'camera' as any}
            size={20}
            color={showGifPicker ? theme.primary : theme.textSecondary}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.inputIcon}>
          <FontAwesome5
            name={'image' as any}
            size={20}
            color={theme.textSecondary}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.inputIcon}>
          <FontAwesome5
            name={'microphone' as any}
            size={20}
            color={theme.textSecondary}
          />
        </TouchableOpacity>
        <View style={[styles.inputWrapper, { backgroundColor: theme.surface }]}>
          <TextInput
            style={[styles.textInput, { color: theme.text }]}
            placeholder="Aa"
            placeholderTextColor={theme.textSecondary}
            value={input}
            onChangeText={handleTyping}
            onFocus={() => {
              setShowEmojiPicker(false);
              setShowStickerPicker(false);
              setShowGifPicker(false);
            }}
            onKeyPress={({ nativeEvent }) => {
              if (nativeEvent.key === 'Enter') {
                handleSend();
              }
            }}
            multiline
            blurOnSubmit={false}
          />
          <TouchableOpacity
            onPress={() => {
              setShowEmojiPicker(!showEmojiPicker);
              setShowStickerPicker(false);
              setShowGifPicker(false);
            }}
          >
            <FontAwesome5
              name={'smile' as any}
              size={20}
              color={showEmojiPicker ? theme.primary : theme.textSecondary}
            />
          </TouchableOpacity>
        </View>
        {input ? (
          <TouchableOpacity
            onPress={() => handleSend()}
            style={styles.inputIcon}
          >
            <FontAwesome5
              name={'paper-plane' as any}
              size={22}
              color={theme.primary}
              {...({ solid: true } as any)}
            />
          </TouchableOpacity>
        ) : (
          <Pressable
            onPressIn={handleLikePressIn}
            onPressOut={handleLikePressOut}
            style={styles.inputIcon}
          >
            <Animated.View style={{ transform: [{ scale: likeScale }] }}>
              <FontAwesome5
                name={'thumbs-up' as any}
                size={22}
                color={theme.primary}
                {...({ solid: true } as any)}
              />
            </Animated.View>
          </Pressable>
        )}
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
  headerAvatarContainer: {
    position: 'relative',
    marginLeft: 15,
    marginRight: 10,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  headerOnlineIndicator: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
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
    minHeight: 36,
    maxHeight: 100,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    padding: 5,
    paddingTop: 5,
  },
  typingContainer: { paddingVertical: 5, paddingLeft: 40 },
  typingText: { fontSize: 12, fontStyle: 'italic' },
  stickerImage: { width: 120, height: 120, borderRadius: 10 },
  gifImage: { width: 180, height: 120, borderRadius: 10 },
  pickerContainer: {
    height: 250,
    borderTopWidth: 0.5,
    borderTopColor: '#ccc',
    padding: 10,
  },
  categoryTabRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryTab: {
    width: 34,
    height: 34,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTabText: {
    fontSize: 18,
    lineHeight: 22,
  },
  emojiBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  emojiText: { fontSize: 24 },
  stickerBtn: {
    flex: 1,
    padding: 5,
    alignItems: 'center',
  },
  pickerSticker: { width: 100, height: 100, borderRadius: 10 },
  gifBtn: {
    flex: 1,
    padding: 5,
    alignItems: 'center',
  },
  pickerGif: { width: '100%', height: 120, borderRadius: 10 },
});

export default ChatWindow;
