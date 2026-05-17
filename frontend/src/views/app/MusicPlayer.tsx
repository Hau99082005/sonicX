import React, { useRef, useState, useEffect } from 'react';
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
import Video, { OnLoadData, OnProgressData } from 'react-native-video';
import { Audio } from '@api/music';
import { RouteProp } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');
const ARTWORK_SIZE = width - 64;

const COLORS = {
  primary: '#5B5BD6',
  background: '#0D0F1A',
  surface: '#161829',
  border: '#1E2140',
  text: '#F1F5F9',
  textSecondary: '#6B7280',
  playBtn: '#5B5BD6',
  heart: '#EF4444',
  progressBg: '#1E2140',
  progressFill: '#5B5BD6',
};

type RootStackParamList = {
  MusicPlayer: { audio: Audio };
};

interface Props {
  route: RouteProp<RootStackParamList, 'MusicPlayer'>;
  navigation: any;
}

const formatTime = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const MusicPlayer: React.FC<Props> = ({ route, navigation }) => {
  const { audio } = route.params;
  const videoRef = useRef<any>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  const progressBarWidth = useRef(width - 64);
  const artworkScale = useRef(new Animated.Value(0.92)).current;
  const artworkOpacity = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(30)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const playBtnScale = useRef(new Animated.Value(1)).current;
  const heartScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(artworkScale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
      Animated.timing(artworkOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(contentOpacity, { toValue: 1, duration: 500, delay: 150, useNativeDriver: true }),
      Animated.timing(contentSlide, { toValue: 0, duration: 400, delay: 150, useNativeDriver: true }),
    ]).start();
  }, []);

  const animatePlayBtn = () => {
    Animated.sequence([
      Animated.spring(playBtnScale, { toValue: 0.88, useNativeDriver: true, speed: 50, bounciness: 4 }),
      Animated.spring(playBtnScale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 8 }),
    ]).start();
  };

  const animateHeart = () => {
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.4, useNativeDriver: true, speed: 50, bounciness: 10 }),
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 6 }),
    ]).start();
  };

  const fileUrl: string = typeof audio.file === 'string'
    ? (audio.file as string)
    : (audio.file as any)?.url ?? '';

  const posterUrl: string = typeof audio.poster === 'string'
    ? (audio.poster as string)
    : (audio.poster as any)?.url ?? audio.image ?? '';

  const onLoad = (data: OnLoadData) => {
    setDuration(data.duration);
    setIsLoading(false);
  };

  const onProgress = (data: OnProgressData) => {
    setPosition(data.currentTime);
  };

  const onEnd = () => {
    if (isRepeat) {
      videoRef.current?.seek(0);
    } else {
      setIsPlaying(false);
      setPosition(0);
    }
  };

  const seekByRatio = (ratio: number) => {
    const seekTo = Math.max(0, Math.min(ratio, 1)) * duration;
    videoRef.current?.seek(seekTo);
    setPosition(seekTo);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: e => seekByRatio(e.nativeEvent.locationX / progressBarWidth.current),
      onPanResponderMove: e => seekByRatio(e.nativeEvent.locationX / progressBarWidth.current),
    }),
  ).current;

  const progress = duration > 0 ? position / duration : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Video
        ref={videoRef}
        source={{ uri: fileUrl }}
        playInBackground
        playWhenInactive
        paused={!isPlaying}
        repeat={isRepeat}
        onLoad={onLoad}
        onProgress={onProgress}
        onEnd={onEnd}
        onError={() => setIsLoading(false)}
        style={styles.hiddenVideo}
      />

      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn} hitSlop={8}>
          <FontAwesome5 name="chevron-left" iconStyle="solid" size={18} color={COLORS.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerSub}>ĐANG PHÁT</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {audio.title}
          </Text>
        </View>
        <Animated.View style={{ transform: [{ scale: heartScale }] }}>
          <Pressable
            onPress={() => { setIsFavorite(f => !f); animateHeart(); }}
            style={styles.iconBtn}
            hitSlop={8}
          >
            <FontAwesome5
              name="heart"
              iconStyle={isFavorite ? 'solid' : 'regular'}
              size={20}
              color={isFavorite ? COLORS.heart : COLORS.textSecondary}
            />
          </Pressable>
        </Animated.View>
      </View>

      <Animated.View style={[styles.artworkWrapper, { opacity: artworkOpacity, transform: [{ scale: artworkScale }] }]}>
        {posterUrl ? (
          <Image source={{ uri: posterUrl }} style={styles.artwork} />
        ) : (
          <View style={[styles.artwork, styles.artworkPlaceholder]}>
            <FontAwesome5 name="music" iconStyle="solid" size={72} color={COLORS.border} />
          </View>
        )}
      </Animated.View>

      <Animated.View style={[styles.bottomSection, { opacity: contentOpacity, transform: [{ translateY: contentSlide }] }]}>
        <View style={styles.infoRow}>
          <View style={styles.infoText}>
            <Text style={styles.title} numberOfLines={1}>{audio.title}</Text>
            <Text style={styles.artist} numberOfLines={1}>{audio.about ?? 'SonicX'}</Text>
          </View>
          <Pressable style={styles.iconBtn} hitSlop={8}>
            <FontAwesome5 name="ellipsis-h" iconStyle="solid" size={18} color={COLORS.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.progressSection}>
          <View
            style={styles.progressTrack}
            onLayout={e => { progressBarWidth.current = e.nativeEvent.layout.width; }}
            {...panResponder.panHandlers}
          >
            <View style={[styles.progressFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
            <View style={[styles.progressThumb, { left: `${Math.min(progress * 100, 98)}%` }]} />
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(position)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </View>

        <View style={styles.controls}>
          <Pressable onPress={() => setIsShuffle(s => !s)} style={styles.sideBtn} hitSlop={8}>
            <FontAwesome5
              name="random"
              iconStyle="solid"
              size={18}
              color={isShuffle ? COLORS.primary : COLORS.textSecondary}
            />
          </Pressable>

          <Pressable
            style={styles.skipBtn}
            hitSlop={8}
            onPress={() => { videoRef.current?.seek(0); setPosition(0); }}
          >
            <FontAwesome5 name="step-backward" iconStyle="solid" size={22} color={COLORS.text} />
          </Pressable>

          <Animated.View style={{ transform: [{ scale: playBtnScale }] }}>
            <Pressable
              style={styles.playBtn}
              onPress={() => { setIsPlaying(p => !p); animatePlayBtn(); }}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <FontAwesome5
                  name={isPlaying ? 'pause' : 'play'}
                  iconStyle="solid"
                  size={22}
                  color="#fff"
                />
              )}
            </Pressable>
          </Animated.View>

          <Pressable
            style={styles.skipBtn}
            hitSlop={8}
            onPress={() => videoRef.current?.seek(duration)}
          >
            <FontAwesome5 name="step-forward" iconStyle="solid" size={22} color={COLORS.text} />
          </Pressable>

          <Pressable onPress={() => setIsRepeat(r => !r)} style={styles.sideBtn} hitSlop={8}>
            <FontAwesome5
              name="redo"
              iconStyle="solid"
              size={18}
              color={isRepeat ? COLORS.primary : COLORS.textSecondary}
            />
          </Pressable>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  hiddenVideo: {
    width: 0,
    height: 0,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerSub: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: COLORS.textSecondary,
    letterSpacing: 2,
    marginBottom: 3,
  },
  headerTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: COLORS.text,
  },
  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  artworkWrapper: {
    alignItems: 'center',
    paddingHorizontal: 32,
    marginBottom: 28,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35,
    shadowRadius: 32,
    elevation: 24,
  },
  artwork: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
  },
  artworkPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSection: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 22,
    color: COLORS.text,
    marginBottom: 5,
  },
  artist: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  progressSection: {
    marginBottom: 28,
  },
  progressTrack: {
    height: 3,
    backgroundColor: COLORS.progressBg,
    borderRadius: 2,
    marginBottom: 10,
    position: 'relative',
    justifyContent: 'center',
  },
  progressFill: {
    height: 3,
    backgroundColor: COLORS.progressFill,
    borderRadius: 2,
  },
  progressThumb: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#fff',
    marginLeft: -7,
    top: -5.5,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 4,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  sideBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipBtn: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.playBtn,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.playBtn,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 16,
    elevation: 14,
  },
});

export default MusicPlayer;
