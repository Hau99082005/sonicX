
const { env } = process as { env: { [key: string]: string } }
export const { URI, MAILTRAP_USER,MAILTRAP_PASS, VERIFICATION_EMAIL, PASSWORD_RESET_URL} = env;
