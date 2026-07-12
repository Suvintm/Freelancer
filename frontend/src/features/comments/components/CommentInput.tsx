import React, { useState } from 'react';
import { useAddComment } from '../../../mutations/commentMutations';
import { Send, Loader2 } from 'lucide-react';

interface CommentInputProps {
  entityType: 'POST' | 'REEL' | 'YOUTUBE_POST';
  entityId: string;
  replyingTo?: { id: string; username: string } | null;
  onCancelReply?: () => void;
}

export const CommentInput: React.FC<CommentInputProps> = ({ 
  entityType, 
  entityId, 
  replyingTo,
  onCancelReply 
}) => {
  const [content, setContent] = useState('');
  const addComment = useAddComment();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    addComment.mutate({
      entityType,
      entityId,
      content: content.trim(),
      parentId: replyingTo?.id
    }, {
      onSuccess: () => {
        setContent('');
        if (onCancelReply) onCancelReply();
      }
    });
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-800 p-3 bg-white dark:bg-black sticky bottom-0 z-10 w-full">
      {replyingTo && (
        <div className="flex justify-between items-center text-xs text-gray-500 mb-2 px-2">
          <span>Replying to <strong>@{replyingTo.username}</strong></span>
          <button onClick={onCancelReply} className="font-semibold text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white">
            Cancel
          </button>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex items-center gap-2 relative">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
          className="flex-1 bg-gray-100 dark:bg-gray-900 text-sm rounded-full py-2.5 px-4 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all dark:text-white placeholder-gray-500"
          disabled={addComment.isPending}
        />
        <button 
          type="submit"
          disabled={!content.trim() || addComment.isPending}
          className={`p-2 rounded-full flex items-center justify-center transition-colors ${
            content.trim() && !addComment.isPending 
              ? 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30' 
              : 'text-gray-400'
          }`}
        >
          {addComment.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </form>
    </div>
  );
};
