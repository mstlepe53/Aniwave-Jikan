import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, RefreshCw, ArrowDownUp, Clock, ThumbsUp } from 'lucide-react';
import { type Comment, getComments, createComment } from '../../services/commentApi';
import { useAuth } from '../../context/AuthContext';
import CommentBox from './CommentBox';
import CommentItem from './CommentItem';

interface CommentSectionProps {
  episodeId: string;
}

type SortMode = 'recent' | 'helpful';

export default function CommentSection({ episodeId }: CommentSectionProps) {
  const { user, token } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sort, setSort] = useState<SortMode>('recent');

  const loadComments = useCallback(async (sortMode: SortMode = sort) => {
    setLoading(true);
    setError('');
    try {
      const data = await getComments(episodeId, token, sortMode);
      setComments((data.comments || []).map(c => ({ ...c, replies: c.replies || [] })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments.');
    } finally {
      setLoading(false);
    }
  }, [episodeId, token, sort]);

  useEffect(() => {
    loadComments(sort);
  }, [episodeId, token, sort]);

  async function handleNewComment(content: string) {
    if (!token) return;
    const result = await createComment(episodeId, content, token);
    setComments(prev => [{ ...result.comment, replies: result.comment.replies || [] }, ...prev]);
  }

  function handleUpdate(id: string, updated: Partial<Comment>) {
    function updateInList(list: Comment[]): Comment[] {
      return list.map(c => {
        const replies = c.replies || [];
        if (c.id === id) return { ...c, ...updated, replies };
        if (replies.length > 0) return { ...c, replies: updateInList(replies) };
        return { ...c, replies };
      });
    }
    setComments(prev => updateInList(prev));
  }

  function handleDelete(id: string) {
    function removeFromList(list: Comment[]): Comment[] {
      return list
        .filter(c => c.id !== id)
        .map(c => ({ ...c, replies: removeFromList(c.replies || []) }));
    }
    setComments(prev => removeFromList(prev));
  }

  function handleReplyAdded(parentId: string, reply: Comment) {
    setComments(prev =>
      prev.map(c => {
        if (c.id === parentId) {
          return { ...c, replies: [...(c.replies || []), { ...reply, replies: reply.replies || [] }] };
        }
        return c;
      }),
    );
  }

  const maxLikes = sort === 'helpful'
    ? Math.max(0, ...comments.map(c => c.likeCount ?? 0))
    : 0;

  const totalCount = comments.reduce((acc, c) => acc + 1 + (c.replies || []).length, 0);

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-500" />
          <h2 className="font-black text-gray-900 dark:text-white text-base">
            Comments
            {!loading && totalCount > 0 && (
              <span className="ml-2 text-sm font-semibold text-gray-400 dark:text-gray-500">({totalCount})</span>
            )}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setSort('recent')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                sort === 'recent'
                  ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              title="Sort by newest"
            >
              <Clock className="w-3 h-3" />
              Recent
            </button>
            <button
              onClick={() => setSort('helpful')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                sort === 'helpful'
                  ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              title="Sort by most helpful"
            >
              <ThumbsUp className="w-3 h-3" />
              Helpful
            </button>
          </div>

          <button
            onClick={() => loadComments(sort)}
            disabled={loading}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {user ? (
          <CommentBox user={user} onSubmit={handleNewComment} />
        ) : (
          <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 px-5 py-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              <Link to="/login" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">Log in</Link>
              {' or '}
              <Link to="/signup" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">create an account</Link>
              {' to join the discussion.'}
            </p>
          </div>
        )}

        {sort === 'helpful' && !loading && comments.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 rounded-lg px-3 py-2">
            <ArrowDownUp className="w-3.5 h-3.5 shrink-0" />
            <span>Showing most helpful comments first based on community reactions.</span>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 px-4 py-3 text-sm text-red-700 dark:text-red-300 font-medium">
            {error}
          </div>
        )}

        {loading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
                  <div className="h-3 w-24 bg-gray-100 dark:bg-gray-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && comments.length === 0 && (
          <div className="text-center py-8">
            <MessageCircle className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-gray-700" />
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">No comments yet</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Be the first to share your thoughts!</p>
          </div>
        )}

        {!loading && comments.length > 0 && (
          <div className="space-y-4">
            {comments.map(comment => (
              <CommentItem
                key={comment.id}
                comment={{ ...comment, replies: comment.replies || [] }}
                user={user}
                token={token}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onReplyAdded={handleReplyAdded}
                isTopComment={sort === 'helpful' && (comment.likeCount ?? 0) > 0 && comment.likeCount === maxLikes}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}