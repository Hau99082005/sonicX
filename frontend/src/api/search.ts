import client from './client';

export interface SearchUser {
  _id: string;
  name: string;
  username: string;
  avatar?: string;
  is_online: boolean;
  last_seen?: string;
  show_online_status: boolean;
  bio?: string;
}

export interface SearchResult {
  conversations: any[];
  users: SearchUser[];
}

export const searchAll = async (q: string): Promise<SearchResult> => {
  const { data } = await client.get('/search', { params: { q } });
  return data;
};
