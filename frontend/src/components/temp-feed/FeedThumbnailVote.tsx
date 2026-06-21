import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreHorizontal, Heart, MessageCircle, Share2, Bookmark, CheckCircle2 } from 'lucide-react';
import defaultProfile from '../../assets/defaultprofile.png';

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
}

export function FeedThumbnailVote({ post, isDarkMode }: { post: Post; isDarkMode: boolean }) {
  const [votedIndex, setVotedIndex] = useState<number | null>(null);

  const isDynamicPost = typeof post.id === 'string';
  const avatarSrc = isDynamicPost ? defaultProfile : post.img;

  const images = post.images && post.images.length >= 2 ? post.images.slice(0, 4) : [post.img, post.img];
  const numImages = images.length;

  // Mock vote counts for realistic UI
  const [mockVotes, setMockVotes] = useState<number[]>(() => {
    return images.map(() => Math.floor(Math.random() * 500) + 50);
  });

  const handleVote = (index: number) => {
    if (votedIndex !== null) return;
    setVotedIndex(index);
    setMockVotes(prev => {
      const newVotes = [...prev];
      newVotes[index] += 1;
      return newVotes;
    });
  };

  const totalVotes = mockVotes.reduce((a, b) => a + b, 0);

  // Determine grid layout based on number of images
  const gridClass = 
    numImages === 2 ? 'grid-cols-1 grid-rows-2' :
    numImages === 3 ? 'grid-cols-1 grid-rows-3' :
    'grid-cols-2 grid-rows-2';

  return (
    <motion.article 
      className={`lg:border lg:border-border-main lg:rounded-[40px] overflow-hidden group lg:shadow-xl mb-6 lg:mb-0 pb-4 lg:pb-0 relative ${
        isDarkMode ? 'bg-black lg:bg-[#0a0a0a]' : 'bg-white shadow-sm lg:shadow-2xl'
      }`}
    >
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full border-2 border-border-main p-0.5">
            <img src={avatarSrc} alt={post.user} className="w-full h-full rounded-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <h4 className="text-[13px] font-semibold text-text-main leading-none">{post.user}</h4>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                Thumbnail Vote
              </span>
            </div>
            <p className="text-[10px] text-text-muted font-medium">{post.location}</p>
          </div>
        </div>
        <button className={`p-2 transition-colors ${isDarkMode ? 'text-white hover:text-zinc-300' : 'text-zinc-950 hover:text-zinc-600'}`}>
          <MoreHorizontal size={18} />
        </button>
      </div>

      <div className="px-4 pb-3">
        <p className="text-[14px] text-text-main font-medium leading-relaxed">
          {post.comment || "Help me choose the best thumbnail for my next video! 👇"}
        </p>
      </div>

      <div className={`w-full relative overflow-hidden bg-black grid gap-1 ${gridClass}`}>
        {images.map((img, idx) => {
          const percentage = totalVotes === 0 ? 0 : Math.round((mockVotes[idx] / totalVotes) * 100);
          const isWinner = votedIndex !== null && mockVotes[idx] === Math.max(...mockVotes);
          
          return (
            <div 
              key={idx} 
              className="relative w-full aspect-video bg-zinc-900 cursor-pointer overflow-hidden"
              onClick={() => handleVote(idx)}
            >
              <img 
                src={img} 
                alt={`Thumbnail option ${idx + 1}`} 
                className={`w-full h-full object-cover transition-transform duration-500 ${votedIndex === null ? 'hover:scale-105' : ''}`} 
              />
              
              {/* Vote Overlay */}
              <AnimatePresence>
                {votedIndex !== null && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center"
                  >
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.1 }}
                      className="text-white text-3xl font-black mb-1 drop-shadow-lg"
                    >
                      {percentage}%
                    </motion.div>
                    
                    {votedIndex === idx && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center gap-1.5 text-green-400 font-bold text-[12px] bg-green-400/20 px-3 py-1 rounded-full border border-green-400/30"
                      >
                        <CheckCircle2 size={14} /> You Voted
                      </motion.div>
                    )}

                    {isWinner && votedIndex !== idx && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-blue-400 font-bold text-[12px] bg-blue-400/20 px-3 py-1 rounded-full border border-blue-400/30 mt-2"
                      >
                        Winning
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <div className="p-4 lg:p-6 space-y-4">
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
                {post.likedByAvatars.map((avatar, idx) => (
                  <img key={idx} src={avatar} alt="Liked by" className={`w-[22px] h-[22px] rounded-full border-[1.5px] object-cover ${isDarkMode ? 'border-black' : 'border-white'}`} style={{ zIndex: 3 - idx }} />
                ))}
              </div>
            )}
            <p className="text-[13px] text-text-main font-medium">
              <span className="font-semibold">{votedIndex !== null ? totalVotes : totalVotes - 1}</span> votes • Liked by <span className="font-semibold">Jane</span> and <span className="font-semibold">{typeof post.likes === 'number' ? post.likes.toLocaleString() : post.likes} others</span>
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
