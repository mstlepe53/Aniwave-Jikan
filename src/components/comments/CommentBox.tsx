import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { getAvatarUrl } from '../../constants/avatars';
import type { AuthUser } from '../../services/authApi';

interface CommentBoxProps {
  user: AuthUser | null;
  onSubmit: (content: string) => Promise<void>;
  placeholder?: string;
  autoFocus?: boolean;
  onCancel?: () => void;
  compact?: boolean;
}

export default function CommentBox({
  user,
  onSubmit,
  placeholder = 'Share your thoughts about this episode…',
  autoFocus = false,
  onCancel,
  compact = false,
}: CommentBoxProps) {
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }

  async function handleSubmit() {
    const content = text.trim();
    if (!content) return;
    setPosting(true);
    setError('');
    try {
      await onSubmit(content);
      setText('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post. Please try again.');
    } finally {
      setPosting(false);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  }

  const avatarUrl = getAvatarUrl(user?.avatar);

  return (
    <div className={`flex gap-3 ${compact ? 'mt-2' : ''}`}>
      {user && (
        <img
          src={avatarUrl}
          alt={user.username}
          className={`rounded-full object-cover shrink-0 bg-gray-100 dark:bg-gray-800 ${compact ? 'w-7 h-7 mt-2' : 'w-9 h-9 mt-1'}`}
        />
      )}
      <div className="flex-1 space-y-2">
        {error && (
          <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
        )}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => { setText(e.target.value); autoResize(); }}
          onKeyDown={handleKey}
          placeholder={user ? placeholder : 'Log in to leave a comment…'}
          disabled={!user || posting}
          rows={compact ? 1 : 2}
          className={`w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white resize-none placeholder-gray-400 dark:placeholder-gray-500 transition-colors ${compact ? 'py-2' : ''}`}
        />
        <div className="flex items-center justify-between">
          <span className={`text-xs text-gray-400 dark:text-gray-500 ${compact ? 'hidden' : ''}`}>
            Ctrl+Enter to post
          </span>
          <div className="flex gap-2 ml-auto">
            {onCancel && (
              <button
                onClick={onCancel}
                disabled={posting}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={!user || !text.trim() || posting}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition-colors shadow-sm shadow-blue-600/20"
            >
              <Send className="w-3.5 h-3.5" />
              {posting ? 'Posting…' : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
