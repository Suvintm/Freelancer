import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { MoreHorizontal, Heart, Send, CheckCircle2, MessageSquare, Image as ImageIcon, Smile, Lightbulb, Bookmark, Share2 } from 'lucide-react';
import defaultProfile from '../../assets/defaultprofile.png';
import ytBadge from '../../assets/verifiedbadges/yt_badge.png';
import { useLottie } from 'lottie-react';
import successLottieData from '../../assets/success_lottie.json';
import { api } from '../../api/client';
import { BarChartLayout, DonutChartLayout, GridCardsLayout, ImageCarouselLayout } from './PollLayouts';

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
  layout?: 'STANDARD' | 'BAR_CHART' | 'DONUT_CHART' | 'GRID_CARDS' | 'IMAGE_CAROUSEL';
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

  const poll = post.poll || ({} as Poll);
  const isMultipleChoice = poll.type === 'MULTIPLE_CHOICE' || !poll.type;
  
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
  
  const [localLiked, setLocalLiked] = useState(post.isLiked || false);
  const [localLikesCount, setLocalLikesCount] = useState(post.like_count || 0);
  const [showHeartPop, setShowHeartPop] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  
  const totalVotes = poll.totalVotes || 0;
  const lottieContainerRef = useRef(null);
  const isInView = useInView(lottieContainerRef, { margin: "-20%" });
  const { View: LottieView, play, pause } = useLottie({
    animationData: successLottieData,
    loop: true,
    autoplay: false,
  });

  useEffect(() => {
    if (hasVoted) {
      if (isInView) {
        play();
      } else {
        pause();
      }
    }
  }, [isInView, hasVoted, play, pause]);



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

  const handleSendText = async (customText?: string) => {
    const textToSend = customText || textResponse;
    if (!textToSend.trim() || hasVoted || isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      await api.post(`/polls/${poll.id}/respond`, { textResponse: textToSend });
      if (customText) setTextResponse(customText);
      setHasVoted(true);
    } catch (err) {
      console.error("Failed to submit response:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- OPEN ENDED UI ---
  if (!isMultipleChoice) {
    return (
      <motion.article 
        className={`w-[calc(100%-24px)] max-w-[600px] mx-auto border overflow-hidden group shadow-2xl rounded-3xl ${
          isDarkMode ? 'bg-black border-zinc-900' : 'bg-white border-zinc-200'
        }`}
      >
        {/* Author Header */}
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img 
                src={resolveImg(post.user?.profile?.profile_picture) || defaultProfile} 
                alt={post.user?.username || 'Creator'} 
                className={`w-11 h-11 rounded-full object-cover border-[2px] ${isDarkMode ? 'border-[#333]' : 'border-[#ccc]'}`} 
              />
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-[2px]">
                <CheckCircle2 size={12} fill="#000" className="text-white" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className={`text-[13px] font-bold leading-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  {post.user?.profile?.name || post.user?.username || 'Creator'}
                </h4>
                {/* Red verified badge if they have Youtube connected or are a creator */}
                <img src={ytBadge} alt="Verified Creator" className="w-[14px] h-[14px] object-contain" />
              </div>
              <p className={`text-[12px] font-medium leading-tight ${isDarkMode ? 'text-[#888]' : 'text-[#666]'}`}>Content Creator</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`text-[11px] font-medium ${isDarkMode ? 'text-[#888]' : 'text-[#666]'}`}>2h ago</span>
                <span className={`text-[11px] font-medium ${isDarkMode ? 'text-[#888]' : 'text-[#666]'}`}>•</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isDarkMode ? 'bg-[#222] text-[#aaa]' : 'bg-[#e5e5e5] text-[#555]'}`}>
                  Open Question
                </span>
              </div>
            </div>
          </div>
          <button className={`p-2 transition-colors ${isDarkMode ? 'text-[#888] hover:text-white' : 'text-[#666] hover:text-black'}`}>
            <MoreHorizontal size={18} />
          </button>
        </div>

        {/* Main Question Card */}
        <div className="px-4 pb-2">
          <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800/50' : 'bg-zinc-50 border-zinc-200 shadow-sm'}`}>
            {/* Tagline */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'}`}>
                  <MessageSquare size={12} fill="currentColor" />
                </div>
                <span className={`text-[9px] font-bold tracking-widest ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>OPEN QUESTION</span>
                <div className={`flex-1 h-[1px] border-b border-dashed mx-2 ${isDarkMode ? 'border-zinc-700' : 'border-zinc-300'}`} />
              </div>
              <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'}`}>
                Your answer matters! ✨
              </span>
            </div>

            {/* Question */}
            <h3 className={`text-[15px] font-semibold leading-relaxed tracking-normal mb-4 font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}>
              {poll.question}
            </h3>

            {/* Bottom Actions */}
            <div className={`pt-4 border-t flex items-center justify-between ${isDarkMode ? 'border-[#222]' : 'border-[#eaeaea]'}`}>
              <div className={`flex items-center gap-2 text-[11px] font-medium ${isDarkMode ? 'text-[#888]' : 'text-[#666]'}`}>
                <MessageSquare size={14} />
                <span>{totalVotes} answers</span>
              </div>
              <div className="flex items-center gap-4">
                <button className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors ${isDarkMode ? 'text-[#888] hover:text-white' : 'text-[#666] hover:text-black'}`}>
                  <Bookmark size={14} /> Save
                </button>
                <button className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors ${isDarkMode ? 'text-[#888] hover:text-white' : 'text-[#666] hover:text-black'}`}>
                  <Share2 size={14} /> Share
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Input Card */}
        <div className="px-4 pb-4">
          <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800/50' : 'bg-zinc-50 border-zinc-200 shadow-sm'}`}>
            
            {hasVoted ? (
              <motion.div 
                ref={lottieContainerRef}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-5"
              >
                <div className="w-16 h-16 mb-2">
                  {LottieView}
                </div>
                <h4 className={`text-[13px] font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-black'}`}>Response Submitted</h4>
                <p className={`text-[10px] font-medium text-center max-w-[85%] ${isDarkMode ? 'text-[#888]' : 'text-[#666]'}`}>
                  Thank you for sharing your thoughts! The creator will review community responses.
                </p>
              </motion.div>
            ) : (
              <>
                {/* Input Row */}
                <div className="flex items-start gap-3 mb-4">
                  <img src={defaultProfile} alt="You" className={`w-7 h-7 rounded-full border ${isDarkMode ? 'border-[#333]' : 'border-[#ccc]'}`} />
                  <div className={`flex-1 rounded-xl border p-2 min-h-[48px] ${isDarkMode ? 'bg-black border-zinc-800' : 'bg-white border-zinc-200'}`}>
                    <textarea
                      value={textResponse}
                      onChange={(e) => setTextResponse(e.target.value.slice(0, 500))}
                      placeholder="Share your answer..."
                      disabled={hasVoted}
                      className={`w-full bg-transparent resize-none outline-none text-[12px] font-medium ${isDarkMode ? 'text-white placeholder-[#666]' : 'text-black placeholder-[#999]'}`}
                      rows={2}
                    />
                  </div>
                </div>

                {/* Input Actions */}
                <div className="flex items-center justify-between pl-10 mb-4">
                  <div className="flex items-center gap-2">
                    <button className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${isDarkMode ? 'bg-[#1a1a1a] text-[#888] hover:text-white' : 'bg-[#f0f0f0] text-[#666] hover:text-black'}`}>
                      <ImageIcon size={14} />
                    </button>
                    <button className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black transition-colors ${isDarkMode ? 'bg-[#1a1a1a] text-[#888] hover:text-white' : 'bg-[#f0f0f0] text-[#666] hover:text-black'}`}>
                      GIF
                    </button>
                    <button className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${isDarkMode ? 'bg-[#1a1a1a] text-[#888] hover:text-white' : 'bg-[#f0f0f0] text-[#666] hover:text-black'}`}>
                      <Smile size={14} />
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-[10px] font-medium ${isDarkMode ? 'text-[#666]' : 'text-[#999]'}`}>{textResponse.length}/500</span>
                    <button
                      onClick={() => handleSendText()}
                      disabled={!textResponse.trim() || hasVoted}
                      className={`px-4 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                        textResponse.trim() && !hasVoted
                          ? (isDarkMode ? 'bg-white text-black hover:bg-[#eee]' : 'bg-black text-white hover:bg-[#333]') 
                          : (isDarkMode ? 'bg-[#222] text-[#666]' : 'bg-[#e5e5e5] text-[#999]')
                      }`}
                    >
                      {hasVoted ? 'Sent!' : 'Post Answer'} <Send size={12} />
                    </button>
                  </div>
                </div>

                {/* Quick 3D Emoji Reactions */}
                {!hasVoted && (
                  <div className="pl-10 mb-4">
                    <div className="flex items-center gap-2">
                      {['🔥', '💯', '👏', '🤔', '💡'].map((emoji) => (
                        <button 
                          key={emoji}
                          onClick={() => handleSendText(emoji)}
                          className={`w-7 h-7 flex items-center justify-center text-lg rounded-full transition-transform hover:scale-110 active:scale-95 ${isDarkMode ? 'bg-[#1a1a1a]' : 'bg-[#f0f0f0]'}`}
                        >
                          {emoji}
                        </button>
                      ))}
                      <span className={`text-[10px] font-medium ml-2 ${isDarkMode ? 'text-[#666]' : 'text-[#999]'}`}>Quick React</span>
                    </div>
                  </div>
                )}

                {/* Guidelines Footer */}
                <div className={`pt-3 border-t flex items-center justify-between ${isDarkMode ? 'border-[#222]' : 'border-[#eaeaea]'}`}>
                  <div className={`flex items-center gap-2 text-[10px] font-medium leading-tight max-w-[70%] ${isDarkMode ? 'text-[#888]' : 'text-[#666]'}`}>
                    <Lightbulb size={12} className="shrink-0" />
                    Be kind and respectful. Help build a better community.
                  </div>
                  <button className={`text-[10px] font-bold hover:underline ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    Guidelines {'>'}
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      </motion.article>
    );
  }

  // --- MULTIPLE CHOICE UI (Original) ---
  return (
    <motion.article 
      onDoubleClick={handleLike}
      className={`w-[calc(100%-24px)] max-w-[600px] mx-auto lg:border lg:rounded-[40px] overflow-hidden rounded-3xl group lg:shadow-xl mb-6 lg:mb-0 relative ${
        isDarkMode ? 'bg-black border-zinc-800/50' : 'bg-white border-zinc-200 shadow-sm'
      }`}
    >
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
            <div className="flex items-center gap-1.5 mb-1">
              <h4 className={`text-[13px] font-bold leading-none ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                {post.user?.profile?.name || post.user?.username || 'Creator'}
              </h4>
              <img src={ytBadge} alt="Verified Creator" className="w-5 h-5 object-contain" />
            </div>
            <p className="text-[11px] font-medium text-zinc-500">Ask the Community • 2h ago</p>
          </div>
        </div>
        <button className={`p-2 transition-colors ${isDarkMode ? 'text-white hover:text-zinc-300' : 'text-zinc-950 hover:text-zinc-600'}`}>
          <MoreHorizontal size={18} />
        </button>
      </div>

      <div className={`px-5 py-2 ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
        <h3 className={`text-[17px] font-black tracking-tight leading-snug mb-5 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
          {poll.question || "What should my next video be?"}
        </h3>

        {(() => {
          const layoutProps = {
            options: poll.options || [],
            localCounts,
            totalVotes: totalVotes + Object.values(localCounts).reduce((a,b)=>a+b, 0),
            hasVoted,
            selectedOption,
            onVote: handleVote,
            isDarkMode,
            showResults: hasVoted || poll.show_response_count === false,
          };

          switch (poll.layout) {
            case 'BAR_CHART':
              return <BarChartLayout {...layoutProps} />;
            case 'DONUT_CHART':
              return <DonutChartLayout {...layoutProps} />;
            case 'GRID_CARDS':
              return <GridCardsLayout {...layoutProps} />;
            case 'IMAGE_CAROUSEL':
              return <ImageCarouselLayout {...layoutProps} />;
            case 'STANDARD':
            default:
              return (
                <div className="space-y-3 mt-4">
                  {(poll.options || []).map((opt: PollOption, index: number) => {
                    const baseCount = opt._count?.responses || 0;
                    const addedCount = localCounts[opt.id] || 0;
                    const optCount = baseCount + addedCount;
                    const displayTotal = layoutProps.totalVotes;
                    
                    const percentage = displayTotal > 0 ? Math.round((optCount / displayTotal) * 100) : 0;
                    
                    const isSelected = selectedOption === index;
                    const showResults = layoutProps.showResults;

                    return (
                      <button
                        key={index}
                        onClick={() => handleVote(opt.id, index)}
                        disabled={hasVoted}
                        className="relative w-full overflow-hidden rounded-2xl group transition-all duration-300 active:scale-[0.99] disabled:opacity-100 disabled:cursor-default"
                      >
                        <div className={`absolute inset-0 border-2 transition-colors duration-300 ${
                          isSelected 
                            ? (isDarkMode ? 'border-white bg-zinc-900' : 'border-zinc-900 bg-zinc-100')
                            : (isDarkMode ? 'border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800' : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100')
                        } rounded-2xl`} />

                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: showResults ? `${percentage}%` : '0%' }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className={`absolute inset-y-0 left-0 ${isSelected ? (isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200') : (isDarkMode ? 'bg-zinc-900' : 'bg-zinc-100')} rounded-2xl`}
                        />

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
                          
                          {showResults && (
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
                      {layoutProps.totalVotes.toLocaleString()} votes
                    </p>
                  )}
                </div>
              );
          }
        })()}
      </div>

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
