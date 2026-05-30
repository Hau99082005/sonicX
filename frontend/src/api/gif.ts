import client from './client';

export interface TenorGif {
  id: string;
  title: string;
  url: string;
  preview: string;
}

export const fetchGifs = async (query = '', limit = 24) => {
  const { data } = await client.get(
    `/gif/search?q=${encodeURIComponent(query)}&limit=${limit}`,
  );
  return data.gifs as TenorGif[];
};

export default { fetchGifs };
