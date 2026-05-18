import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { FontAwesome5 } from '@react-native-vector-icons/fontawesome5';
import { getLyrics, LyricLine, Audio } from '@api/music';
import { usePlayer } from '../context/PlayerContext';

const C = {
  bg: '#0C0C0C',
  surface: '#1A1A1A',
  text: '#FFFFFF',
  sub: '#555555',
  accent: '#6C63FF',
  active: '#FFFFFF',
  dim: '#333333',
};

const parseLrc = (raw: string): LyricLine[] => {
  const lines: LyricLine[] = [];
  const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/g;
  let match;
  while ((match = regex.exec(raw)) !== null) {
    const min = parseInt(match[1], 10);
    const sec = parseInt(match[2], 10);
    const ms = parseInt(match[3].padEnd(3, '0'), 10);
    const time = min * 60 + sec + ms / 1000;
    const text = match[4].trim();
    if (text) lines.push({ time, text });
  }
  return lines.sort((a, b) => a.time - b.time);
};

interface Props {
  audio: Audio;
  onSeek?: (time: number) => void;
}

const LyricsView: React.FC<Props> = ({ audio, onSeek }) => {
  const player = usePlayer();
  const [lines, setLines] = useState<LyricLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const listRef = useRef<FlatList>(null);
  const prevIdx = useRef(-1);
  const autoScroll = useRef(true);

  useEffect(() => {
    setLoading(true);
    setError(false);
    setLines([]);
    setActiveIdx(-1);
    prevIdx.current = -1;

    getLyrics(audio._id)
      .then(res => {
        const raw = res.data.lyrics;
        if (!raw) {
          setLines([]);
          return;
        }
        if (typeof raw === 'string') {
          setLines(parseLrc(raw));
        } else {
          setLines(raw.sort((a, b) => a.time - b.time));
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [audio._id]);

  useEffect(() => {
    if (lines.length === 0) return;
    const pos = player.position;
    let idx = -1;
    for (let i = lines.length - 1; i >= 0; i--) {
      if (pos >= lines[i].time) {
        idx = i;
        break;
      }
    }
    if (idx !== prevIdx.current) {
      prevIdx.current = idx;
      setActiveIdx(idx);
      if (idx >= 0 && autoScroll.current) {
        listRef.current?.scrollToIndex({
          index: Math.max(0, idx),
          animated: true,
          viewPosition: 0.4,
        });
      }
    }
  }, [player.position, lines]);

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={C.accent} size="large" />
        <Text style={s.hint}>Đang tải lời bài hát...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={s.center}>
        <FontAwesome5
          name="exclamation-circle"
          iconStyle="solid"
          size={36}
          color={C.dim}
        />
        <Text style={s.hint}>Không thể tải lời bài hát</Text>
      </View>
    );
  }

  if (lines.length === 0) {
    return (
      <View style={s.center}>
        <FontAwesome5 name="music" iconStyle="solid" size={40} color={C.dim} />
        <Text style={s.emptyTitle}>Chưa có lời bài hát</Text>
        <Text style={s.hint}>Bài hát này chưa được cập nhật lời</Text>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <FlatList
        ref={listRef}
        data={lines}
        keyExtractor={(_, i) => String(i)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.list}
        onScrollBeginDrag={() => {
          autoScroll.current = false;
        }}
        onMomentumScrollEnd={() => {
          setTimeout(() => {
            autoScroll.current = true;
          }, 3000);
        }}
        onScrollToIndexFailed={info => {
          setTimeout(() => {
            listRef.current?.scrollToIndex({
              index: info.index,
              animated: true,
              viewPosition: 0.4,
            });
          }, 200);
        }}
        renderItem={({ item, index }) => {
          const isActive = index === activeIdx;
          const isPast = index < activeIdx;
          return (
            <Pressable
              onPress={() => {
                autoScroll.current = true;
                onSeek?.(item.time);
              }}
              style={s.lineWrap}
            >
              <Text
                style={[s.line, isPast && s.linePast, isActive && s.lineActive]}
              >
                {item.text}
              </Text>
              {isActive && <View style={s.activeDot} />}
            </Pressable>
          );
        }}
      />
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 40,
  },
  list: { paddingHorizontal: 28, paddingTop: 60, paddingBottom: 120 },
  lineWrap: { marginBottom: 28, alignItems: 'center' },
  line: {
    fontFamily: 'Inter',
    fontSize: 20,
    fontWeight: '600',
    color: C.dim,
    textAlign: 'center',
    lineHeight: 30,
    letterSpacing: 0.2,
  },
  linePast: { color: C.sub },
  lineActive: {
    color: C.active,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(108,99,255,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.accent,
    marginTop: 8,
  },
  emptyTitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: C.text,
    textAlign: 'center',
  },
  hint: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '400',
    color: C.sub,
    textAlign: 'center',
  },
});

export default LyricsView;
