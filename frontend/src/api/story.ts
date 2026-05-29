import client from "./client";

export const createStory = async (formData: FormData) => {
  const { data } = await client.post("/story/create", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.story;
};

export const getStories = async () => {
  const { data } = await client.get("/story/all");
  return data.stories;
};

export const deleteStory = async (id: string) => {
  const { data } = await client.delete(`/story/${id}`);
  return data;
};
