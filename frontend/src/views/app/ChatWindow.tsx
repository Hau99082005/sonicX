import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  PermissionsAndroid,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { getMessages, sendMessage } from '../../api/chat';
import { getBlockStatus, unblockUser } from '../../api/friendship';
import client from '../../api/client';
import { fetchEmojiList } from '../../api/emoji';
import { fetchGifs } from '../../api/gif';
import moment from 'moment';
import Markdown from 'react-native-markdown-display';
import SyntaxHighlighter from 'react-native-syntax-highlighter';
import { tomorrowNight } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import Toast from 'react-native-toast-message';
import { getAvatarUrl } from '../../utils/helper';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';

const audioRecorderPlayer = new AudioRecorderPlayer();

const formatTime = (ms: number) => {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;
};

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

  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordingTime] = useState('00:00');
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [playBackState, setPlayBackState] = useState({
    currentPosition: 0,
    duration: 0,
  });

  useEffect(() => {
    audioRecorderPlayer.setSubscriptionDuration(0.1); // Cập nhật mỗi 100ms
    return () => {
      audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      audioRecorderPlayer.stopPlayer();
      audioRecorderPlayer.removePlayBackListener();
    };
  }, []);

  const onStartRecord = async () => {
    if (isRecording) return;

    if (Platform.OS === 'android') {
      try {
        const grants = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        ]);

        if (
          grants['android.permission.RECORD_AUDIO'] !==
          PermissionsAndroid.RESULTS.GRANTED
        ) {
          Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Cần quyền ghi âm' });
          return;
        }
      } catch (err) {
        console.warn(err);
        return;
      }
    }

    try {
      setIsRecording(true);
      setRecordingTime('00:00');
      
      const path = Platform.select({
        ios: `voice_${Date.now()}.m4a`,
        android: undefined, // Để mặc định cho Android
      });

      const result = await audioRecorderPlayer.startRecorder(path);
      console.log('Start recording at:', result);

      audioRecorderPlayer.addRecordBackListener((e: any) => {
        const time = formatTime(Math.floor(e.currentPosition));
        setRecordingTime(time);
      });
    } catch (error) {
      console.error('Start record error:', error);
      setIsRecording(false);
    }
  };

  const onStopRecord = async () => {
    if (!isRecording) return;

    // Đợi một chút để đảm bảo listener đã nhận được dữ liệu cuối cùng
    await new Promise<void>(resolve => setTimeout(() => resolve(), 200));

    try {
      const result = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      setIsRecording(false);
      
      const finalDuration = recordTime;
      setRecordingTime('00:00');

      if (result && finalDuration !== '00:00') {
        const formData = new FormData();
        formData.append('conversationId', currentConversationId);
        formData.append('message', '');
        formData.append('type', 'audio');
        formData.append('meta', JSON.stringify({ duration: finalDuration }));

        const cleanPath = result.replace('file:///', '').replace('file://', '');
        const fileUri = `file://${cleanPath}`;

        formData.append('media', {
          uri: fileUri,
          type: 'audio/mp4',
          name: 'voice_message.mp4',
        } as any);

        const { data } = await client.post('/message/send', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          transformRequest: (data) => data,
        });

        setMessages(prev => [...prev, data.message]);
        setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
      } else {
        console.log('Recording too short or no result');
      }
    } catch (error) {
      console.error('Stop record error:', error);
      setIsRecording(false);
    }
  };

  const onStartPlay = async (url: string) => {
    try {
      if (isPlaying) {
        await audioRecorderPlayer.stopPlayer();
      }

      setIsPlaying(url);
      await audioRecorderPlayer.startPlayer(url);
      
      audioRecorderPlayer.addPlayBackListener((e: any) => {
        setPlayBackState({
          currentPosition: e.currentPosition,
          duration: e.duration,
        });

        if (e.currentPosition >= e.duration && e.duration > 0) {
          onStopPlay();
        }
      });
    } catch (error) {
      console.error('Play error:', error);
      setIsPlaying(null);
    }
  };

  const onStopPlay = async () => {
    await audioRecorderPlayer.stopPlayer();
    audioRecorderPlayer.removePlayBackListener();
    setIsPlaying(null);
    setPlayBackState({ currentPosition: 0, duration: 0 });
  };

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
  const isGroupConversation = conversation?.type === 'group';
  const [otherNickname, setOtherNickname] = useState(
    isGroupConversation ? undefined : otherMember?.nickname,
  );
  const isOnline = otherMember ? onlineUsers.has(otherMember._id) : false;

  const [iBlockedThem, setIBlockedThem] = useState(false);
  const [theyBlockedMe, setTheyBlockedMe] = useState(false);
  const isBlocked = iBlockedThem || theyBlockedMe;

  const loadBlockStatus = useCallback(async () => {
    if (isGroupConversation || !otherMember?._id) return;
    try {
      const data = await getBlockStatus(otherMember._id);
      setIBlockedThem(data.iBlockedThem);
      setTheyBlockedMe(data.theyBlockedMe);
    } catch {}
  }, [isGroupConversation, otherMember?._id]);

  useEffect(() => {
    loadBlockStatus();
  }, [loadBlockStatus]);

  const groupTitle = conversation.members
    .filter((m: any) => m.user._id !== profile?.id)
    .map((m: any) => m.user.name || m.user.username)
    .slice(0, 2)
    .join(', ');

  const headerName = isGroupConversation
    ? conversation.name || groupTitle || 'Nhóm'
    : otherNickname || otherMember?.name || conversation.name || 'Chat';
  const headerAvatar = isGroupConversation
    ? conversation.avatar?.url || getAvatarUrl(undefined, headerName)
    : getAvatarUrl(
        otherMember?.avatar,
        otherNickname || otherMember?.name || conversation.name,
      );

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

      socket.on(
        'nickname-updated',
        (data: { userId: string; friendId: string; nickname: string }) => {
          const otherId = otherMember?._id;
          if (!otherId) return;
          if (data.userId === otherId || data.friendId === otherId)
            setOtherNickname(data.nickname);
        },
      );

      socket.on('user-blocked', ({ blockedBy }: any) => {
        if (blockedBy?.toString() === profile?.id?.toString()) {
          setIBlockedThem(true);
        } else {
          setTheyBlockedMe(true);
        }
      });

      socket.on('user-unblocked', ({ unblockedBy }: any) => {
        if (unblockedBy?.toString() === profile?.id?.toString()) {
          setIBlockedThem(false);
        } else {
          setTheyBlockedMe(false);
        }
      });

      return () => {
        socket.emit('leave-conversation', currentConversationId);
        socket.off('typing-status');
        socket.off('new-message');
        socket.off('nickname-updated');
        socket.off('user-blocked');
        socket.off('user-unblocked');
      };
    }
  }, [socket, currentConversationId, otherMember]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (currentConversationId !== 'new') {
        const data = await getMessages(currentConversationId);
        if (Array.isArray(data)) {
          setMessages(data.reverse());
        }
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
    if (isGroupConversation) {
      return `${conversation.members.length} thành viên`;
    }
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
    const isAudio = item.type === 'audio';
    const isMissedCall = item.meta?.missed;

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
                item.sender.nickname ||
                  item.sender.name ||
                  item.sender.username,
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
                isSticker || isGif || isLike || isAudio
                  ? 'transparent'
                  : isMissedCall
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
          ) : isAudio ? (
            <TouchableOpacity
              onPress={() => {
                if (isPlaying === item.media[0].url) {
                  onStopPlay();
                } else {
                  onStartPlay(item.media[0].url);
                }
              }}
              style={[
                styles.audioBubble,
                { backgroundColor: isSelf ? theme.primary : theme.surface },
              ]}
            >
              <FontAwesome5
                name={(isPlaying === item.media[0].url ? 'stop' : 'play') as any}
                size={16}
                color={isSelf ? '#fff' : theme.primary}
                {...({ solid: true } as any)}
              />
              <View style={styles.audioWaveform}>
                <View
                  style={[
                    styles.audioProgress,
                    {
                      width:
                        isPlaying === item.media[0].url &&
                        playBackState.duration > 0
                          ? `${
                              (playBackState.currentPosition /
                                playBackState.duration) *
                              100
                            }%`
                          : '0%',
                      backgroundColor: isSelf
                        ? 'rgba(255,255,255,0.5)'
                        : 'rgba(0,0,0,0.1)',
                    },
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.audioDuration,
                  { color: isSelf ? '#fff' : theme.textSecondary },
                ]}
              >
                {item.meta?.duration || '0:00'}
              </Text>
            </TouchableOpacity>
          ) : isMissedCall ? (
            <View
              style={[
                styles.zaloMissedCallContainer,
                { backgroundColor: theme.surface },
              ]}
            >
              <Text style={[styles.zaloMissedCallTitle, { color: theme.text }]}>
                {isSelf ? 'Bạn đã hủy' : 'Cuộc gọi nhỡ'}
              </Text>
              <View style={styles.zaloMissedCallRow}>
                <View style={styles.zaloIconWrapper}>
                  <FontAwesome5
                    name={
                      item.meta?.callType === 'video' ? 'video' : 'phone-alt'
                    }
                    size={16}
                    color={theme.textSecondary}
                  />
                  <View style={styles.zaloArrowWrapper}>
                    <FontAwesome5
                      name="arrow-up"
                      size={8}
                      color="#FF3B30"
                      style={{ transform: [{ rotate: '45deg' }] }}
                    />
                  </View>
                </View>
                <Text
                  style={[styles.zaloMissedCallType, { color: theme.textSecondary }]}
                >
                  {item.meta?.callType === 'video' ? 'Cuộc gọi video' : 'Cuộc gọi thoại'}
                </Text>
              </View>
              <View
                style={[styles.zaloDivider, { backgroundColor: theme.border }]}
              />
              <TouchableOpacity
                style={styles.zaloCallAgainBtn}
                onPress={() =>
                  navigation.navigate(
                    item.meta?.callType === 'video' ? 'VideoCall' : 'VoiceCall',
                    {
                      otherMember: isSelf
                        ? conversation.members.find(
                            (m: any) => m.user._id !== profile?.id,
                          )?.user
                        : item.sender,
                      conversation,
                    },
                  )
                }
              >
                <Text style={[styles.zaloCallAgainText, { color: theme.primary }]}>
                  Gọi lại
                </Text>
              </TouchableOpacity>
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
              otherMember: isGroupConversation ? undefined : otherMember,
              conversation,
            })
          }
        >
          <Image source={{ uri: headerAvatar }} style={styles.headerAvatar} />
          {!isGroupConversation && isOnline && (
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
              otherMember: isGroupConversation ? undefined : otherMember,
              conversation,
            })
          }
        >
          <Text style={[styles.headerName, { color: theme.text }]}>
            {headerName}
          </Text>
          <Text
            style={[
              styles.headerStatus,
              {
                color: isGroupConversation
                  ? theme.textSecondary
                  : isOnline
                  ? theme.active
                  : theme.textSecondary,
              },
            ]}
          >
            {getStatusText()}
          </Text>
        </TouchableOpacity>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={[styles.iconBtn, isBlocked && styles.disabledIcon]}
            onPress={() => {
              if (!isBlocked)
                navigation.navigate('VoiceCall', { otherMember, conversation });
            }}
          >
            <FontAwesome5
              name={'phone-alt' as any}
              size={18}
              color={isBlocked ? theme.textSecondary : theme.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, isBlocked && styles.disabledIcon]}
            onPress={() => {
              if (!isBlocked)
                navigation.navigate('VideoCall', { otherMember, conversation });
            }}
          >
            <FontAwesome5
              name={'video' as any}
              size={18}
              color={isBlocked ? theme.textSecondary : theme.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() =>
              navigation.navigate('ConversationInfo', {
                otherMember: isGroupConversation ? undefined : otherMember,
                conversation,
              })
            }
          >
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
                {(otherNickname || otherMember?.name || 'Ai đó') +
                  ' đang soạn tin nhắn...'}
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
        {isBlocked ? (
          <View style={[styles.blockedBanner, { backgroundColor: theme.surface }]}>
            <FontAwesome5 name={'ban' as any} size={16} color="#FF6B6B" style={{ marginRight: 8 }} />
            <Text style={[styles.blockedBannerText, { color: theme.textSecondary }]}>
              {iBlockedThem
                ? 'Bạn đã chặn người này. '
                : 'Bạn không thể trả lời tin nhắn này.'}
            </Text>
            {iBlockedThem && (
              <TouchableOpacity
                onPress={async () => {
                  try {
                    await unblockUser(otherMember._id);
                    setIBlockedThem(false);
                    Toast.show({ type: 'success', text1: 'Đã bỏ chặn' });
                  } catch {
                    Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Không thể bỏ chặn' });
                  }
                }}
              >
                <Text style={{ color: theme.primary, fontWeight: '600', fontSize: 14 }}>Bỏ chặn</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
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
            <TouchableOpacity
              style={styles.inputIcon}
              onLongPress={onStartRecord}
              onPressOut={onStopRecord}
            >
              <FontAwesome5
                name={'microphone' as any}
                size={20}
                color={isRecording ? theme.primary : theme.textSecondary}
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
          </>
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
  blockedBanner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    margin: 8,
    marginBottom: 30,
  },
  blockedBannerText: {
    fontSize: 14,
    flex: 1,
  },
  disabledIcon: {
    opacity: 0.35,
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
  audioBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 20,
    width: 200,
  },
  audioWaveform: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginHorizontal: 10,
    borderRadius: 2,
    overflow: 'hidden',
  },
  audioProgress: {
    height: '100%',
  },
  audioDuration: {
    fontSize: 12,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  zaloMissedCallContainer: {
    width: 220,
    padding: 12,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  zaloMissedCallTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  zaloMissedCallRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  zaloIconWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  zaloArrowWrapper: {
    position: 'absolute',
    top: -4,
    right: -6,
  },
  zaloMissedCallType: {
    fontSize: 15,
  },
  zaloDivider: {
    height: 0.5,
    width: '100%',
    marginBottom: 10,
  },
  zaloCallAgainBtn: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  zaloCallAgainText: {
    fontSize: 16,
    fontWeight: '700',
  },
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
