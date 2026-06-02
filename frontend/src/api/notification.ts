import client from './client';

export interface NotificationItem {
  _id: string;
  user: string;
  sender?: { _id: string; name: string; username: string; avatar?: string };
  type: 'message' | 'call' | 'friend_request' | 'group_invite';
  content: string;
  conversationId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  preview: boolean;
  messages: boolean;
  calls: boolean;
  friendRequests: boolean;
  groupInvites: boolean;
}

export const getNotifications = async (limit = 30, offset = 0) => {
  const { data } = await client.get('/notification', { params: { limit, offset } });
  return data as { notifications: NotificationItem[]; unreadCount: number };
};

export const markAllRead = async () => {
  const { data } = await client.patch('/notification/read-all');
  return data;
};

export const markOneRead = async (id: string) => {
  const { data } = await client.patch(`/notification/${id}/read`);
  return data;
};

export const deleteNotification = async (id: string) => {
  const { data } = await client.delete(`/notification/${id}`);
  return data;
};

export const deleteAllNotifications = async () => {
  const { data } = await client.delete('/notification/all');
  return data;
};

export const getNotificationSettings = async (): Promise<NotificationSettings> => {
  const { data } = await client.get('/notification/settings');
  return data.settings.notifications;
};

export const updateNotificationSettings = async (notifications: Partial<NotificationSettings>) => {
  const { data } = await client.patch('/notification/settings', { notifications });
  return data.settings.notifications as NotificationSettings;
};
