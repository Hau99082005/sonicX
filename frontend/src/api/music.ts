import client from './client';

export interface AudioOwner {
  name: string;
  id: string;
}

export interface LyricLine {
  time: number;
  text: string;
}

export interface Audio {
  _id: string;
  title: string;
  about?: string;
  owner?: string | AudioOwner;
  artist?: string;
  file?: { url: string; publicId: string };
  poster?: { url: string; publicId: string };
  image?: string;
  duration?: number;
  likes?: string[];
  category?: string;
  createdAt?: string;
  lyrics?: LyricLine[] | string;
}

export interface Playlist {
  _id: string;
  title: string;
  image?: string;
  tracks?: Audio[];
  owner?: string;
}

export const getLatestMusic = () => client.get<{ audio: Audio[] }>('/audio');

export const searchMusic = (query: string) =>
  client.get<{ audios: Audio[] }>(`/audio/search?query=${query}`);

export const getFavoriteMusic = () =>
  client.get<{ audios: Audio[] }>('/favorite');

export const toggleFavorite = (audioId: string) =>
  client.post<{ status: 'added' | 'removed' }>(`/favorite?audioId=${audioId}`);

export const checkIsFavorite = (audioId: string) =>
  client.get<{ result: boolean }>(`/favorite/is-favorite?audioId=${audioId}`);

export const getPlaylists = () =>
  client.get<{ playlists: Playlist[] }>('/playlist');

export const createPlaylist = (title: string) =>
  client.post<{ playlist: Playlist }>('/playlist', { title });

export const addToPlaylist = (playlistId: string, audioId: string) =>
  client.post(`/playlist/${playlistId}`, { audioId });

export const createAudio = (formData: FormData) =>
  client.post('/audio/create', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const updateAudio = (audioId: string, formData: FormData) =>
  client.patch(`/audio/${audioId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const deleteAudio = (audioId: string) =>
  client.delete(`/audio/${audioId}`);

export const getAllAudios = () => client.get<{ audio: Audio[] }>('/audio');

export const getSimilarAudios = (audioId: string, category?: string) =>
  client.get<{ audios: Audio[] }>(
    `/audio/similar/${audioId}${
      category ? `?category=${encodeURIComponent(category)}` : ''
    }`,
  );

export const getProfile = () => client.get('/auth/user');

export const updateProfile = (data: any) => client.post('/auth/user', data);

export const getLyrics = (audioId: string) =>
  client.get<{ lyrics: LyricLine[] | string | null }>(
    `/audio/${audioId}/lyrics`,
  );

export const getBanners = () => client.get<{ banners: any[] }>('/banner/list');
