import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreHorizontal, Heart, Send, CheckCircle2 } from 'lucide-react';
import defaultProfile from '../../assets/defaultprofile.png';
import { api } from '../../api/client';

interface PollOption {
  id: string;
  text: string;
  order_index: number;
  _count?: {
    responses: number;
  };
}

interface PollResponse {
  id: string;
  pollId: string;
  userId: string;
  optionId?: string;
  text_response?: string;
}

interface Poll {
  id: string;
  question: string;
  type?: 'MULTIPLE_CHOICE' | 'OPEN_ENDED';
  show_response_count?: boolean;
  totalVotes?: number;
  hasVoted?: boolean;
  userResponse?: PollResponse;
  options?: PollOption[];
}

interface Profile {
  name?: string;
  profile_picture?: string;
}

interface User {
  username?: string;
  profile?: Profile;
}

interface Post {
  id: string;
  user?: User;
  like_count?: number;
  isLiked?: boolean;
  poll?: Poll;
}

export function FeedPoll({ post, isDarkMode }: { post: Post, isDarkMode: boolean }) {
  const resolveImg = (url: string | null | undefined) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5051';
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${apiBase}${cleanUrl}`;
  };

  // Extract poll data
  const poll = post.poll || ({} as Poll);
  const isMultipleChoice = poll.type === 'MULTIPLE_CHOICE' || !poll.type;
  
  // State for interaction
  const [selectedOption, setSelectedOption] = useState<number | null>(() => {
    if (poll.userResponse?.optionId) {
      return poll.options?.findIndex((o: PollOption) => o.id === poll.userResponse?.optionId) ?? null;
    }
    return null;
  });
  const [textResponse, setTextResponse] = useState(poll.userResponse?.text_response || '');
  const [hasVoted, setHasVoted] = useState(poll.hasVoted || false);
  const [localCounts, setLocalCounts] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Likes states
  const [localLiked, setLocalLiked] = useState(post.isLiked || false);
  const [localLikesCount, setLocalLikesCount] = useState(post.like_count || 0);
  const [showHeartPop, setShowHeartPop] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  
  const totalVotes = poll.totalVotes || 0;

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    const nextLiked = !localLiked;
    setLocalLiked(nextLiked);
    setLocalLikesCount(prev => Math.max(0, prev + (nextLiked ? 1 : -1)));
    
    if (nextLiked) {
      setShowHeartPop(true);
      setTimeout(() => setShowHeartPop(false), 800);
    }
    
    try {
      await api.post(`/polls/${post.id}/like`);
    } catch (err) {
      console.error("Failed to toggle like:", err);
      setLocalLiked(!nextLiked);
      setLocalLikesCount(prev => Math.max(0, prev - (nextLiked ? 1 : -1)));
    } finally {
      setIsLiking(false);
    }
  };

  const handleVote = async (optId: string, index: number) => {
    if (hasVoted || isSubmitting) return;
    setIsSubmitting(true);
    setSelectedOption(index);
    setHasVoted(true);
    setLocalCounts(prev => ({ ...prev, [optId]: (prev[optId] || 0) + 1 }));
    
    try {
      await api.post(`/polls/${poll.id}/respond`, { optionId: optId });
    } catch (err) {
      console.error("Failed to submit vote:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendText = async () => {
    if (!textResponse.trim() || hasVoted || isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      await api.post(`/polls/${poll.id}/respond`, { textResponse });
      setHasVoted(true);
    } catch (err) {
      console.error("Failed to submit response:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.article 
      onDoubleClick={handleLike}
      className={`lg:border lg:rounded-[40px] overflow-hidden group lg:shadow-xl mb-6 lg:mb-0 relative ${
        isDarkMode ? 'bg-black border-zinc-800/50' : 'bg-white border-zinc-200 shadow-sm'
      }`}
    >
      {/* Instagram Big Heart Pop Overlay */}
      <AnimatePresence>
        {showHeartPop && (
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.3, 0.9, 1], opacity: [0, 1, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
          >
            <Heart size={90} fill="#ef4444" stroke="#ef4444" className="drop-shadow-2xl" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full border-2 p-0.5 ${isDarkMode ? 'border-white' : 'border-zinc-900'}`}>
            <img 
              src={resolveImg(post.user?.profile?.profile_picture) || defaultProfile} 
              alt={post.user?.username || 'Creator'} 
              className="w-full h-full rounded-full object-cover" 
            />
          </div>
          <div>
            <h4 className={`text-[14px] font-bold leading-none mb-1 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
              {post.user?.profile?.name || post.user?.username || 'Creator'}
            </h4>
            <p className="text-[11px] font-medium text-zinc-500">Ask the Community • 2h ago</p>
          </div>
        </div>
        <button className={`p-2 transition-colors ${isDarkMode ? 'text-white hover:text-zinc-300' : 'text-zinc-950 hover:text-zinc-600'}`}>
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* Poll Content Container */}
      <div className={`px-5 py-2 ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
        <h3 className={`text-[17px] font-black tracking-tight leading-snug mb-5 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
          {poll.question || "What should my next video be?"}
        </h3>

        {isMultipleChoice ? (
          <div className="space-y-3">
            {(poll.options || []).map((opt: PollOption, index: number) => {
              const baseCount = opt._count?.responses || 0;
              const addedCount = localCounts[opt.id] || 0;
              const optCount = baseCount + addedCount;
              const displayTotal = totalVotes + Object.values(localCounts).reduce((a,b)=>a+b, 0);
              
              const percentage = displayTotal > 0 ? Math.round((optCount / displayTotal) * 100) : 0;
              
              const isSelected = selectedOption === index;
              const showResults = hasVoted || poll.show_response_count === false;

              return (
                <button
                  key={index}
                  onClick={() => handleVote(opt.id, index)}
                  disabled={hasVoted}
                  className="relative w-full overflow-hidden rounded-2xl group transition-all duration-300 active:scale-[0.99] disabled:opacity-100 disabled:cursor-default"
                >
                  {/* Background Track */}
                  <div className={`absolute inset-0 border-2 transition-colors duration-300 ${
                    isSelected 
                      ? (isDarkMode ? 'border-white bg-zinc-900' : 'border-zinc-900 bg-zinc-100')
                      : (isDarkMode ? 'border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800' : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100')
                  } rounded-2xl`} />

                  {/* Animated Progress Fill */}
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: showResults ? `${percentage}%` : '0%' }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`absolute inset-y-0 left-0 ${isSelected ? (isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200') : (isDarkMode ? 'bg-zinc-900' : 'bg-zinc-100')} rounded-2xl`}
                  />

                  {/* Content */}
                  <div className="relative z-10 flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isSelected 
                          ? (isDarkMode ? 'border-white bg-white text-black' : 'border-zinc-900 bg-zinc-900 text-white')
                          : (isDarkMode ? 'border-zinc-700 bg-transparent' : 'border-zinc-300 bg-transparent')
                      }`}>
                        {isSelected && <CheckCircle2 size={12} strokeWidth={4} />}
                      </div>
                      <span className={`text-[14px] font-bold ${isSelected ? (isDarkMode ? 'text-white' : 'text-zinc-900') : (isDarkMode ? 'text-zinc-400' : 'text-zinc-600')}`}>
                        {opt.text}
                      </span>
                    </div>
                    
                    {showResults && (poll.show_response_count !== false) && (
                      <motion.span 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`text-[13px] font-black ${isSelected ? (isDarkMode ? 'text-white' : 'text-zinc-900') : 'text-zinc-500'}`}
                      >
                        {percentage}%
                      </motion.span>
                    )}
                  </div>
                </button>
              );
            })}
            
            {(poll.show_response_count !== false) && (
              <p className="text-[11px] font-semibold text-zinc-500 px-1 pt-2">
                {(totalVotes + Object.values(localCounts).reduce((a,b)=>a+b, 0)).toLocaleString()} votes
              </p>
            )}
          </div>
        ) : (
          /* Open Ended Q&A */
          <div className="space-y-4">
            <div className={`relative rounded-2xl overflow-hidden border-2 ${isDarkMode ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-zinc-50'}`}>
              <textarea
                value={textResponse}
                onChange={(e) => setTextResponse(e.target.value)}
                placeholder="Type your suggestion..."
                className={`w-full min-h-[100px] p-4 text-[14px] font-medium resize-none outline-none bg-transparent ${isDarkMode ? 'text-white placeholder-zinc-500' : 'text-zinc-900 placeholder-zinc-400'}`}
              />
              <div className="absolute bottom-2 right-2 flex items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-500">{textResponse.length}/250</span>
                <button 
                  onClick={handleSendText}
                  disabled={!textResponse.trim() || hasVoted}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    textResponse.trim() && !hasVoted
                      ? (isDarkMode ? 'bg-white text-black hover:bg-zinc-200' : 'bg-zinc-900 text-white hover:bg-zinc-800') 
                      : (isDarkMode ? 'bg-zinc-800 text-zinc-600' : 'bg-zinc-200 text-zinc-400')
                  }`}
                >
                  <Send size={16} strokeWidth={2.5} className={textResponse.trim() && !hasVoted ? '-translate-x-[1px] -translate-y-[1px]' : ''} />
                </button>
              </div>
            </div>
            {hasVoted && (
              <motion.p 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-[12px] font-bold text-center ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}
              >
                Thanks for your response!
              </motion.p>
            )}
          </div>
        )}
      </div>

      {/* Engagement Footer */}
      <div className={`p-4 flex items-center justify-between border-t ${isDarkMode ? 'border-zinc-800/50' : 'border-zinc-100'}`}>
        <div className="flex items-center gap-6">
          <button 
            onClick={handleLike}
            className="flex flex-col items-center gap-1 group relative outline-none"
          >
            <motion.div
              whileTap={{ scale: 1.4 }}
              animate={{ scale: localLiked ? [1, 1.25, 1] : 1 }}
              transition={{ duration: 0.3 }}
            >
              <Heart 
                size={22} 
                fill={localLiked ? "#ef4444" : "none"}
                className={`transition-colors ${
                  localLiked 
                    ? 'text-red-500' 
                    : (isDarkMode ? 'text-white group-hover:text-zinc-300' : 'text-zinc-900 group-hover:text-zinc-500')
                }`} 
              />
            </motion.div>
            <span className="text-[10px] font-bold text-zinc-500">
              {localLikesCount > 0 ? localLikesCount.toLocaleString() : 'Like'}
            </span>
          </button>
        </div>
      </div>
    </motion.article>
  );
}
