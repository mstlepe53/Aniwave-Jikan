export interface BadgeInfo {
  id: number;
  name: string;
  icon: string;
  description: string;
}

export interface PublicUser {
  id: string;
  username: string;
  avatar: string;
  bio: string | null;
  createdAt: string;
  xp?: number;
  level?: number;
  watchTime?: number;
  followersCount?: number;
  followingCount?: number;
  totalComments?: number;
  isFollowing?: boolean;
  isOwnProfile?: boolean;
  badges?: BadgeInfo[];
  recentComments?: Array<{
    id: string;
    episodeId: string;
    content: string;
    createdAt: string;
    parentId: string | null;
  }>;
}

export interface FollowListUser {
  id: string;
  username: string;
  avatar: string;
  bio: string | null;
  createdAt: string;
}

export interface UpdateProfileInput {
  username?: string;
  bio?: string;
  avatar?: string;
}

async function request<T>(path: string, token: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api/profile${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { message?: string }).message || 'Request failed.');
  return data as T;
}

export function getMyProfile(token: string) {
  return request<{ user: PublicUser }>('/me', token);
}

export function updateProfile(token: string, input: UpdateProfileInput) {
  return request<{ user: PublicUser }>('/me', token, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function getPublicProfile(username: string, token?: string | null): Promise<{ user: PublicUser }> {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`/api/profile/user/${encodeURIComponent(username)}`, { headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { message?: string }).message || 'User not found.');
  return data as { user: PublicUser };
}

export async function followProfile(username: string, token: string) {
  return request<{ following: boolean; stats: { followers: number; following: number } }>(
    `/user/${encodeURIComponent(username)}/follow`,
    token,
    { method: 'POST' },
  );
}

export async function unfollowProfile(username: string, token: string) {
  return request<{ following: boolean; stats: { followers: number; following: number } }>(
    `/user/${encodeURIComponent(username)}/follow`,
    token,
    { method: 'DELETE' },
  );
}

export async function getProfileFollowers(username: string, token?: string | null): Promise<{ followers: FollowListUser[] }> {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`/api/profile/user/${encodeURIComponent(username)}/followers`, { headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { message?: string }).message || 'Failed to load followers.');
  return data as { followers: FollowListUser[] };
}

export async function getProfileFollowing(username: string, token?: string | null): Promise<{ following: FollowListUser[] }> {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`/api/profile/user/${encodeURIComponent(username)}/following`, { headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { message?: string }).message || 'Failed to load following.');
  return data as { following: FollowListUser[] };
}

export function recordWatchTime(seconds: number, token: string) {
  return request<{ xp: number; level: number; watchTime: number }>(
    '/me/watch-time',
    token,
    { method: 'POST', body: JSON.stringify({ seconds }) },
  );
}
