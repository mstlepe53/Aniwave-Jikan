import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Pencil, Trash2, ChevronDown, ChevronUp, Check, X, Star } from 'lucide-react';
import { type Comment, createReply, editComment, deleteComment, toggleReaction } from '../../services/commentApi';
import { getAvatarUrl } from '../../constants/avatars';
import { timeAgo } from '../../utils/timeAgo';
import type { AuthUser } from '../../services/authApi';
import CommentBox from './CommentBox';
import UserHoverCard from '../UserHoverCard';
import LevelBadge from '../LevelBadge';

interface CommentItemProps {
  comment: Comment;
  user: AuthUser | null;
  token: string | null;
  depth?: number;
  isTopComment?: boolean;
  onUpdate: (id: string, updated: Partial<Comment>) => void;
  onDelete: (id: string) => void;
  onReplyAdded: (parentId: string, reply: Comment) => void;
}

export default function CommentItem({
  comment,
  user,
  token,
  depth = 0,
  isTopComment = false,
  onUpdate,
  onDelete,
  onReplyAdded,
}: CommentItemProps) {
  const [showReplies, setShowReplies] = useState(false);
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [editPosting, setEditPosting] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const replies = comment.replies || [];
  const isOwn = user?.id === comment.userId;
  const avatarUrl = getAvatarUrl(comment.author.avatar);

  async function handleLike() {
    if (!token) return;
    setLikeLoading(true);
    try {
      const result = await toggleReaction(comment.id, token);
      onUpdate(comment.id, { likedByMe: result.liked, likeCount: result.likeCount });
    } catch {}
    setLikeLoading(false);
  }

  async function handleReply(content: string) {
    if (!token) return;
    const result = await createReply(comment.id, content, token);
    onReplyAdded(comment.id, { ...result.comment, replies: result.comment.replies || [] });
    setReplying(false);
    setShowReplies(true);
  }

  async function handleEdit() {
    if (!token || !editText.trim()) return;
    setEditPosting(true);
    try {
      const result = await editComment(comment.id, editText.trim(), token);
      onUpdate(comment.id, { content: result.comment.content, updatedAt: result.comment.updatedAt });
      setEditing(false);
    } catch {}
    setEditPosting(false);
  }

  async function handleDelete() {
    if (!token) return;
    await deleteComment(comment.id, token);
    onDelete(comment.id);
  }

  return (
    <div className={`${depth > 0 ? 'ml-8 sm:ml-10 pl-3 border-l-2 border-gray-100 dark:border-gray-800' : ''}`}>
      <div className="flex gap-3 group">
        <UserHoverCard username={comment.author.username}>
          <Link to={`/user/${comment.author.username}`} className="shrink-0 mt-0.5 block">
            <img
              src={avatarUrl}
              alt={comment.author.username}
              className="w-8 h-8 rounded-full object-cover bg-gray-100 dark:bg-gray-800"
            />
          </Link>
        </UserHoverCard>

        <div className="flex-1 min-w-0">
          <div className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl rounded-tl-sm px-4 py-3">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                <UserHoverCard username={comment.author.username}>
                  <Link
                    to={`/user/${comment.author.username}`}
                    className="text-sm font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"
                  >
                    {comment.author.username}
                  </Link>
                </UserHoverCard>
                {comment.author.level !== undefined && (
                  <LevelBadge level={comment.author.level} size="xs" />
                )}
                {isTopComment && (
                  <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded-full text-[10px] font-bold shrink-0">
                    <Star className="w-2.5 h-2.5 fill-current" />
                    Top
                  </span>
                )}
                <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
                  {timeAgo(comment.createdAt)}
                  {comment.updatedAt !== comment.createdAt && ' · edited'}
                </span>
              </div>

              {isOwn && !editing && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { setEditing(true); setEditText(comment.content); }}
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  {!deleteConfirm ? (
                    <button
                      onClick={() => setDeleteConfirm(true)}
                      className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/40 text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button onClick={handleDelete} className="p-1 rounded bg-red-500 text-white" title="Confirm delete">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteConfirm(false)} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 transition-colors" title="Cancel">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {editing ? (
              <div className="space-y-2">
                <textarea
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  rows={2}
                  maxLength={2000}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleEdit}
                    disabled={editPosting || !editText.trim()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" /> {editPosting ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words leading-relaxed">
                {comment.content}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 mt-1.5 px-1">
            <button
              onClick={handleLike}
              disabled={likeLoading || !token}
              className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                comment.likedByMe
                  ? 'text-red-500 dark:text-red-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400'
              } disabled:opacity-50`}
            >
              <Heart className={`w-3.5 h-3.5 transition-all ${comment.likedByMe ? 'fill-current scale-110' : ''}`} />
              {comment.likeCount > 0 && <span>{comment.likeCount}</span>}
            </button>

            {depth === 0 && (
              <button
                onClick={() => setReplying(r => !r)}
                className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Reply
              </button>
            )}

            {replies.length > 0 && (
              <button
                onClick={() => setShowReplies(v => !v)}
                className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors ml-auto"
              >
                {showReplies ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
              </button>
            )}
          </div>

          {replying && (
            <div className="mt-3 ml-1">
              <CommentBox
                user={user}
                onSubmit={handleReply}
                placeholder={`Reply to ${comment.author.username}…`}
                autoFocus
                onCancel={() => setReplying(false)}
                compact
              />
            </div>
          )}

          {showReplies && replies.length > 0 && (
            <div className="mt-3 space-y-3">
              {replies.map(reply => (
                <CommentItem
                  key={reply.id}
                  comment={{ ...reply, replies: reply.replies || [] }}
                  user={user}
                  token={token}
                  depth={1}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  onReplyAdded={onReplyAdded}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
