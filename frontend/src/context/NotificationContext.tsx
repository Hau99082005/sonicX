import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { AppState, Vibration } from 'react-native';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import {
  getNotifications,
  markAllRead,
  markOneRead,
  deleteNotification,
  deleteAllNotifications,
  getNotificationSettings,
  updateNotificationSettings,
  NotificationItem,
  NotificationSettings,
} from '../api/notification';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';

const player = new AudioRecorderPlayer();

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  settings: NotificationSettings;
  banner: NotificationItem | null;
  loadNotifications: () => Promise<void>;
  handleMarkAllRead: () => Promise<void>;
  handleMarkOneRead: (id: string) => Promise<void>;
  handleDelete: (id: string) => Promise<void>;
  handleDeleteAll: () => Promise<void>;
  handleUpdateSettings: (s: Partial<NotificationSettings>) => Promise<void>;
  dismissBanner: () => void;
}

const defaultSettings: NotificationSettings = {
  enabled: true,
  sound: true,
  vibration: true,
  preview: true,
  messages: true,
  calls: true,
  friendRequests: true,
  groupInvites: true,
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { socket } = useSocket();
  const { token } = useAuth();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [banner, setBanner] = useState<NotificationItem | null>(null);
  const bannerTimerRef = useRef<any>(null);

  const loadNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await getNotifications();
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    } catch {}
  }, [token]);

  const loadSettings = useCallback(async () => {
    if (!token) return;
    try {
      const s = await getNotificationSettings();
      setSettings(s);
    } catch {}
  }, [token]);

  useEffect(() => {
    loadNotifications();
    loadSettings();
  }, [loadNotifications, loadSettings]);

  const playNotificationSound = useCallback(async () => {
    try {
      await player.startPlayer(
        require('../../assets/sounds/Nhac-chuong-cuoc-goi-Facebook-Messenger-www_nhacchuongvui_com.mp3'),
      );
      setTimeout(() => player.stopPlayer().catch(() => {}), 1800);
    } catch {}
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNotification = ({
      notification,
      sound,
      vibration,
    }: {
      notification: NotificationItem;
      sound: boolean;
      vibration: boolean;
    }) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);

      if (AppState.currentState !== 'active') return;

      setBanner(notification);
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
      bannerTimerRef.current = setTimeout(() => setBanner(null), 4000);

      if (sound && settings.sound) playNotificationSound();
      if (vibration && settings.vibration) {
        Vibration.vibrate([0, 80, 60, 80]);
      }
    };

    socket.on('notification', handleNotification);
    return () => {
      socket.off('notification', handleNotification);
    };
  }, [socket, settings, playNotificationSound]);

  const handleMarkAllRead = async () => {
    await markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleMarkOneRead = async (id: string) => {
    await markOneRead(id);
    setNotifications(prev =>
      prev.map(n => (n._id === id ? { ...n, isRead: true } : n)),
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
    const target = notifications.find(n => n._id === id);
    setNotifications(prev => prev.filter(n => n._id !== id));
    if (target && !target.isRead) setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleDeleteAll = async () => {
    await deleteAllNotifications();
    setNotifications([]);
    setUnreadCount(0);
  };

  const handleUpdateSettings = async (partial: Partial<NotificationSettings>) => {
    const updated = await updateNotificationSettings({ ...settings, ...partial });
    setSettings(updated);
  };

  const dismissBanner = () => {
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    setBanner(null);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        settings,
        banner,
        loadNotifications,
        handleMarkAllRead,
        handleMarkOneRead,
        handleDelete,
        handleDeleteAll,
        handleUpdateSettings,
        dismissBanner,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};
