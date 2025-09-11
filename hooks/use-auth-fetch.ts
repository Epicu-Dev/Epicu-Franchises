import { getValidAccessToken } from '../utils/auth';

export const useAuthFetch = () => {
  const authFetch = async (input: RequestInfo, init?: RequestInit) => {
    const token = await getValidAccessToken();

    if (!token) throw new Error('No access token');
    const headers = new Headers((init?.headers as HeadersInit) || {});

    headers.set('Authorization', `Bearer ${token}`);
    const merged: RequestInit = { ...init, headers };

    return fetch(input, merged);
  };

  return { authFetch };
};
