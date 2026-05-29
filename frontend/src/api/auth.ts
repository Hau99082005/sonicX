import client from './client';

export interface RegisterPayload {
  name: string;
  username: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthProfile {
  id: string;
  username: string;
  name: string;
  email: string;
  verified: boolean;
  avatar?: string;
  is_online: boolean;
  last_seen?: string;
  bio?: string;
  phone?: string;
  show_online_status: boolean;
}

export interface LoginResponse {
  profile: AuthProfile;
  token: string;
}

export interface RegisterResponse {
  message: string;
  user: AuthProfile;
  token: string;
}

export const registerUser = (data: RegisterPayload) =>
  client.post<RegisterResponse>('/auth/create', data);

export const loginUser = (data: LoginPayload) =>
  client.post<LoginResponse>('/auth/sign-in', data);

export const verifyEmail = (data: {token: string; userId: string}) =>
  client.post('/auth/verify-email', data);

export const resendVerification = (data: {userId: string}) =>
  client.post('/auth/re-verify-email', data);

export const googleSignInApi = (idToken: string) =>
  client.post<LoginResponse & { message?: string }>('/auth/google-sign-in', { idToken });
