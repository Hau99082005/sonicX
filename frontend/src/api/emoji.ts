import client from './client';

export async function fetchEmojiList() {
  const res = await client.get('/emoji/list');
  return res.data.emojis as Array<{
    char: string;
    filename: string;
    url: string;
  }>;
}

export default { fetchEmojiList };
