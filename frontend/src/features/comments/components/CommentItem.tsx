import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MoreHorizontal } from 'lucide-react';
import { useToggleCommentLike } from '../../../mutations/commentMutations';
import { useReplies } from '../../../queries/commentQueries';
import type { Comment } from '../../../queries/commentQueries';

interface CommentItemProps {
  comment: Comment;
  onReplyClick: (comment: Comment) => void;
  isReply?: boolean;
}

export const CommentItem: React.FC<CommentItemProps> = ({ 
  comment, 
  onReplyClick,
  isReply = false 
}) => {
  const [showReplies, setShowReplies] = useState(false);
  const toggleLike = useToggleCommentLike();
  
  // Optimistic local state for likes could be implemented here, 
  // but relying on query invalidation for simplicity currently.

  const handleLike = () => {
    toggleLike.mutate({ commentId: comment.id });
  };

  const { data: repliesData, fetchNextPage, hasNextPage, isFetchingNextPage } = useReplies(comment.id);

  const profilePic = comment.user?.profile?.profile_picture || `https://ui-avatars.com/api/?name=${comment.user?.username}&background=random`;

  return (
    <div className={`flex gap-3 ${isReply ? 'ml-8 mt-2' : 'mt-4'} w-full`}>
      <img 
        src={profilePic} 
        alt={comment.user?.username} 
        className={`${isReply ? 'w-7 h-7' : 'w-9 h-9'} rounded-full object-cover shrink-0`}
      />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                {comment.user?.username}
              </span>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, includeSeconds: false }).replace('about ', '')}
              </span>
            </div>
            
            <p className="text-sm text-gray-800 dark:text-gray-200 mt-0.5 break-words whitespace-pre-wrap">
              {comment.content}
            </p>
          </div>
          
          <button 
            onClick={handleLike}
            className="flex flex-col items-center gap-1 shrink-0 px-2 py-1 mt-1 group"
          >
            <Heart 
              className={`w-4 h-4 transition-colors ${toggleLike.isPending ? 'opacity-50' : ''}`}
            />
            {comment.like_count > 0 && (
              <span className="text-[10px] text-gray-500">{comment.like_count}</span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-4 mt-2">
          {!isReply && (
            <button 
              onClick={() => onReplyClick(comment)}
              className="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Reply
            </button>
          )}
          
          <button className="text-gray-400 hover:text-gray-600">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* View Replies Toggle */}
        {!isReply && comment.reply_count > 0 && (
          <div className="mt-2">
            <button 
              onClick={() => setShowReplies(!showReplies)}
              className="flex items-center gap-2 text-xs font-semibold text-blue-500 hover:text-blue-600"
            >
              <div className="w-6 h-[1px] bg-blue-500"></div>
              {showReplies ? 'Hide replies' : `View replies (${comment.reply_count})`}
            </button>

            {/* Render Replies */}
            {showReplies && (
              <div className="mt-2 flex flex-col gap-1">
                {repliesData?.pages.map((page) => (
                  <React.Fragment key={page.nextCursor || 'last'}>
                    {page.data.map((reply) => (
                      <CommentItem 
                        key={reply.id} 
                        comment={reply} 
                        onReplyClick={onReplyClick} // Replies to replies just reply to the parent
                        isReply={true}
                      />
                    ))}
                  </React.Fragment>
                ))}
                
                {hasNextPage && (
                  <button 
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="text-xs font-semibold text-blue-500 hover:text-blue-600 ml-8 mt-2"
                  >
                    {isFetchingNextPage ? 'Loading...' : 'View more replies'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
