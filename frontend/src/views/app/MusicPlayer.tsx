import React, { useRef, useState, useEffect, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Dimensions,
  PanResponder,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@react-native-vector-icons/fontawesome5';
import Video from 'react-native-video';
import { Audio } from '@api/music';
import { RouteProp } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const ARTWORK_SIZE = width - 48;

const C = {
  bg: '#0C0C0C',
  surface: '#1A1A1A',
  line: '#2A2A2A',
  text: '#FFFFFF',
  sub: '#777777',
  heart: '#FF4444',
};

type RootStackParamList = { MusicPlayer: { audio: Audio } };
interface Props {
  route: RouteProp<RootStackParamList, 'MusicPlayer'>;
  navigation: any;
}

const fmt = (s: number) => {
  if (!s || isNaN(s)) return '0:00';
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};

interface EngineProps {
  uri: string;
  paused: boolean;
  repeat: boolean;
  onLoad: (d: number) => void;
  onProgress: (t: number) => void;
  onEnd: () => void;
  videoRef: React.RefObject<any>;
}

const AudioEngine = memo(
  ({ uri, paused, repeat, onLoad, onProgress, onEnd, videoRef }: EngineProps) => (
    <Video
      ref={videoRef}
      source={{ uri }}
      playInBackground
      playWhenInactive
      ignoreSilentSwitch="ignore"
      paused={paused}
      repeat={repeat}
      onLoad={d => onLoad(d.duration)}
      onProgress={d => onProgress(d.currentTime)}
      onEnd={onEnd}
      onError={() => {}}
      progressUpdateInterval={1000}
      style={{ width: 0, height: 0 }}
    />
  ),
  (prev, next) =>
    prev.uri === next.uri &&
    prev.paused === next.paused &&
    prev.repeat === next.repeat,
);

const MusicPlayer: React.FC<Props> = ({ route, navigation }) => {
  const { audio } = route.params;
  const videoRef = useRef<any>(null);
  const durationRef = useRef(0);
  const barWidth = useRef(width - 48);
  const isSeeking = useRef(false);
  const seekPositionRef = useRef(0);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  const fadeArt = useRef(new Animated.Value(0)).current;
  const scaleArt = useRef(new Animated.Value(0.96)).current;
  const fadeBody = useRef(new Animated.Value(0)).current;
  const slideBody = useRef(new Animated.Value(16)).current;
  const scalePlay = useRef(new Animated.Value(1)).current;

  const fileUrl: string = typeof audio.file === 'string'
    ? audio.file : (audio.file as any)?.url ?? '';
  const posterUrl: string = typeof audio.poster === 'string'
    ? audio.poster : (audio.poster as any)?.url ?? audio.image ?? '';

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeArt, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(scaleArt, { toValue: 1, tension: 60, friction: 10, useNativeDriver: true }),
      Animated.timing(fadeBody, { toValue: 1, duration: 350, delay: 100, useNativeDriver: true }),
      Animated.timing(slideBody, { toValue: 0, duration: 300, delay: 100, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleLoad = useCallback((d: number) => {
    durationRef.current = d;
    setDuration(d);
    setIsLoading(false);
  }, []);

  const handleProgress = useCallback((t: number) => {
    if (!isSeeking.current) {
      setPosition(t);
    }
  }, []);

  const handleEnd = useCallback(() => {
    if (!isRepeat) { setIsPlaying(false); setPosition(0); }
  }, [isRepeat]);

  const commitSeek = useCallback((ratio: number) => {
    const t = Math.max(0, Math.min(ratio, 1)) * durationRef.current;
    seekPositionRef.current = t;
    videoRef.current?.seek(t);
    setPosition(t);
  }, []);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: e => {
        isSeeking.current = true;
        const ratio = e.nativeEvent.locationX / barWidth.current;
        const t = Math.max(0, Math.min(ratio, 1)) * durationRef.current;
        setPosition(t);
      },
      onPanResponderMove: e => {
        const ratio = e.nativeEvent.locationX / barWidth.current;
        const t = Math.max(0, Math.min(ratio, 1)) * durationRef.current;
        setPosition(t);
      },
      onPanResponderRelease: e => {
        const ratio = e.nativeEvent.locationX / barWidth.current;
        commitSeek(ratio);
        setTimeout(() => { isSeeking.current = false; }, 300);
      },
    }),
  ).current;

  const tapPlay = () => {
    setIsPlaying(p => !p);
    Animated.sequence([
      Animated.spring(scalePlay, { toValue: 0.88, useNativeDriver: true, speed: 60, bounciness: 2 }),
      Animated.spring(scalePlay, { toValue: 1, useNativeDriver: true, speed: 60, bounciness: 6 }),
    ]).start();
  };

  const pct = duration > 0 ? Math.min(position / duration, 1) : 0;

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <AudioEngine
        uri={fileUrl}
        paused={!isPlaying}
        repeat={isRepeat}
        onLoad={handleLoad}
        onProgress={handleProgress}
        onEnd={handleEnd}
        videoRef={videoRef}
      />

      <View style={s.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={s.headerBtn}>
          <FontAwesome5 name="chevron-down" iconStyle="solid" size={16} color={C.text} />
        </Pressable>
        <Text style={s.headerLabel}>ĐANG PHÁT</Text>
        <Pressable onPress={() => setIsFavorite(f => !f)} hitSlop={12} style={s.headerBtn}>
          <FontAwesome5
            name="heart"
            iconStyle={isFavorite ? 'solid' : 'regular'}
            size={16}
            color={isFavorite ? C.heart : C.sub}
          />
        </Pressable>
      </View>

      <Animated.View style={[s.artWrap, { opacity: fadeArt, transform: [{ scale: scaleArt }] }]}>
        {posterUrl
          ? <Image source={{ uri: posterUrl }} style={s.art} />
          : <View style={[s.art, s.artEmpty]}>
              <FontAwesome5 name="music" iconStyle="solid" size={64} color={C.line} />
            </View>
        }
      </Animated.View>

      <Animated.View style={[s.body, { opacity: fadeBody, transform: [{ translateY: slideBody }] }]}>
        <View style={s.infoRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.title} numberOfLines={1}>{audio.title}</Text>
            <Text style={s.artist} numberOfLines={1}>{audio.about || 'SonicX'}</Text>
          </View>
        </View>

        <View style={s.progressWrap}>
          <View
            style={s.trackHit}
            onLayout={e => { barWidth.current = e.nativeEvent.layout.width; }}
            {...pan.panHandlers}
          >
            <View style={s.track}>
              <View style={[s.fill, { width: `${pct * 100}%` }]} />
              <View style={[s.thumb, { left: `${Math.min(pct * 100, 97)}%` }]} />
            </View>
          </View>
          <View style={s.timeRow}>
            <Text style={s.time}>{fmt(position)}</Text>
            <Text style={s.time}>{fmt(duration)}</Text>
          </View>
        </View>

        <View style={s.controls}>
          <Pressable hitSlop={12} onPress={() => setIsShuffle(v => !v)} style={s.sideBtn}>
            <FontAwesome5 name="random" iconStyle="solid" size={15}
              color={isShuffle ? C.text : C.sub} />
          </Pressable>

          <Pressable hitSlop={12} style={s.skipBtn}
            onPress={() => { videoRef.current?.seek(0); setPosition(0); }}>
            <FontAwesome5 name="step-backward" iconStyle="solid" size={22} color={C.text} />
          </Pressable>

          <Animated.View style={{ transform: [{ scale: scalePlay }] }}>
            <Pressable style={s.playBtn} onPress={tapPlay}>
              {isLoading
                ? <ActivityIndicator color="#000" size="small" />
                : <FontAwesome5
                    name={isPlaying ? 'pause' : 'play'}
                    iconStyle="solid"
                    size={20}
                    color="#000"
                    style={!isPlaying ? { marginLeft: 3 } : undefined}
                  />
              }
            </Pressable>
          </Animated.View>

          <Pressable hitSlop={12} style={s.skipBtn}
            onPress={() => videoRef.current?.seek(durationRef.current)}>
            <FontAwesome5 name="step-forward" iconStyle="solid" size={22} color={C.text} />
          </Pressable>

          <Pressable hitSlop={12} onPress={() => setIsRepeat(v => !v)} style={s.sideBtn}>
            <FontAwesome5 name="redo" iconStyle="solid" size={15}
              color={isRepeat ? C.text : C.sub} />
          </Pressable>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  headerLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    color: C.sub,
    letterSpacing: 1.5,
  },
  artWrap: {
    alignSelf: 'center',
    marginBottom: 28,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  art: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    borderRadius: 12,
    backgroundColor: C.surface,
    overflow: 'hidden',
  },
  artEmpty: { justifyContent: 'center', alignItems: 'center' },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  infoRow: { marginBottom: 20 },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 22,
    color: C.text,
    marginBottom: 6,
  },
  artist: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: C.sub,
  },
  progressWrap: { marginBottom: 28 },
  trackHit: {
    paddingVertical: 12,
    marginVertical: -12,
    marginBottom: 0,
  },
  track: {
    height: 3,
    backgroundColor: C.line,
    borderRadius: 2,
    justifyContent: 'center',
  },
  fill: { height: 3, backgroundColor: C.text, borderRadius: 2 },
  thumb: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: C.text,
    marginLeft: -7,
    top: -5.5,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  time: { fontFamily: 'Inter-Regular', fontSize: 12, color: C.sub },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  sideBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  skipBtn: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MusicPlayer;
