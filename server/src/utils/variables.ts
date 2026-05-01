
const { env } = process as { env: { [key: string]: string } }
export const URI = env.MONGO_URI;
