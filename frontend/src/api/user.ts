import client from './client';

export const getUserProfile = async (userId: string) => {
  const { data } = await client.get(`/profile/info/${userId}`);
  return data.profile;
};
