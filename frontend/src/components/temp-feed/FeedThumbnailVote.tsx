import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreHorizontal, Heart, MessageCircle, Share2, Bookmark, CheckCircle2 } from 'lucide-react';
import defaultProfile from '../../assets/defaultprofile.png';
import { api } from '../../api/client';

interface Post {
  id: string | number;
  user: string;
  location: string;
  img: string; // The first thumbnail is used as fallback or main
  images?: string[]; // Array of 2-4 thumbnails
  likes: string | number;
  comment: string;
  commentsCount: number;
  type?: string;
  tags?: string[];
  likedByAvatars?: string[];
  votes?: number[];
}

export function FeedThumbnailVote({ post, isDarkMode }: { post: Post; isDarkMode: boolean }) {
  // Check if user voted previously from localStorage
  const localStorageKey = `voted_thumb_${post.id}`;
  const [votedIndex, setVotedIndex] = useState<number | null>(() => {
    const saved = localStorage.getItem(localStorageKey);
    return saved !== null ? parseInt(saved, 10) : null;
  });
  
  // Track the previous choice when changing a vote
  const [tempPreviousIndex, setTempPreviousIndex] = useState<number | null>(null);

  const isDynamicPost = typeof post.id === 'string';
  const avatarSrc = isDynamicPost ? defaultProfile : post.img;

  const images = post.images && post.images.length >= 2 ? post.images.slice(0, 4) : [post.img, post.img];
  const numImages = images.length;

  // Actual votes state, fall back to initializing 0s or randomized fallback if not provided
  const [votesCount, setVotesCount] = useState<number[]>(() => {
    if (post.votes && post.votes.length === images.length) {
      return [...post.votes];
    }
    // Mock votes fallback
    return images.map(() => 0);
  });

  // Keep track of the last seen post.votes prop to detect changes and sync state during render
  const [prevVotes, setPrevVotes] = useState<number[] | undefined>(post.votes);
  if (post.votes !== prevVotes) {
    setPrevVotes(post.votes);
    setVotesCount(post.votes && post.votes.length === images.length ? [...post.votes] : images.map(() => 0));
  }

  const handleVote = async (index: number) => {
    if (votedIndex !== null) return;
    setVotedIndex(index);
    localStorage.setItem(localStorageKey, index.toString());

    // Update state locally
    setVotesCount(prev => {
      const newVotes = [...prev];
      if (tempPreviousIndex !== null && tempPreviousIndex >= 0 && tempPreviousIndex < newVotes.length) {
        if (newVotes[tempPreviousIndex] > 0) {
          newVotes[tempPreviousIndex] -= 1;
        }
      }
      newVotes[index] += 1;
      return newVotes;
    });

    // Save to server if it's a backend dynamic post
    if (isDynamicPost && !post.id.toString().startsWith('mock')) {
      try {
        await api.post(`/temp-feed/${post.id}/vote`, { 
          imageIndex: index,
          previousImageIndex: tempPreviousIndex !== null ? tempPreviousIndex : undefined
        });
      } catch (err) {
        console.error('Error saving vote to backend:', err);
      }
    }

    setTempPreviousIndex(null);
  };

  const totalVotes = votesCount.reduce((a, b) => a + b, 0);

  // We render the thumbnails in a grid.
  // We want to design it properly where each thumbnail is like an item card inside the post.
  // Under each image container, we place an Instagram style button to vote.
  const gridClass = 
    numImages === 2 ? 'grid-cols-2' :
    numImages === 3 ? 'grid-cols-3' :
    'grid-cols-2'; // 4 options = 2x2 grid

  return (
    <motion.article 
      className={`lg:border lg:border-border-main lg:rounded-[40px] overflow-hidden group lg:shadow-xl mb-6 lg:mb-0 pb-4 lg:pb-0 relative ${
        isDarkMode ? 'bg-black lg:bg-[#0a0a0a]' : 'bg-white shadow-sm lg:shadow-2xl'
      }`}
    >
      {/* Post Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full border-2 border-border-main p-0.5">
            <img src={avatarSrc} alt={post.user} className="w-full h-full rounded-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <h4 className="text-[13px] font-semibold text-text-main leading-none">{post.user}</h4>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
                Thumbnail Poll
              </span>
            </div>
            <p className="text-[10px] text-text-muted font-medium">{post.location}</p>
          </div>
        </div>
        <button className={`p-2 transition-colors ${isDarkMode ? 'text-white hover:text-zinc-300' : 'text-zinc-950 hover:text-zinc-600'}`}>
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* Post Caption */}
      <div className="px-4 pb-3">
        <p className="text-[14px] text-text-main font-semibold leading-relaxed">
          {post.comment || "Help me choose the best thumbnail for my next video! 👇"}
        </p>
      </div>

      {/* Thumbnails Options Grid */}
      <div className={`px-4 pb-3 grid gap-3 ${gridClass}`}>
        {images.map((img, idx) => {
          const voteCount = votesCount[idx] || 0;
          const percentage = totalVotes === 0 ? 0 : Math.round((voteCount / totalVotes) * 100);
          const isWinner = votedIndex !== null && voteCount === Math.max(...votesCount) && totalVotes > 0;
          
          return (
            <div 
              key={idx} 
              className={`border rounded-2xl overflow-hidden flex flex-col transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700' 
                  : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300 shadow-sm'
              }`}
            >
              {/* Image Container with No. Tag */}
              <div className="relative w-full aspect-video bg-zinc-900 overflow-hidden group/img">
                <img 
                  src={img} 
                  alt={`Thumbnail Option ${idx + 1}`} 
                  className={`w-full h-full object-cover transition-transform duration-500 ${votedIndex === null ? 'group-hover/img:scale-105' : ''}`} 
                />
                
                {/* No tag at the top small */}
                <div className="absolute top-2 left-2 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded-md text-[9px] font-black text-white uppercase tracking-widest border border-white/10 shadow-md">
                  No. {idx + 1}
                </div>

                {/* Vote overlay (results) if user has voted */}
                <AnimatePresence>
                  {votedIndex !== null && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex flex-col items-center justify-center p-1"
                    >
                      <motion.div 
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="text-white text-2xl font-black drop-shadow-md"
                      >
                        {percentage}%
                      </motion.div>
                      <span className="text-[10px] text-zinc-300 font-medium">{voteCount} votes</span>
                      
                      {isWinner && (
                        <div className="absolute top-2 right-2 bg-yellow-500 text-black text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow">
                          Winner
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Card Bottom / Vote Action */}
              <div className="p-3 flex flex-col items-center justify-center min-h-[48px]">
                {votedIndex === null ? (
                  <button
                    onClick={() => handleVote(idx)}
                    className={`w-full py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-200 active:scale-[0.97] ${
                      isDarkMode 
                        ? 'bg-zinc-800 hover:bg-zinc-700 text-white hover:text-white border border-zinc-700' 
                        : 'bg-zinc-200 hover:bg-zinc-300 text-zinc-900 border border-zinc-300'
                    }`}
                  >
                    Vote Option {idx + 1}
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    {votedIndex === idx ? (
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1.5 text-green-500 font-extrabold text-[11px] bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                          <CheckCircle2 size={12} /> Voted
                        </span>
                        <button
                          onClick={() => {
                            setTempPreviousIndex(votedIndex);
                            setVotedIndex(null);
                          }}
                          className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded transition-all border ${
                            isDarkMode 
                              ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white' 
                              : 'bg-zinc-100 border-zinc-300 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-950'
                          }`}
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-text-muted font-bold">
                        Option {idx + 1}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Post Actions & Likes/Comments Info */}
      <div className="p-4 lg:p-6 pt-2 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button className={`transition-colors transform active:scale-90 hover:text-rose-500 ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}><Heart size={24} /></button>
            <button className={`transition-colors transform active:scale-90 ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}><MessageCircle size={24} /></button>
            <button className={`transition-colors transform active:scale-90 ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}><Share2 size={24} /></button>
          </div>
          <button className={`transition-colors transform active:scale-90 ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}><Bookmark size={24} /></button>
        </div>

        <div className="space-y-2">
          {/* Liked By Section */}
          <div className="flex items-center gap-2">
            {post.likedByAvatars && post.likedByAvatars.length > 0 && (
              <div className="flex -space-x-1.5">
                {post.likedByAvatars.slice(0, 3).map((avatar, idx) => (
                  <img key={idx} src={avatar} alt="Liked by" className={`w-[22px] h-[22px] rounded-full border-[1.5px] object-cover ${isDarkMode ? 'border-black' : 'border-white'}`} style={{ zIndex: 3 - idx }} />
                ))}
              </div>
            )}
            <p className="text-[13px] text-text-main font-medium">
              <span className="font-semibold">{totalVotes}</span> votes • Liked by <span className="font-semibold">Jane</span> and <span className="font-semibold">{typeof post.likes === 'number' ? post.likes.toLocaleString() : post.likes} others</span>
            </p>
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {post.tags.map((tag, idx) => (
                <span key={idx} className="text-[12px] font-medium text-blue-500 hover:text-blue-600 transition-colors cursor-pointer">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <button className="text-[12px] text-text-muted font-medium mt-2 opacity-60 hover:opacity-100 transition-opacity">View all {post.commentsCount} comments</button>
        </div>
      </div>
    </motion.article>
  );
}
