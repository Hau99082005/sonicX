import client from './client';

export const sendFriendRequest = async (receiverId: string) => {
  const { data } = await client.post('/friendship/request', { receiverId });
  return data;
};

export const acceptFriendRequest = async (requesterId: string) => {
  const { data } = await client.post('/friendship/accept', { requesterId });
  return data;
};

export const getFriends = async () => {
  const { data } = await client.get('/friendship/all');
  return data.friends;
};

export const getBlockedUsers = async () => {
  const { data } = await client.get('/friendship/blocked');
  return data.blocked as Array<{ _id: string; name: string; username: string; avatar?: string }>;
};

export const unfriend = async (friendId: string) => {
  const { data } = await client.delete(`/friendship/${friendId}`);
  return data;
};

export const blockUser = async (userId: string) => {
  const { data } = await client.post('/friendship/block', { userId });
  return data;
};

export const unblockUser = async (userId: string) => {
  const { data } = await client.post('/friendship/unblock', { userId });
  return data;
};

export const updateNickname = async (friendId: string, nickname: string) => {
  const { data } = await client.post('/friendship/nickname', {
    friendId,
    nickname,
  });
  return data;
};

export const getFriendshipStatus = async (targetId: string) => {
  const { data } = await client.get(`/friendship/status/${targetId}`);
  return data;
};

export const getBlockStatus = async (targetId: string): Promise<{ iBlockedThem: boolean; theyBlockedMe: boolean }> => {
  const { data } = await client.get(`/friendship/block-status/${targetId}`);
  return data;
};
