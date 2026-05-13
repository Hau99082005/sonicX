import client from './client';

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthProfile {
  id: string;
  name: string;
  email: string;
  verified: boolean;
  avatar?: string;
  followers: number;
  following: number;
}

export interface LoginResponse {
  profile: AuthProfile;
  token: string;
}

export const registerUser = (data: RegisterPayload) =>
  client.post('/auth/create', data);

export const loginUser = (data: LoginPayload) =>
  client.post<LoginResponse>('/auth/sign-in', data);
