import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  Modal,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Markdown from 'react-native-markdown-display';
import SyntaxHighlighter from 'react-native-syntax-highlighter';
import { tomorrowNight } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getAvatarUrl } from '../utils/helper';
import moment from 'moment';
import 'moment/locale/vi';

moment.locale('vi');

const REACTION_LIST = ['❤️', '😆', '😮', '😢', '😡', '👍'];

interface Props {
  item: any;
  prevItem?: any;
  nextItem?: any;
  isGroupConversation: boolean;
  isPlaying: string | null;
  playBackState: { currentPosition: number; duration: number };
  onStartPlay: (url: string) => void;
  onStopPlay: () => void;
  onReact: (messageId: string, emoji: string) => void;
  onReply: (item: any) => void;
  onEdit: (item: any) => void;
  onDelete: (messageId: string) => void;
  onPress?: (item: any) => void;
  navigation: any;
  conversation: any;
}

const MessageBubble: React.FC<Props> = ({
  item,
  prevItem,
  nextItem,
  isGroupConversation,
  isPlaying,
  playBackState,
  onStartPlay,
  onStopPlay,
  onReact,
  onReply,
  onEdit,
  onDelete,
  navigation,
  conversation,
}) => {
  const { theme } = useTheme();
  const { profile } = useAuth();
  const isSelf = item.sender?._id === profile?.id || item.sender?.id === profile?.id;

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [showActions, setShowActions] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [localEditText, setLocalEditText] = useState(item.message || '');

  const prevSameUser = prevItem && prevItem.sender?._id === item.sender?._id;
  const nextSameUser = nextItem && nextItem.sender?._id === item.sender?._id;

  const showAvatar = !isSelf && !nextSameUser;
  const showName = !isSelf && isGroupConversation && !prevSameUser;

  const isDeleted = item.isDeleted;
  const isEdited = item.isEdited;
  const isCode = item.type === 'code';
  const isMarkdown = item.type === 'markdown';
  const isSticker = item.type === 'sticker';
  const isGif = item.type === 'gif';
  const isLike = item.type === 'like';
  const isAudio = item.type === 'audio';
  const isMissedCall = item.meta?.missed;
  const hasReactions = item.reactions && item.reactions.length > 0;
  const hasReplyTo = item.replyTo && typeof item.replyTo === 'object';

  const reactionSummary = () => {
    if (!hasReactions) return null;
    const counts: Record<string, number> = {};
    for (const r of item.reactions) {
      counts[r.emoji] = (counts[r.emoji] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  };

  const myReaction = item.reactions?.find((r: any) => r.user === profile?.id || r.user?._id === profile?.id)?.emoji;

  const handleLongPress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    setShowActions(true);
  };

  const isTransparentBubble = isSticker || isGif || isLike || isAudio || isMissedCall;

  const bubbleBg = isTransparentBubble
    ? 'transparent'
    : isDeleted
    ? theme.border
    : isSelf
    ? theme.bubbleSelf
    : theme.bubbleOther;

  const borderRadiusStyle = {
    borderTopLeftRadius: !isSelf && prevSameUser ? 4 : 18,
    borderTopRightRadius: isSelf && prevSameUser ? 4 : 18,
    borderBottomRightRadius: isSelf && !nextSameUser ? 4 : 18,
    borderBottomLeftRadius: !isSelf && !nextSameUser ? 4 : 18,
  };

  const renderBubbleContent = () => {
    if (isDeleted) {
      return (
        <View style={styles.deletedWrap}>
          <MaterialIcons name="block" size={13} color={theme.textSecondary} />
          <Text style={[styles.deletedText, { color: theme.textSecondary }]}>
            {isSelf ? 'Bạn đã thu hồi tin nhắn' : 'Tin nhắn đã bị thu hồi'}
          </Text>
        </View>
      );
    }

    if (isCode) {
      return (
        <SyntaxHighlighter
          language="javascript"
          style={tomorrowNight}
          customStyle={{ borderRadius: 8, padding: 10 }}
        >
          {item.message.replace(/```/g, '')}
        </SyntaxHighlighter>
      );
    }

    if (isMarkdown) {
      return (
        <Markdown
          style={{
            body: { color: isSelf ? theme.textSelf : theme.textOther },
            link: { color: theme.primary },
          }}
        >
          {item.message}
        </Markdown>
      );
    }

    if (isSticker || isGif) {
      return (
        <Image
          source={{ uri: item.message }}
          style={isSticker ? styles.stickerImg : styles.gifImg}
        />
      );
    }

    if (isLike) {
      return (
        <View style={{ transform: [{ scale: item.meta?.size || 1 }], padding: 6 }}>
          <Text style={{ fontSize: 32 }}>👍</Text>
        </View>
      );
    }

    if (isAudio) {
      const audioUrl = item.media?.[0]?.url;
      const playing = isPlaying === audioUrl;
      const progress = playing && playBackState.duration > 0
        ? playBackState.currentPosition / playBackState.duration
        : 0;

      return (
        <TouchableOpacity
          onPress={() => audioUrl && (playing ? onStopPlay() : onStartPlay(audioUrl))}
          style={[styles.audioBubble, { backgroundColor: isSelf ? theme.bubbleSelf : theme.bubbleOther }]}
          activeOpacity={0.8}
        >
          <View style={[styles.audioPlayBtn, { backgroundColor: isSelf ? 'rgba(255,255,255,0.25)' : theme.primary }]}>
            <FontAwesome5
              name={playing ? 'pause' : 'play'}
              size={12}
              color="#fff"
              {...({ solid: true } as any)}
            />
          </View>
          <View style={styles.audioRight}>
            <View style={[styles.audioBar, { backgroundColor: isSelf ? 'rgba(255,255,255,0.3)' : theme.border }]}>
              <View style={[styles.audioProgress, {
                width: `${Math.round(progress * 100)}%`,
                backgroundColor: isSelf ? '#fff' : theme.primary,
              }]} />
            </View>
            <Text style={[styles.audioDuration, { color: isSelf ? 'rgba(255,255,255,0.8)' : theme.textSecondary }]}>
              {item.meta?.duration || '0:00'}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }

    if (isMissedCall) {
      return (
        <View style={[styles.missedCallBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.missedCallLeft}>
            <View style={[styles.missedCallIcon, { backgroundColor: '#FF3B3020' }]}>
              <FontAwesome5
                name={item.meta?.callType === 'video' ? 'video' : 'phone-alt'}
                size={14}
                color="#FF3B30"
                {...({ solid: true } as any)}
              />
            </View>
            <View>
              <Text style={[styles.missedCallTitle, { color: theme.text }]}>
                {isSelf ? 'Bạn đã hủy' : 'Cuộc gọi nhỡ'}
              </Text>
              <Text style={[styles.missedCallSub, { color: theme.textSecondary }]}>
                {item.meta?.callType === 'video' ? 'Video' : 'Thoại'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.callAgainBtn, { backgroundColor: theme.primary }]}
            onPress={() =>
              navigation.navigate(
                item.meta?.callType === 'video' ? 'VideoCall' : 'VoiceCall',
                {
                  otherMember: isSelf
                    ? conversation.members.find((m: any) => m.user._id !== profile?.id)?.user
                    : item.sender,
                  conversation,
                },
              )
            }
          >
            <Text style={styles.callAgainText}>Gọi lại</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <Text style={[styles.messageText, { color: isSelf ? theme.textSelf : theme.textOther }]}>
        {item.message}
      </Text>
    );
  };

  const reactions = reactionSummary();

  return (
    <View style={[styles.wrapper, isSelf ? styles.wrapperSelf : styles.wrapperOther]}>
      {!isSelf && (
        <View style={styles.avatarCol}>
          {showAvatar ? (
            <Image
              source={{ uri: getAvatarUrl(item.sender?.avatar, item.sender?.name || item.sender?.username) }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarSpacer} />
          )}
        </View>
      )}

      <View style={[styles.col, isSelf ? styles.colSelf : styles.colOther]}>
        {showName && (
          <Text style={[styles.senderName, { color: theme.primary }]}>
            {item.sender?.name || item.sender?.username}
          </Text>
        )}

        {hasReplyTo && (
          <View style={[
            styles.replyPreview,
            {
              backgroundColor: isSelf ? 'rgba(0,0,0,0.15)' : theme.background,
              borderLeftColor: isSelf ? 'rgba(255,255,255,0.5)' : theme.primary,
            },
          ]}>
            <Text style={[styles.replyName, { color: isSelf ? 'rgba(255,255,255,0.75)' : theme.primary }]}>
              {item.replyTo?.sender?.name || item.replyTo?.sender?.username || 'Tin nhắn'}
            </Text>
            <Text
              style={[styles.replyText, { color: isSelf ? 'rgba(255,255,255,0.65)' : theme.textSecondary }]}
              numberOfLines={1}
            >
              {item.replyTo?.isDeleted ? 'Tin nhắn đã bị thu hồi' : item.replyTo?.message || ''}
            </Text>
          </View>
        )}

        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            onLongPress={handleLongPress}
            activeOpacity={0.85}
            delayLongPress={350}
          >
            <View style={[
              styles.bubble,
              { backgroundColor: bubbleBg },
              borderRadiusStyle,
              (isCode || isMarkdown) && { maxWidth: '100%', padding: 10 },
            ]}>
              {renderBubbleContent()}
            </View>
          </TouchableOpacity>
        </Animated.View>

        {hasReactions && reactions && (
          <View style={[
            styles.reactionsRow,
            isSelf ? styles.reactionsRowSelf : styles.reactionsRowOther,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}>
            {reactions.map(([emoji, count]) => (
              <TouchableOpacity
                key={emoji}
                onPress={() => !isDeleted && onReact(item._id, emoji)}
                style={styles.reactionItem}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
                {count > 1 && (
                  <Text style={[styles.reactionCount, { color: theme.textSecondary }]}>{count}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={[styles.meta, isSelf ? styles.metaSelf : styles.metaOther]}>
          {isEdited && !isDeleted && (
            <Text style={[styles.editedTag, { color: isSelf ? 'rgba(255,255,255,0.6)' : theme.textSecondary }]}>
              đã sửa ·{' '}
            </Text>
          )}
          <Text style={[styles.timestamp, { color: isSelf ? 'rgba(255,255,255,0.55)' : theme.textSecondary }]}>
            {moment(item.createdAt).format('HH:mm')}
          </Text>
          {isSelf && !isDeleted && (
            <MaterialIcons
              name={
                item.seenBy && item.seenBy.length > 0 ? 'done-all' : 'done'
              }
              size={13}
              color={item.seenBy && item.seenBy.length > 0 ? '#4FC3F7' : 'rgba(255,255,255,0.5)'}
              style={{ marginLeft: 3 }}
            />
          )}
        </View>
      </View>

      <Modal
        visible={showActions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActions(false)}
      >
        <TouchableOpacity
          style={styles.actionsOverlay}
          activeOpacity={1}
          onPress={() => { setShowActions(false); }}
        >
          <View style={[styles.actionsCard, { backgroundColor: theme.surface }]}>
            {!isDeleted && (
              <View style={[styles.reactionsPickerRow, { borderBottomColor: theme.border }]}>
                {REACTION_LIST.map(emoji => (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.reactionPickerItem,
                      myReaction === emoji && { backgroundColor: theme.primary + '30' },
                    ]}
                    onPress={() => {
                      onReact(item._id, emoji);
                      setShowActions(false);
                    }}
                  >
                    <Text style={styles.reactionPickerEmoji}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={[styles.actionRow, { borderBottomColor: theme.border }]}
              onPress={() => { setShowActions(false); onReply(item); }}
            >
              <FontAwesome5 name="reply" size={16} color={theme.primary} />
              <Text style={[styles.actionLabel, { color: theme.text }]}>Trả lời</Text>
            </TouchableOpacity>

            {isSelf && !isDeleted && item.type === 'text' && (
              <TouchableOpacity
                style={[styles.actionRow, { borderBottomColor: theme.border }]}
                onPress={() => {
                  setLocalEditText(item.message || '');
                  setShowActions(false);
                  setEditMode(true);
                }}
              >
                <FontAwesome5 name="pen" size={16} color={theme.primary} />
                <Text style={[styles.actionLabel, { color: theme.text }]}>Chỉnh sửa</Text>
              </TouchableOpacity>
            )}

            {isSelf && !isDeleted && (
              <TouchableOpacity
                style={[styles.actionRow, { borderBottomColor: theme.border }]}
                onPress={() => {
                  setShowActions(false);
                  Alert.alert(
                    'Thu hồi tin nhắn',
                    'Tin nhắn sẽ bị thu hồi với tất cả mọi người.',
                    [
                      { text: 'Hủy', style: 'cancel' },
                      { text: 'Thu hồi', style: 'destructive', onPress: () => onDelete(item._id) },
                    ],
                  );
                }}
              >
                <FontAwesome5 name="trash-alt" size={16} color="#FF4D4F" />
                <Text style={[styles.actionLabel, { color: '#FF4D4F' }]}>Thu hồi</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={editMode}
        transparent
        animationType="slide"
        onRequestClose={() => setEditMode(false)}
      >
        <View style={styles.editOverlay}>
          <View style={[styles.editCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.editTitle, { color: theme.text }]}>Chỉnh sửa tin nhắn</Text>
            <TextInput
              style={[styles.editInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              value={localEditText}
              onChangeText={setLocalEditText}
              multiline
              autoFocus
            />
            <View style={styles.editBtns}>
              <TouchableOpacity
                style={[styles.editBtn, { backgroundColor: theme.background, borderColor: theme.border }]}
                onPress={() => setEditMode(false)}
              >
                <Text style={[styles.editBtnText, { color: theme.text }]}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editBtn, { backgroundColor: theme.primary }]}
                onPress={() => {
                  onEdit({ ...item, message: localEditText });
                  setEditMode(false);
                }}
              >
                <Text style={[styles.editBtnText, { color: '#fff' }]}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    marginBottom: 2,
    marginHorizontal: 10,
    maxWidth: '82%',
  },
  wrapperSelf: { alignSelf: 'flex-end' },
  wrapperOther: { alignSelf: 'flex-start' },
  avatarCol: { width: 34, marginRight: 6, justifyContent: 'flex-end' },
  avatar: { width: 28, height: 28, borderRadius: 14 },
  avatarSpacer: { width: 28 },
  col: { flex: 1 },
  colSelf: { alignItems: 'flex-end' },
  colOther: { alignItems: 'flex-start' },
  senderName: { fontSize: 12, fontWeight: '600', marginBottom: 3, marginLeft: 4 },
  replyPreview: {
    borderLeftWidth: 3,
    paddingLeft: 8,
    paddingVertical: 4,
    paddingRight: 8,
    borderRadius: 6,
    marginBottom: 4,
    maxWidth: '100%',
  },
  replyName: { fontSize: 12, fontWeight: '700', marginBottom: 1 },
  replyText: { fontSize: 12 },
  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: '100%',
  },
  deletedWrap: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  deletedText: { fontSize: 14, fontStyle: 'italic' },
  messageText: { fontSize: 16, lineHeight: 22 },
  stickerImg: { width: 120, height: 120 },
  gifImg: { width: 180, height: 120, borderRadius: 8 },
  audioBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 180,
    gap: 10,
  },
  audioPlayBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioRight: { flex: 1, gap: 4 },
  audioBar: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  audioProgress: { height: '100%', borderRadius: 2 },
  audioDuration: { fontSize: 11 },
  missedCallBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 0.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minWidth: 220,
    gap: 12,
  },
  missedCallLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  missedCallIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missedCallTitle: { fontSize: 14, fontWeight: '700' },
  missedCallSub: { fontSize: 12, marginTop: 1 },
  callAgainBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  callAgainText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  reactionsRow: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 0.5,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginTop: 4,
    gap: 2,
  },
  reactionsRowSelf: { alignSelf: 'flex-end', marginRight: 4 },
  reactionsRowOther: { alignSelf: 'flex-start', marginLeft: 4 },
  reactionItem: { flexDirection: 'row', alignItems: 'center', gap: 1 },
  reactionEmoji: { fontSize: 14 },
  reactionCount: { fontSize: 11, fontWeight: '600' },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 3, marginHorizontal: 4 },
  metaSelf: { alignSelf: 'flex-end' },
  metaOther: { alignSelf: 'flex-start' },
  editedTag: { fontSize: 11 },
  timestamp: { fontSize: 11 },
  actionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  actionsCard: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  reactionsPickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
  },
  reactionPickerItem: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactionPickerEmoji: { fontSize: 26 },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
  },
  actionLabel: { fontSize: 16, fontWeight: '500' },
  editOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  editCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  editTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  editInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 80,
    maxHeight: 160,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  editBtns: { flexDirection: 'row', gap: 12 },
  editBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  editBtnText: { fontSize: 16, fontWeight: '700' },
});

export default MessageBubble;
