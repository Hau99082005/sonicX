import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import Video from 'react-native-video';
import { Audio } from '@api/music';

interface PlayerContextValue {
  currentAudio: Audio | null;
  isPlaying: boolean;
  isLoading: boolean;
  position: number;
  duration: number;
  repeatMode: number;
  isShuffle: boolean;
  rate: number;
  sleepMinutes: number | null;
  sleepRemaining: number | null;
  play: (audio: Audio) => void;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  seekRatio: (ratio: number) => void;
  setRepeatMode: (mode: number) => void;
  setIsShuffle: (v: boolean) => void;
  setRate: (r: number) => void;
  setSleepTimer: (minutes: number | null) => void;
  videoRef: React.RefObject<any>;
  durationRef: React.RefObject<number>;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export const usePlayer = (): PlayerContextValue => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
};

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const videoRef = useRef<any>(null);
  const durationRef = useRef(0);
  const sleepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [currentAudio, setCurrentAudio] = useState<Audio | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [repeatMode, setRepeatModeState] = useState(0);
  const [isShuffle, setIsShuffleState] = useState(false);
  const [rate, setRateState] = useState(1);
  const [sleepMinutes, setSleepMinutesState] = useState<number | null>(null);
  const [sleepRemaining, setSleepRemaining] = useState<number | null>(null);

  const play = useCallback((audio: Audio) => {
    setCurrentAudio(audio);
    setIsPlaying(true);
    setIsLoading(true);
    setPosition(0);
    setDuration(0);
    durationRef.current = 0;
  }, []);

  const togglePlay = useCallback(() => setIsPlaying(p => !p), []);

  const seek = useCallback((seconds: number) => {
    videoRef.current?.seek(seconds);
    setPosition(seconds);
  }, []);

  const seekRatio = useCallback((ratio: number) => {
    const t = Math.max(0, Math.min(ratio, 1)) * durationRef.current;
    videoRef.current?.seek(t);
    setPosition(t);
  }, []);

  const setRepeatMode = useCallback((mode: number) => setRepeatModeState(mode), []);
  const setIsShuffle = useCallback((v: boolean) => setIsShuffleState(v), []);
  const setRate = useCallback((r: number) => setRateState(r), []);

  const setSleepTimer = useCallback((minutes: number | null) => {
    if (sleepTimerRef.current) {
      clearInterval(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }
    if (minutes === null) {
      setSleepMinutesState(null);
      setSleepRemaining(null);
      return;
    }
    setSleepMinutesState(minutes);
    setSleepRemaining(minutes * 60);
    sleepTimerRef.current = setInterval(() => {
      setSleepRemaining(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(sleepTimerRef.current!);
          sleepTimerRef.current = null;
          setSleepMinutesState(null);
          setIsPlaying(false);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
    };
  }, []);

  const fileUrl: string = currentAudio
    ? typeof currentAudio.file === 'string'
      ? currentAudio.file
      : (currentAudio.file as any)?.url ?? ''
    : '';

  return (
    <PlayerContext.Provider
      value={{
        currentAudio,
        isPlaying,
        isLoading,
        position,
        duration,
        repeatMode,
        isShuffle,
        rate,
        sleepMinutes,
        sleepRemaining,
        play,
        togglePlay,
        seek,
        seekRatio,
        setRepeatMode,
        setIsShuffle,
        setRate,
        setSleepTimer,
        videoRef,
        durationRef,
      }}
    >
      {children}
      {currentAudio && fileUrl ? (
        <Video
          ref={videoRef}
          source={{ uri: fileUrl }}
          playInBackground
          playWhenInactive
          ignoreSilentSwitch="ignore"
          paused={!isPlaying}
          repeat={repeatMode === 2}
          rate={rate}
          onLoad={d => {
            durationRef.current = d.duration;
            setDuration(d.duration);
            setIsLoading(false);
          }}
          onProgress={d => setPosition(d.currentTime)}
          onEnd={() => {
            if (repeatMode === 0) {
              setIsPlaying(false);
              setPosition(0);
            }
          }}
          onError={() => setIsLoading(false)}
          progressUpdateInterval={1000}
          style={{ width: 0, height: 0 }}
        />
      ) : null}
    </PlayerContext.Provider>
  );
};
