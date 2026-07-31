import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { ArrowLeft, MoreVertical, Image as ImageIcon, Link as LinkIcon, Send, Smile, Loader2, Info } from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectUser } from '../store/slices/authSlice';
import defaultProfile from '../assets/defaultprofile.png';
import { getSocket } from '../services/socketService';
import { VerifiedBadge } from '../components/ui/VerifiedBadge';

export default function CommunityRoom() {
  const { communityId } = useParams();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [messageText, setMessageText] = useState('');

  // Fetch Community details
  const { data: communityData, isLoading: isCommunityLoading } = useQuery({
    queryKey: ['community', communityId],
    queryFn: async () => {
      const res = await api.get(`/communities/${communityId}`);
      return res.data;
    },
    enabled: !!communityId,
  });

  // Fetch Posts/Messages
  const { data: postsData, isLoading: isPostsLoading } = useQuery({
    queryKey: ['community_posts', communityId],
    queryFn: async () => {
      const res = await api.get(`/communities/${communityId}/posts`);
      return res.data;
    },
    enabled: !!communityId,
  });

  const community = communityData?.data || communityData?.community;
  const posts = postsData?.posts || [];
  
  const isAdmin = community?.ownerId === user?.id;

  // Real-time socket setup
  useEffect(() => {
    const socket = getSocket();
    if (communityId && socket) {
      socket.emit('community:join', { communityId });
      
      const handleNewPost = (post: any) => {
        // Append new post to react-query cache
        queryClient.setQueryData(['community_posts', communityId], (oldData: any) => {
          if (!oldData) return { posts: [post] };
          // check if already exists
          if (oldData.posts.find((p: any) => p.id === post.id)) return oldData;
          return {
            ...oldData,
            posts: [...oldData.posts, post]
          };
        });
        scrollToBottom();
      };

      socket.on('community:post_created', handleNewPost);

      return () => {
        socket.off('community:post_created', handleNewPost);
        // Leave logic could go here if needed
      };
    }
  }, [communityId, queryClient]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Scroll to bottom on initial load
  useEffect(() => {
    if (posts.length > 0) {
      scrollToBottom();
    }
  }, [posts.length]);

  // Create Post mutation
  const createPostMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await api.post(`/communities/${communityId}/posts`, {
        content,
        type: 'NATIVE'
      });
      return res.data;
    },
    onSuccess: () => {
      setMessageText('');
      // Socket will broadcast it, but we can also refetch immediately
      // queryClient.invalidateQueries({ queryKey: ['community_posts', communityId] });
    }
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !isAdmin) return;
    createPostMutation.mutate(messageText.trim());
  };

  if (isCommunityLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-white/50" />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-white">
        <h2 className="text-xl font-bold mb-4">Community not found</h2>
        <button onClick={() => navigate('/community')} className="px-4 py-2 bg-white text-black rounded-xl font-bold">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-black text-white overflow-hidden rounded-lg sm:border sm:border-white/5">
      
      {/* ── HEADER ── */}
      <header className="flex items-center justify-between px-4 py-3 bg-[#0a0a0a] border-b border-white/5 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/community')}
            className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <img 
            src={community.thumbnail || defaultProfile} 
            alt={community.name} 
            className="w-10 h-10 rounded-full object-cover bg-zinc-800"
          />
          
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <h1 className="font-bold text-base leading-tight truncate max-w-[200px] sm:max-w-[300px]">
                {community.name}
              </h1>
              {community.ytProfile && (
                <VerifiedBadge isVerified={true} role="yt_influencer" className="w-4 h-4 shrink-0" />
              )}
            </div>
            <span className="text-xs text-zinc-400">
              {community.memberCount || 1} members
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <Info className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ── FEED (Message List) ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black">
        
        {/* Intro Message */}
        <div className="flex flex-col items-center justify-center py-10 text-center px-4">
          <div className="w-24 h-24 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center mb-4">
            <img src={community.thumbnail || defaultProfile} alt="" className="w-20 h-20 rounded-full object-cover" />
          </div>
          <h2 className="text-xl font-bold mb-2">Welcome to {community.name}</h2>
          <p className="text-sm text-zinc-400 max-w-sm">
            {community.description || 'This is the start of your broadcast channel.'}
          </p>
          <p className="text-xs text-zinc-500 mt-4 px-4 py-1.5 bg-white/5 rounded-full">
            Broadcast Channel • Only admins can send messages
          </p>
        </div>

        {/* Post Items */}
        {posts.map((post: any) => {
          const isMe = post.authorId === user?.id;
          
          return (
            <div key={post.id} className="flex flex-col mb-4">
              <div className={`flex items-end gap-2 max-w-[85%] sm:max-w-[70%] ${isMe ? 'self-end' : 'self-start'}`}>
                
                {/* Avatar (only show for others, but in a broadcast it's usually just the creator) */}
                {!isMe && (
                  <img 
                    src={post.author?.profile?.profile_picture || defaultProfile} 
                    alt="" 
                    className="w-8 h-8 rounded-full mb-1 object-cover shrink-0"
                  />
                )}
                
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {/* Name tag for incoming messages */}
                  {!isMe && (
                    <span className="text-[11px] font-medium text-zinc-400 ml-1 mb-1">
                      {post.author?.profile?.name || 'Admin'}
                    </span>
                  )}
                  
                  {/* Message Bubble */}
                  <div 
                    className={`px-4 py-2.5 text-[15px] leading-relaxed break-words shadow-sm ${
                      isMe 
                        ? 'bg-[#005c4b] text-white rounded-2xl rounded-br-sm' // WhatsApp style green
                        : 'bg-zinc-800/80 text-zinc-100 rounded-2xl rounded-bl-sm border border-white/5'
                    }`}
                  >
                    {post.content}
                    
                    {/* Fake Timestamp inside bubble for realism */}
                    <div className={`text-[10px] text-right mt-1 opacity-70 ${isMe ? 'text-[#87d2c3]' : 'text-zinc-400'}`}>
                      {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
        <div ref={messagesEndRef} />
      </div>

      {/* ── FOOTER / INPUT ── */}
      {isAdmin ? (
        <div className="p-3 bg-[#0a0a0a] shrink-0 pb-safe">
          <form 
            onSubmit={handleSend}
            className="flex items-center gap-2 bg-zinc-900 rounded-full px-2 py-1"
          >
            <button type="button" className="p-2 text-zinc-400 hover:text-white transition-colors">
              <Smile className="w-6 h-6" />
            </button>
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Broadcast a message..."
              className="flex-1 bg-transparent border-none focus:outline-none text-white text-[15px] placeholder-zinc-500 py-2.5"
            />
            <button type="button" className="p-2 text-zinc-400 hover:text-white transition-colors">
              <ImageIcon className="w-5 h-5" />
            </button>
            <button type="button" className="p-2 text-zinc-400 hover:text-white transition-colors">
              <LinkIcon className="w-5 h-5" />
            </button>
            
            <div className="w-[1px] h-6 bg-white/10 mx-1"></div>
            
            <button 
              type="submit"
              disabled={!messageText.trim() || createPostMutation.isPending}
              className={`p-2.5 rounded-full transition-all ${
                messageText.trim() 
                  ? 'bg-[#00a884] text-white hover:bg-[#008f6f] scale-100' // WhatsApp style green send button
                  : 'bg-zinc-800 text-zinc-500 scale-95'
              }`}
            >
              {createPostMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5 ml-0.5" />
              )}
            </button>
          </form>
        </div>
      ) : (
        <div className="p-4 bg-[#0a0a0a] shrink-0 text-center pb-safe">
          <p className="text-sm font-medium text-zinc-500">
            Only admins can send messages to this broadcast channel.
          </p>
        </div>
      )}
    </div>
  );
}
