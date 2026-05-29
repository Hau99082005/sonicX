import client from "./client";

export const sendFriendRequest = async (receiverId: string) => {
  const { data } = await client.post("/friendship/request", { receiverId });
  return data;
};

export const acceptFriendRequest = async (requesterId: string) => {
  const { data } = await client.post("/friendship/accept", { requesterId });
  return data;
};

export const getFriends = async () => {
  const { data } = await client.get("/friendship/all");
  return data.friends;
};

export const unfriend = async (friendId: string) => {
  const { data } = await client.delete(`/friendship/${friendId}`);
  return data;
};
