import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectUser, selectToken } from '../store/slices/authSlice';
import { useTheme } from '../hooks/useTheme';
import { api } from '../api/client';
import defaultProfile from '../assets/defaultprofile.png';
import { Search, Send, Plus, MessageSquare, ArrowLeft, Loader2, UserCheck, X, Check, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';

interface Conversation {
  id: string;
  user: {
    id: string;
    name: string;
    username: string;
    profilePicture: string | null;
    primaryRole: string;
  };
  lastMessage: {
    id: string;
    content: string;
    type: string;
    isRead: boolean;
    senderId: string;
    receiverId: string;
    createdAt: string;
  };
  unreadCount: number;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

interface Contact {
  id: string;
  name: string;
  username: string;
  profilePicture: string | null;
  primaryRole: string;
}

export default function CommunicationHub() {
  const { isDarkMode } = useTheme();
  const user = useSelector(selectUser);
  const token = useSelector(selectToken);
  const [searchParams, setSearchParams] = useSearchParams();
  const targetUserId = searchParams.get('userId');

  // States
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [activeChat, setActiveChat] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isContactsOpen, setIsContactsOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  
  // Real-time typing states (senderId: boolean)
  const [typingStates, setTypingStates] = useState<Record<string, boolean>>({});
  const [isTyping, setIsTyping] = useState(false);
  
  // Loading states
  const [isLoadingConvs, setIsLoadingConvs] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Refs
  const messageEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const activeChatRef = useRef<Conversation | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep activeChatRef synced for socket listener closures
  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  // Fetch Conversations List
  const fetchConversations = async (silent = false) => {
    if (!silent) setIsLoadingConvs(true);
    try {
      const response = await api.get('/messages/conversations');
      if (response.data?.success) {
        setConversations(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      if (!silent) setIsLoadingConvs(false);
    }
  };

  // Fetch Message History
  const fetchMessageHistory = async (otherUserId: string, silent = false) => {
    if (!silent) setIsLoadingMessages(true);
    try {
      const response = await api.get(`/messages/history/${otherUserId}`);
      if (response.data?.success) {
        setMessages(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch message history:', err);
    } finally {
      if (!silent) setIsLoadingMessages(false);
    }
  };

  // Fetch Contacts
  const fetchContacts = async () => {
    setIsLoadingContacts(true);
    try {
      const response = await api.get('/messages/contacts');
      if (response.data?.success) {
        setContacts(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch contacts:', err);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  // Establish WebSockets Connection
  useEffect(() => {
    if (!token) return;

    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5051/api';
    const socketUrl = apiBase.replace('/api', '');

    const socket = io(socketUrl, {
      auth: { token }
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('📡 Connected to message socket server');
    });

    socket.on('users:online', (onlineUserIds: string[]) => {
      setOnlineUsers(onlineUserIds);
    });

    socket.on('messages:read', ({ readerId }: { readerId: string }) => {
      const activeChatVal = activeChatRef.current;
      if (activeChatVal && readerId === activeChatVal.user.id) {
        setMessages(prev => prev.map(m => ({ ...m, is_read: true })));
      }
    });

    socket.on('message:new', (newMsg: Message) => {
      // 1. Refresh conversations sidebar silently
      fetchConversations(true);

      // 2. If it's the active chat room, append to messages list
      const activeChatVal = activeChatRef.current;
      if (activeChatVal && (newMsg.sender_id === activeChatVal.user.id || newMsg.receiver_id === activeChatVal.user.id)) {
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });

        // 3. Mark message as read dynamically if we are the receiver and looking at this chat
        if (newMsg.receiver_id === user?.id) {
          api.get(`/messages/history/${activeChatVal.user.id}`).catch(() => {});
        }
      }
    });

    socket.on('typing:start', ({ senderId }: { senderId: string }) => {
      setTypingStates(prev => ({ ...prev, [senderId]: true }));
    });

    socket.on('typing:stop', ({ senderId }: { senderId: string }) => {
      setTypingStates(prev => ({ ...prev, [senderId]: false }));
    });

    return () => {
      socket.disconnect();
    };
  }, [token, user]);

  // Initial Load conversations
  useEffect(() => {
    fetchConversations();
  }, []);

  // Load target chat from query parameter
  useEffect(() => {
    if (targetUserId && !isLoadingConvs) {
      const existing = conversations.find(c => c.user.id === targetUserId);
      if (existing) {
        setActiveChat(existing);
        fetchMessageHistory(existing.user.id);
      } else {
        // Resolve contact details
        const resolveContact = async () => {
          try {
            const response = await api.get('/messages/contacts');
            if (response.data?.success) {
              const matched = response.data.data.find((c: any) => c.id === targetUserId);
              if (matched) {
                const mockConversation: Conversation = {
                  id: matched.id,
                  user: {
                    id: matched.id,
                    name: matched.name,
                    username: matched.username,
                    profilePicture: matched.profilePicture,
                    primaryRole: matched.primaryRole
                  },
                  lastMessage: {
                    id: '',
                    content: '',
                    type: 'text',
                    isRead: true,
                    senderId: '',
                    receiverId: '',
                    createdAt: new Date().toISOString()
                  },
                  unreadCount: 0
                };
                setActiveChat(mockConversation);
                setMessages([]);
              }
            }
          } catch (err) {
            console.error('Failed to resolve target contact:', err);
          }
        };
        resolveContact();
      }
    }
  }, [targetUserId, conversations, isLoadingConvs]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  // Filter Conversations
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredConversations(
        conversations.filter(
          c =>
            c.user.name.toLowerCase().includes(query) ||
            c.user.username.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, conversations]);

  // Filter Contacts
  useEffect(() => {
    if (!contactSearch.trim()) {
      setFilteredContacts(contacts);
    } else {
      const query = contactSearch.toLowerCase();
      setFilteredContacts(
        contacts.filter(
          c =>
            c.name.toLowerCase().includes(query) ||
            c.username.toLowerCase().includes(query)
        )
      );
    }
  }, [contactSearch, contacts]);

  // Scroll to bottom helper
  const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth') => {
    messageEndRef.current?.scrollIntoView({ behavior });
  };

  // Scroll to bottom when messages list size changes
  useEffect(() => {
    scrollToBottom('auto');
  }, [messages]);

  // Handle Switch Active Chat
  const handleSelectChat = (conversation: Conversation) => {
    setActiveChat(conversation);
    fetchMessageHistory(conversation.user.id);
    setIsContactsOpen(false);
    setSearchParams({ userId: conversation.user.id });
  };

  // Start chat from Contacts list
  const handleStartChatWithContact = (contact: Contact) => {
    const existing = conversations.find(c => c.user.id === contact.id);
    if (existing) {
      handleSelectChat(existing);
    } else {
      const mockConversation: Conversation = {
        id: contact.id,
        user: {
          id: contact.id,
          name: contact.name,
          username: contact.username,
          profilePicture: contact.profilePicture,
          primaryRole: contact.primaryRole
        },
        lastMessage: {
          id: '',
          content: '',
          type: 'text',
          isRead: true,
          senderId: '',
          receiverId: '',
          createdAt: new Date().toISOString()
        },
        unreadCount: 0
      };
      setActiveChat(mockConversation);
      setMessages([]);
      setIsContactsOpen(false);
      setSearchParams({ userId: contact.id });
    }
  };

  // Handle message typing input change & trigger live events
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    if (!activeChat || !socketRef.current) return;

    if (!isTyping) {
      setIsTyping(true);
      socketRef.current.emit('typing:start', { receiverId: activeChat.user.id });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketRef.current?.emit('typing:stop', { receiverId: activeChat.user.id });
    }, 2000);
  };

  // Send Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeChat || isSending) return;

    const messageContent = inputText.trim();
    setInputText('');
    setIsSending(true);

    // Stop typing state immediately
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setIsTyping(false);
    socketRef.current?.emit('typing:stop', { receiverId: activeChat.user.id });

    // Optimistic message add
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      sender_id: user?.id || '',
      receiver_id: activeChat.user.id,
      content: messageContent,
      type: 'text',
      is_read: false,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const response = await api.post('/messages/send', {
        receiverId: activeChat.user.id,
        content: messageContent
      });

      if (response.data?.success) {
        // Swap temp with real message
        setMessages(prev =>
          prev.map(m => (m.id === tempId ? response.data.data : m))
        );
        fetchConversations(true);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setIsSending(false);
    }
  };

  // Date Formatting Utilities
  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className={`relative flex h-full w-full overflow-hidden ${
      isDarkMode ? 'bg-[#000000] text-white' : 'bg-zinc-50 text-zinc-950'
    }`}>

      {/* ── LEFT PANE: CHATS LIST ────────────────────────────────────────────────── */}
      <div className={`
        ${activeChat ? 'hidden md:flex' : 'flex'}
        flex-col w-full md:w-[360px] lg:w-[400px] border-r shrink-0 h-full
        ${isDarkMode ? 'border-white/5 bg-[#0e0e0e]' : 'border-zinc-200 bg-white'}
      `}>
        
        {/* Chats Header */}
        <div className="p-4 lg:pt-6 flex items-center justify-between border-b dark:border-white/5 border-zinc-100">
          <h2 className="text-xl font-bold tracking-tight">Chats</h2>
          <button 
            onClick={() => {
              setIsContactsOpen(true);
              fetchContacts();
            }}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              isDarkMode 
                ? 'bg-white/5 hover:bg-white/10 text-rose-500' 
                : 'bg-zinc-100 hover:bg-zinc-200 text-rose-600'
            }`}
            title="New Chat"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Search Chats */}
        <div className="p-4 border-b dark:border-white/5 border-zinc-100">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
            isDarkMode 
              ? 'bg-white/5 border-white/5 focus-within:border-white/20' 
              : 'bg-zinc-100 border-zinc-200 focus-within:border-zinc-300'
          }`}>
            <Search size={16} className="text-zinc-500 shrink-0" />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-xs w-full placeholder-zinc-500"
            />
          </div>
        </div>

        {/* Active Conversations List */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {isLoadingConvs ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <Loader2 className="animate-spin text-rose-500" size={24} />
              <span className="text-xs text-zinc-500">Loading chats...</span>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center px-6">
              <MessageSquare size={36} className="text-zinc-600 mb-3" />
              <h4 className="text-sm font-semibold">No chats found</h4>
              <p className="text-xs text-zinc-500 mt-1 max-w-[200px]">
                Click the + button to select a contact and start messaging!
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = activeChat?.user.id === conv.user.id;
              const isUserTyping = typingStates[conv.user.id];
              return (
                <button
                  key={conv.user.id}
                  onClick={() => handleSelectChat(conv)}
                  className={`
                    w-full flex items-start gap-3 p-4 transition-colors text-left border-b
                    ${isDarkMode ? 'border-white/5' : 'border-zinc-100'}
                    ${isActive 
                      ? (isDarkMode ? 'bg-white/5' : 'bg-zinc-100') 
                      : (isDarkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-zinc-50')
                    }
                  `}
                >
                  <div className="relative shrink-0">
                    <img 
                      src={conv.user.profilePicture || defaultProfile} 
                      alt={conv.user.name} 
                      className="w-12 h-12 rounded-full object-cover border dark:border-white/10 border-zinc-200"
                    />
                    {onlineUsers.includes(conv.user.id) && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 dark:border-[#0e0e0e] border-white shadow-[0_0_4px_#10b981]" />
                    )}
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-bold truncate leading-tight">{conv.user.name}</h4>
                      <span className="text-[10px] text-zinc-500 font-medium shrink-0">
                        {formatDate(conv.lastMessage.createdAt)}
                      </span>
                    </div>

                    <p className={`text-[10px] font-bold mb-1 uppercase tracking-wider ${
                      isDarkMode ? 'text-rose-500/80' : 'text-rose-600/80'
                    }`}>
                      {conv.user.primaryRole}
                    </p>

                    <div className="flex items-center justify-between gap-2">
                      {isUserTyping ? (
                        <p className={`text-xs font-semibold leading-snug text-emerald-500 animate-pulse`}>
                          typing...
                        </p>
                      ) : (
                        <p className={`text-xs truncate flex-1 leading-snug ${
                          conv.unreadCount > 0 
                            ? (isDarkMode ? 'text-white font-semibold' : 'text-zinc-950 font-semibold')
                            : 'text-zinc-500'
                        }`}>
                          {conv.lastMessage.content}
                        </p>
                      )}
                      
                      {conv.unreadCount > 0 && (
                        <span className="min-w-5 h-5 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center px-1 shrink-0">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── RIGHT PANE: ACTIVE CHAT ROOM ────────────────────────────────────────── */}
      <div className={`
        ${activeChat ? 'flex' : 'hidden md:flex'}
        flex-col flex-1 h-full relative
        ${isDarkMode ? 'bg-[#000000]' : 'bg-[#f4f4f5]'}
      `}>
        {activeChat ? (
          <>
            {/* Active Chat Header */}
            <div className={`
              flex items-center justify-between px-4 py-3 md:px-6 md:py-4 lg:pt-6 border-b z-10
              ${isDarkMode ? 'border-white/5 bg-[#0e0e0e]' : 'border-zinc-200 bg-white'}
            `}>
              <div className="flex items-center gap-3">
                <button 
                  type="button"
                  onClick={() => {
                    setActiveChat(null);
                    setSearchParams({});
                  }} 
                  className="md:hidden p-1.5 rounded-xl transition-all cursor-pointer bg-white/5 hover:bg-white/10 text-rose-500"
                >
                  <ArrowLeft size={18} />
                </button>
                <img 
                  src={activeChat.user.profilePicture || defaultProfile} 
                  alt={activeChat.user.name} 
                  className="w-10 h-10 md:w-11 md:h-11 rounded-full object-cover border dark:border-white/10 border-zinc-200"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm md:text-base font-bold leading-tight">{activeChat.user.name}</h3>
                    {onlineUsers.includes(activeChat.user.id) && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">
                    @{activeChat.user.username} • {activeChat.user.primaryRole}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4 no-scrollbar"
            >
              {isLoadingMessages ? (
                <div className="flex items-center justify-center flex-grow">
                  <Loader2 className="animate-spin text-rose-500" size={28} />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-grow text-center opacity-40">
                  <MessageSquare size={48} className="text-zinc-500 mb-2" />
                  <p className="text-sm font-medium">No messages yet. Say hello!</p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isMe = msg.sender_id === user?.id;
                  
                  // Date separation logic
                  const prevMsg = index > 0 ? messages[index - 1] : null;
                  const showDateLine = !prevMsg || 
                    new Date(msg.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString();

                  return (
                    <div key={msg.id} className="flex flex-col w-full">
                      {showDateLine && (
                        <div className="flex items-center justify-center my-4">
                          <span className={`text-[10px] font-bold px-3 py-1 rounded-full border tracking-wide uppercase ${
                            isDarkMode 
                              ? 'bg-white/5 border-white/5 text-zinc-400' 
                              : 'bg-zinc-200 border-zinc-300 text-zinc-650'
                          }`}>
                            {formatDate(msg.created_at)}
                          </span>
                        </div>
                      )}

                      <div className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`
                          max-w-[70%] rounded-2xl px-4 py-2.5 shadow-md flex flex-col
                          ${isMe 
                            ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-tr-none' 
                            : (isDarkMode 
                                ? 'bg-[#1C1C1C] text-white border border-white/5 rounded-tl-none' 
                                : 'bg-white text-zinc-950 border border-zinc-200 rounded-tl-none')
                          }
                        `}>
                          <p className="text-xs leading-relaxed break-words">{msg.content}</p>
                          <div className="flex items-center gap-1 mt-1 self-end">
                            <span className={`text-[9.5px] font-medium ${
                              isMe ? 'text-white/60' : 'text-zinc-500'
                            }`}>
                              {formatTime(msg.created_at)}
                            </span>
                            {isMe && (
                              <span className="shrink-0 flex items-center">
                                {msg.is_read ? (
                                  <CheckCheck size={13} className="text-sky-300" />
                                ) : onlineUsers.includes(msg.receiver_id) ? (
                                  <CheckCheck size={13} className="text-white/50" />
                                ) : (
                                  <Check size={13} className="text-white/50" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Bouncing Typing Bubble */}
              {activeChat && typingStates[activeChat.user.id] && (
                <div className="flex w-full justify-start mt-2">
                  <div className={`
                    max-w-[70%] rounded-2xl px-4 py-3 shadow-md flex items-center gap-1.5 rounded-tl-none
                    ${isDarkMode 
                      ? 'bg-[#1C1C1C] text-white border border-white/5' 
                      : 'bg-white text-zinc-950 border border-zinc-200'}
                  `}>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-[10.5px] text-zinc-500 font-semibold ml-1">typing...</span>
                  </div>
                </div>
              )}

              <div ref={messageEndRef} />
            </div>

            {/* Bottom Message Input Box */}
            <form 
              onSubmit={handleSendMessage}
              className={`
                p-4 border-t flex items-center gap-3 z-10
                ${isDarkMode ? 'border-white/5 bg-[#0e0e0e]' : 'border-zinc-200 bg-white'}
              `}
            >
              <input 
                type="text"
                placeholder="Type a message..."
                value={inputText}
                onChange={handleInputChange}
                disabled={isSending}
                className={`
                  flex-1 text-xs border rounded-xl px-4 py-3 outline-none transition-colors
                  ${isDarkMode 
                    ? 'bg-white/5 border-white/5 focus:border-white/20 placeholder-zinc-500 text-white' 
                    : 'bg-zinc-50 border-zinc-200 focus:border-zinc-300 placeholder-zinc-400 text-zinc-955'
                  }
                `}
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isSending}
                className={`
                  p-3 rounded-xl flex items-center justify-center transition-all cursor-pointer
                  ${inputText.trim() && !isSending
                    ? 'bg-rose-500 text-white hover:opacity-90 hover:scale-105 active:scale-95 shadow-[0_4px_15px_rgba(244,63,94,0.3)]'
                    : (isDarkMode ? 'bg-white/5 text-zinc-500' : 'bg-zinc-100 text-zinc-400')
                  }
                `}
              >
                {isSending ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </form>
          </>
        ) : (
          /* Empty Chat Room Welcome Screen */
          <div className="flex flex-col items-center justify-center flex-grow text-center px-6">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-xl ${
              isDarkMode ? 'bg-white/5 text-rose-500' : 'bg-white text-rose-600'
            }`}>
              <MessageSquare size={36} />
            </div>
            <h3 className="text-xl font-bold tracking-tight">Communication Hub</h3>
            <p className="text-xs text-zinc-500 mt-2 max-w-xs leading-relaxed">
              Select a conversation from the sidebar or click the plus icon to start a new chat with our YouTube creators and editors.
            </p>
          </div>
        )}
      </div>

      {/* ── FLOATING CONTACTS SELECTION MODAL ────────────────────────────────────── */}
      <AnimatePresence>
        {isContactsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsContactsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`
                relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[500px] z-10
                ${isDarkMode ? 'bg-[#1C1C1C] text-white border border-white/10' : 'bg-white text-black border border-zinc-200'}
              `}
            >
              {/* Header */}
              <div className={`flex items-center justify-between p-4 border-b ${
                isDarkMode ? 'border-white/10' : 'border-zinc-200'
              }`}>
                <h3 className="text-sm font-semibold mx-auto">New Chat</h3>
                <button 
                  onClick={() => setIsContactsOpen(false)}
                  className="absolute right-4 p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <X size={20} className={isDarkMode ? 'text-white' : 'text-zinc-655'} />
                </button>
              </div>

              {/* Contact Search */}
              <div className={`p-4 border-b ${
                isDarkMode ? 'border-white/10' : 'border-zinc-200'
              }`}>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
                  isDarkMode 
                    ? 'bg-white/5 border-white/5 focus-within:border-white/20' 
                    : 'bg-zinc-50 border-zinc-200 focus-within:border-zinc-300'
                }`}>
                  <Search size={14} className="text-zinc-500 shrink-0" />
                  <input 
                    type="text" 
                    placeholder="Search contacts..." 
                    value={contactSearch}
                    onChange={e => setContactSearch(e.target.value)}
                    className="bg-transparent border-none outline-none text-xs w-full placeholder-zinc-500"
                  />
                </div>
              </div>

              {/* Contacts List */}
              <div className="flex-1 overflow-y-auto no-scrollbar">
                {isLoadingContacts ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-2">
                    <Loader2 className="animate-spin text-rose-500" size={24} />
                    <span className="text-xs text-zinc-500">Loading contacts...</span>
                  </div>
                ) : filteredContacts.length === 0 ? (
                  <div className="text-center py-20 opacity-55">
                    <UserCheck size={36} className="mx-auto mb-2" />
                    <p className="text-xs font-semibold">No contacts found</p>
                  </div>
                ) : (
                  filteredContacts.map(contact => (
                    <button
                      key={contact.id}
                      onClick={() => handleStartChatWithContact(contact)}
                      className={`
                        w-full flex items-center gap-3 p-4 transition-colors border-b text-left
                        ${isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-zinc-200 hover:bg-zinc-100'}
                      `}
                    >
                      <img 
                        src={contact.profilePicture || defaultProfile} 
                        alt={contact.name} 
                        className="w-10 h-10 rounded-full object-cover border dark:border-white/10 border-zinc-200"
                      />
                      <div>
                        <h4 className="text-xs font-bold leading-tight">{contact.name}</h4>
                        <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">@{contact.username}</p>
                        <p className="text-[9px] font-bold text-rose-500 mt-1 uppercase tracking-wider">{contact.primaryRole}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
