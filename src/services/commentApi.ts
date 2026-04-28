export interface CommentAuthor {
  id: string;
  username: string;
  avatar: string;
  avatarUrl?: string;
  level?: number;
}

export interface Comment {
  id: string;
  episodeId: string;
  userId: string;
  parentId: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: CommentAuthor;
  likeCount: number;
  likedByMe: boolean;
  isTopComment?: boolean;
  replies: Comment[];
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`/api/comments${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { message?: string }).message || 'Request failed.');
  return data as T;
}

export function getComments(
  episodeId: string,
  token?: string | null,
  sort: 'recent' | 'helpful' = 'recent',
) {
  const sortParam = sort === 'helpful' ? '?sort=helpful' : '';
  return apiRequest<{ comments: Comment[]; sort?: string }>(
    `/${encodeURIComponent(episodeId)}${sortParam}`,
    {},
    token,
  );
}

export function createComment(episodeId: string, content: string, token: string) {
  return apiRequest<{ comment: Comment }>(
    `/${encodeURIComponent(episodeId)}`,
    { method: 'POST', body: JSON.stringify({ content }) },
    token,
  );
}

export function createReply(parentId: string, content: string, token: string) {
  return apiRequest<{ comment: Comment }>(
    `/${parentId}/replies`,
    { method: 'POST', body: JSON.stringify({ content }) },
    token,
  );
}

export function editComment(commentId: string, content: string, token: string) {
  return apiRequest<{ comment: Comment }>(
    `/${commentId}`,
    { method: 'PUT', body: JSON.stringify({ content }) },
    token,
  );
}

export function deleteComment(commentId: string, token: string) {
  return apiRequest<{ success: boolean }>(`/${commentId}`, { method: 'DELETE' }, token);
}

export function toggleReaction(commentId: string, token: string) {
  return apiRequest<{ liked: boolean; likeCount: number }>(
    `/${commentId}/react`,
    { method: 'POST' },
    token,
  );
}
