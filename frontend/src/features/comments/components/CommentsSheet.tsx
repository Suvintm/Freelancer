import React, { useState } from 'react';
import { useComments } from '../../../queries/commentQueries';
import { CommentItem } from './CommentItem';
import { CommentInput } from './CommentInput';
import type { Comment } from '../../../queries/commentQueries';
import { Loader2, MessageSquareOff } from 'lucide-react';

interface CommentsSheetProps {
  entityType: 'POST' | 'REEL' | 'YOUTUBE_POST';
  entityId: string;
}

export const CommentsSheet: React.FC<CommentsSheetProps> = ({ entityType, entityId }) => {
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);
  
  const { 
    data, 
    isLoading, 
    isError, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useComments(entityType, entityId);

  const handleReplyClick = (comment: Comment) => {
    // If it's a top level comment, we reply to it directly.
    // If it's a nested reply, the item passes up its own ID, but since our backend is 1-level deep,
    // we should actually set the parentId to the top-level comment's ID.
    // Assuming `parentId` is available, if not, fallback to comment.id
    const targetId = comment.id; // For 1-level nesting, we ideally need the parentId if this is already a reply.
    // However, our CommentItem component passes the top level comment if clicked from top level.
    // If clicked from a reply, it passes the reply.
    // To strictly enforce 1-level deep nesting, if the comment has a parentId, use that.
    const resolvedParentId = (comment as any).parentId || comment.id;
    
    setReplyingTo({
      id: resolvedParentId,
      username: comment.user.username
    });
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black overflow-hidden relative">
      
      {/* Comments List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : isError ? (
          <div className="flex justify-center items-center h-40 text-sm text-red-500">
            Failed to load comments.
          </div>
        ) : data?.pages[0]?.data.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-60 text-gray-500">
            <MessageSquareOff className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">No comments yet.</p>
            <p className="text-xs mt-1">Start the conversation.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 pb-6">
            {data?.pages.map((page) => (
              <React.Fragment key={page.nextCursor || 'last'}>
                {page.data.map((comment) => (
                  <CommentItem 
                    key={comment.id} 
                    comment={comment} 
                    onReplyClick={handleReplyClick}
                  />
                ))}
              </React.Fragment>
            ))}
            
            {hasNextPage && (
              <div className="flex justify-center mt-4">
                <button 
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex justify-center items-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  {isFetchingNextPage ? (
                    <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                  ) : (
                    <span className="text-gray-500 text-lg leading-none">+</span>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Area */}
      <CommentInput 
        entityType={entityType} 
        entityId={entityId} 
        replyingTo={replyingTo}
        onCancelReply={handleCancelReply}
      />
    </div>
  );
};
