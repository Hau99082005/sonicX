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
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@react-native-vector-icons/fontawesome5';
import LinearGradient from 'react-native-linear-gradient';
import { Audio, toggleFavorite, checkIsFavorite } from '@api/music';
import { RouteProp } from '@react-navigation/native';
import { usePlayer } from '../../context/PlayerContext';

const { width } = Dimensions.get('window');
const ARTWORK_SIZE = width * 0.72;

const C = {
  bg: '#000000',
  text: '#FFFFFF',
  sub: '#94A3B8',
  accent: '#7C3AED',
  heart: '#FF5370',
  success: '#22C55E',
  error: '#EF4444',
};

type RootStackParamList = { MusicPlayer: { audio: Audio } };
interface Props {
  route: RouteProp<RootStackParamList, 'MusicPlayer'>;
  navigation: any;
}

const fmt = (s: number) => {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = String(Math.floor(s % 60)).padStart(2, '0');
  return `${m}:${sec}`;
};

const MusicPlayer: React.FC<Props> = ({ route, navigation }) => {
  const { audio } = route.params;
  const player = usePlayer();
  const [isFavorite, setIsFavorite] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const volAnim = useRef(new Animated.Value(0)).current;
  const volTimer = useRef<any>(null);

  const { 
    isPlaying, 
    isLoading, 
    position, 
    duration, 
    volume, 
    setVolume, 
    isShuffle, 
    setIsShuffle, 
    repeatMode, 
    setRepeatMode 
  } = player;

  useEffect(() => {
    if (audio._id !== player.currentAudio?._id) player.play(audio);
    checkIsFavorite(audio._id).then((res: any) => setIsFavorite(res.data.result)).catch(() => {});
  }, [audio]);

  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 15000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      rotateAnim.stopAnimation();
    }
  }, [isPlaying]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const toggleFav = async () => {
    try {
      const res = await toggleFavorite(audio._id);
      setIsFavorite(res.data.status === 'added');
    } catch {}
  };

  const showVol = () => {
    Animated.spring(volAnim, { toValue: 1, useNativeDriver: true }).start();
    if (volTimer.current) clearTimeout(volTimer.current);
    volTimer.current = setTimeout(() => {
      Animated.timing(volAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start();
    }, 2000);
  };

  const panVolume = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gs) => {
        const delta = gs.dy / 200;
        setVolume(volume - delta);
        showVol();
      },
    })
  ).current;

  const panProgress = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: e => player.seekRatio(e.nativeEvent.locationX / (width - 80)),
      onPanResponderMove: e => player.seekRatio(e.nativeEvent.locationX / (width - 80)),
    })
  ).current;

  const pct = duration > 0 ? Math.min(position / duration, 1) : 0;
  const posterUrl = typeof audio.poster === 'string' ? audio.poster : (audio.poster as any)?.url ?? audio.image ?? '';

  return (
    <View style={s.root} {...panVolume.panHandlers}>
      <LinearGradient colors={['#1A1D26', '#000000']} style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <Pressable onPress={() => navigation.goBack()} style={s.iconBtn}>
            <FontAwesome5 name="chevron-down" iconStyle="solid" size={20} color="#fff" />
          </Pressable>
          <View style={s.statusRow}>
            <View style={[s.statusDot, { backgroundColor: isPlaying ? C.success : C.error }]} />
            <Text style={[s.headerTitle, { color: isPlaying ? C.success : C.error }]}>
              {isPlaying ? 'ĐANG PHÁT' : 'ĐÃ DỪNG'}
            </Text>
          </View>
          <Pressable style={s.iconBtn}>
            <FontAwesome5 name="ellipsis-h" iconStyle="solid" size={18} color="#fff" />
          </Pressable>
        </View>

        <View style={s.artworkContainer}>
          <View style={s.artWrapper}>
            <Animated.Image 
              source={{ uri: posterUrl }} 
              style={[s.artwork, { transform: [{ rotate: rotation }] }]} 
            />
            <Animated.View style={[s.volIndicator, { opacity: volAnim }]}>
              <View style={s.volBarBg}>
                <View style={[s.volBarFill, { height: `${volume * 100}%` }]} />
              </View>
              <FontAwesome5 name={volume === 0 ? "volume-mute" : "volume-up"} iconStyle="solid" size={14} color="#fff" />
            </Animated.View>
          </View>
        </View>

        <View style={s.infoSection}>
          <View style={s.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.title} numberOfLines={1}>{audio.title}</Text>
              <Text style={s.artist} numberOfLines={1}>{audio.about || 'SonicX'}</Text>
            </View>
            <Pressable onPress={toggleFav} style={s.favBtn}>
              <FontAwesome5 name="heart" iconStyle={isFavorite ? 'solid' : 'regular'} size={24} color={isFavorite ? C.heart : '#fff'} />
            </Pressable>
          </View>

          <View style={s.progressSection}>
            <View style={s.sliderBase} {...panProgress.panHandlers}>
              <View style={s.sliderBg}>
                <View style={[s.sliderFill, { width: `${pct * 100}%` as any }]}>
                  <View style={s.knob} />
                </View>
              </View>
            </View>
            <View style={s.timeRow}>
              <Text style={s.timeText}>{fmt(position)}</Text>
              <Text style={s.timeText}>{fmt(duration)}</Text>
            </View>
          </View>

          <View style={s.mainControls}>
            <Pressable onPress={() => setIsShuffle(!isShuffle)}>
              <FontAwesome5 name="random" iconStyle="solid" size={18} color={isShuffle ? C.accent : '#fff'} />
            </Pressable>
            
            <Pressable onPress={() => player.seek(0)}>
              <FontAwesome5 name="step-backward" iconStyle="solid" size={26} color="#fff" />
            </Pressable>
            
            <Pressable style={s.playBtn} onPress={() => player.togglePlay()}>
              {isLoading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <FontAwesome5 name={isPlaying ? 'pause' : 'play'} iconStyle="solid" size={30} color="#000" />
              )}
            </Pressable>
            
            <Pressable onPress={() => player.seek(duration)}>
              <FontAwesome5 name="step-forward" iconStyle="solid" size={26} color="#fff" />
            </Pressable>

            <Pressable onPress={() => setRepeatMode(repeatMode === 0 ? 2 : 0)}>
              <FontAwesome5 name="sync-alt" iconStyle="solid" size={18} color={repeatMode !== 0 ? C.accent : '#fff'} />
            </Pressable>
          </View>

          <View style={s.footer}>
            <Pressable style={s.footerBtn}>
              <FontAwesome5 name="share-alt" iconStyle="solid" size={16} color={C.sub} />
              <Text style={s.footerText}>Chia sẻ</Text>
            </Pressable>
            <Pressable style={s.footerBtn}>
              <FontAwesome5 name="list-ul" iconStyle="solid" size={16} color={C.sub} />
              <Text style={s.footerText}>Danh sách</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 60,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  headerTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 1.5 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  
  artworkContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  artWrapper: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    borderRadius: ARTWORK_SIZE / 2,
    borderWidth: 8,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
    position: 'relative',
    elevation: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
  },
  artwork: { width: '100%', height: '100%', borderRadius: ARTWORK_SIZE / 2 },
  
  volIndicator: {
    position: 'absolute',
    right: 15,
    top: '25%',
    bottom: '25%',
    width: 34,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  volBarBg: { width: 3, flex: 1, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 1.5, marginBottom: 8 },
  volBarFill: { width: '100%', backgroundColor: '#fff', borderRadius: 1.5, position: 'absolute', bottom: 0 },

  infoSection: { paddingHorizontal: 40, paddingBottom: 40 },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 26, fontWeight: '900', color: '#fff', marginBottom: 6, letterSpacing: -0.5 },
  artist: { fontSize: 14, fontWeight: '700', color: C.accent, textTransform: 'uppercase', letterSpacing: 1 },
  favBtn: { width: 50, height: 50, alignItems: 'flex-end', justifyContent: 'center' },

  progressSection: { marginBottom: 40 },
  sliderBase: { height: 30, justifyContent: 'center' },
  sliderBg: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2 },
  sliderFill: { height: 4, backgroundColor: '#fff', borderRadius: 2, position: 'relative' },
  knob: {
    position: 'absolute',
    right: -10,
    top: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    elevation: 5,
  },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  timeText: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.4)', fontVariant: ['tabular-nums'] },

  mainControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  playBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },

  footer: { flexDirection: 'row', justifyContent: 'center', gap: 40, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 20 },
  footerBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  footerText: { fontSize: 12, fontWeight: '800', color: C.sub, textTransform: 'uppercase' },
});

export default MusicPlayer;
