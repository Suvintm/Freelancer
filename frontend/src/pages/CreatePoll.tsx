import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';
import { 
  BarChart3, Plus, X, Check, ArrowRight, Settings2, Globe, EyeOff
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { uploadMediaToS3 } from '../utils/s3Uploader';
import { PieChart, LayoutGrid, Image as ImageIcon2 } from 'lucide-react';

interface OptionCount {
  id: string;
  text: string;
  _count?: {
    responses: number;
  };
}

interface UserProfile {
  name?: string;
  profile_picture?: string;
}

interface User {
  username?: string;
  profile?: UserProfile;
}

interface PollResponse {
  id: string;
  text_response: string;
  user?: User;
}

interface Poll {
  id: string;
  question: string;
  type?: 'MULTIPLE_CHOICE' | 'OPEN_ENDED';
  options: OptionCount[];
  responses: PollResponse[];
  _count?: {
    responses: number;
  };
}

interface PollPost {
  id: string;
  poll: Poll;
}

const TEMPLATES = [
  {
    id: 'next_video',
    title: 'What should my next video be?',
    desc: 'Engage audience on content direction',
    icon: BarChart3,
    type: 'MULTIPLE_CHOICE',
    layout: 'BAR_CHART',
    options: ['Day in my life vlog', 'Tutorial / How-to', 'Reacting to subscriber setups', 'Q&A Session'],
    color: 'from-zinc-200 to-zinc-400 dark:from-zinc-800 dark:to-zinc-600'
  },
  {
    id: 'donut_poll',
    title: 'Which tech is better?',
    desc: 'Fun comparison using a donut chart',
    icon: PieChart,
    type: 'MULTIPLE_CHOICE',
    layout: 'DONUT_CHART',
    options: ['React', 'Vue', 'Svelte', 'Angular'],
    color: 'from-blue-200 to-indigo-400 dark:from-blue-900 dark:to-indigo-700'
  },
  {
    id: 'thumbnail_ab',
    title: 'Thumbnail A or B?',
    desc: 'Grid layout for text options',
    icon: LayoutGrid,
    type: 'MULTIPLE_CHOICE',
    layout: 'GRID_CARDS',
    options: ['Option A (Blue Background)', 'Option B (Red Background)', 'Option C (Yellow)'],
    color: 'from-zinc-300 to-zinc-500 dark:from-zinc-700 dark:to-zinc-500'
  }
];

function MyPollsView({ isDarkMode }: { isDarkMode: boolean }) {
  const resolveImg = (url: string | null | undefined) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5051';
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${apiBase}${cleanUrl}`;
  };

  const [polls, setPolls] = useState<PollPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);

  useEffect(() => {
    api.get('/polls/my-polls').then(res => {
      setPolls(res.data.data);
    }).finally(() => setLoading(false));
  }, []);

  const loadDetails = async (id: string) => {
    try {
      const res = await api.get(`/polls/${id}/details`);
      setSelectedPoll(res.data.data);
    } catch (err) {
      console.error("Failed to load details", err);
    }
  };

  if (loading) return <div className="p-10 text-center font-bold">Loading your polls...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {polls.length === 0 ? (
        <div className="text-center p-10 font-bold text-zinc-500">You haven't created any polls yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {polls.map((p: PollPost) => {
            const poll = p.poll;
            const totalVotes = poll._count?.responses || 0;
            return (
              <div key={p.id} className={`p-5 rounded-2xl border-2 ${isDarkMode ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-white'} hover:shadow-xl transition-all`}>
                <h3 className={`text-sm font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{poll.question}</h3>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs font-semibold text-zinc-500">{totalVotes} Responses</span>
                  <button 
                    onClick={() => loadDetails(poll.id)}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors ${isDarkMode ? 'bg-white text-black hover:bg-zinc-200' : 'bg-zinc-900 text-white hover:bg-zinc-800'}`}
                  >
                    View Details
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Analytics Modal */}
      <AnimatePresence>
        {selectedPoll && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className={`w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-[32px] p-6 lg:p-8 ${isDarkMode ? 'bg-zinc-950 border border-zinc-800' : 'bg-white shadow-2xl'}`}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Poll Analytics</h2>
                <button onClick={() => setSelectedPoll(null)} className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 transition-colors">
                  <X size={16} className={isDarkMode ? 'text-white' : 'text-zinc-900'} />
                </button>
              </div>

              <div className="mb-8">
                <h3 className={`text-2xl font-black leading-tight mb-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{selectedPoll.question}</h3>
                <p className="text-sm font-bold text-zinc-500">{selectedPoll._count?.responses} Total Responses</p>
              </div>

              {selectedPoll.type === 'MULTIPLE_CHOICE' || !selectedPoll.type ? (
                <div className="space-y-4">
                  {selectedPoll.options.map((opt: OptionCount) => {
                    const count = opt._count?.responses || 0;
                    const total = selectedPoll._count?.responses || 0;
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                    return (
                      <div key={opt.id} className="relative w-full rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 h-16 flex items-center px-4">
                        <div className="absolute inset-y-0 left-0 bg-blue-500/20 dark:bg-blue-500/30" style={{ width: `${pct}%` }} />
                        <div className="relative z-10 w-full flex items-center justify-between">
                          <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{opt.text}</span>
                          <div className="text-right">
                            <span className={`block text-sm font-black ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{pct}%</span>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase">{count} votes</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">Text Responses</h4>
                  {selectedPoll.responses.length === 0 ? (
                    <p className="text-sm font-bold text-zinc-500">No responses yet.</p>
                  ) : (
                    selectedPoll.responses.map((resp: PollResponse) => (
                      <div key={resp.id} className={`p-4 rounded-2xl ${isDarkMode ? 'bg-zinc-900' : 'bg-zinc-50'}`}>
                        <div className="flex items-center gap-2 mb-3">
                          <img src={resolveImg(resp.user?.profile?.profile_picture) || 'https://via.placeholder.com/150'} className="w-6 h-6 rounded-full object-cover" />
                          <span className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{resp.user?.profile?.name || resp.user?.username || 'User'}</span>
                        </div>
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>{resp.text_response}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function CreatePoll() {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'CREATE_OPEN' | 'CREATE_MULTIPLE' | 'CREATE_THUMBNAIL' | 'MY_POLLS'>('CREATE_MULTIPLE');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [type, setType] = useState('MULTIPLE_CHOICE');
  const [layout, setLayout] = useState('STANDARD');
  const [options, setOptions] = useState(['', '']);
  const [optionImages, setOptionImages] = useState<(File | null)[]>([null, null]);
  const [showResponseCount, setShowResponseCount] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const applyTemplate = (tpl: typeof TEMPLATES[0]) => {
    setSelectedTemplate(tpl.id);
    setQuestion(tpl.title);
    setType(tpl.type);
    setLayout(tpl.layout || 'STANDARD');
    setOptionImages(new Array(tpl.options?.length || 2).fill(null));
    if (tpl.type === 'MULTIPLE_CHOICE') {
      setOptions([...tpl.options]);
    } else {
      setOptions([]);
    }
  };

  const handleAddOption = () => {
    if (options.length < 5) {
      setOptions([...options, '']);
      setOptionImages([...optionImages, null]);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      const newOpts = [...options];
      newOpts.splice(index, 1);
      setOptions(newOpts);
      const newImgs = [...optionImages];
      newImgs.splice(index, 1);
      setOptionImages(newImgs);
    }
  };

  const handleImageChange = (index: number, file: File | null) => {
    const newImgs = [...optionImages];
    newImgs[index] = file;
    setOptionImages(newImgs);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOpts = [...options];
    newOpts[index] = value;
    setOptions(newOpts);
  };

  const handleSubmit = async () => {
    setErrorMsg('');
    if (!question.trim()) return;
    
    const validOptions = options.map((text, i) => ({ text: text.trim(), file: optionImages[i] })).filter(opt => opt.text || opt.file);
    
    if ((type === 'MULTIPLE_CHOICE' || activeTab === 'CREATE_THUMBNAIL') && validOptions.length < 2) {
      setErrorMsg('Please fill in at least 2 options for your poll.');
      return;
    }

    try {
      setIsSubmitting(true);
      
      
      let finalOptions: { text: string; image_url: string | null }[] = [];
      if (type === 'MULTIPLE_CHOICE' || activeTab === 'CREATE_THUMBNAIL') {
        finalOptions = await Promise.all(validOptions.map(async (opt, idx) => {
          let image_url = null;
          if (opt.file) {
            image_url = await uploadMediaToS3(opt.file);
          }
          return { text: opt.text || `Option ${String.fromCharCode(65 + idx)}`, image_url };
        }));
      }

      const payload = {
        question: question.trim(),
        type: activeTab === 'CREATE_THUMBNAIL' ? 'MULTIPLE_CHOICE' : type,
        layout: layout,
        visibility: 'PUBLIC',
        show_response_count: showResponseCount,
        options: finalOptions
      };


      const response = await api.post('/polls', payload);
      
      if (response.data.success) {
        navigate('/home');
      }
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error("Failed to create poll:", err);
      setErrorMsg(err.response?.data?.message || 'Failed to create poll. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`w-full min-h-full pb-20 lg:pb-0 ${isDarkMode ? 'bg-black text-white' : 'bg-zinc-50 text-zinc-900'}`}>
      {/* Header */}
      <div className={`sticky top-0 z-20 w-full px-4 py-4 border-b flex items-center justify-between backdrop-blur-md ${isDarkMode ? 'border-white/10 bg-black/70' : 'border-zinc-200 bg-white/70'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${isDarkMode ? 'bg-white text-black shadow-white/10' : 'bg-zinc-900 text-white shadow-zinc-900/20'}`}>
            <BarChart3 size={20} />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight leading-none">Create Growth Poll</h1>
            <p className={`text-[11px] font-semibold mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Engage your audience & drive growth</p>
          </div>
        </div>
        <button 
          onClick={() => navigate(-1)}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isDarkMode ? 'bg-zinc-900 hover:bg-zinc-800' : 'bg-zinc-100 hover:bg-zinc-200'}`}
        >
          <X size={16} />
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="flex justify-center mt-6 px-4">
        <div className={`inline-flex p-1 rounded-2xl ${isDarkMode ? 'bg-zinc-900' : 'bg-zinc-100'} overflow-x-auto hide-scrollbar max-w-full`}>
          <button
            onClick={() => { setActiveTab('CREATE_OPEN'); setType('OPEN_ENDED'); setLayout('STANDARD'); }}
            className={`px-6 py-2.5 text-[13px] font-bold rounded-xl whitespace-nowrap transition-all duration-300 ${activeTab === 'CREATE_OPEN' ? (isDarkMode ? 'bg-zinc-800 text-white shadow-lg' : 'bg-white text-zinc-900 shadow-md') : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
          >
            Open Question
          </button>
          <button
            onClick={() => { setActiveTab('CREATE_MULTIPLE'); setType('MULTIPLE_CHOICE'); setLayout('STANDARD'); if(options.length < 2) setOptions(['','']); }}
            className={`px-6 py-2.5 text-[13px] font-bold rounded-xl whitespace-nowrap transition-all duration-300 ${activeTab === 'CREATE_MULTIPLE' ? (isDarkMode ? 'bg-zinc-800 text-white shadow-lg' : 'bg-white text-zinc-900 shadow-md') : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
          >
            Multiple Options
          </button>
          <button
            onClick={() => { setActiveTab('CREATE_THUMBNAIL'); setType('THUMBNAIL_POLL'); setLayout('IMAGE_CAROUSEL'); if(options.length < 2) setOptions(['','']); }}
            className={`px-6 py-2.5 text-[13px] font-bold rounded-xl whitespace-nowrap transition-all duration-300 ${activeTab === 'CREATE_THUMBNAIL' ? (isDarkMode ? 'bg-zinc-800 text-white shadow-lg' : 'bg-white text-zinc-900 shadow-md') : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
          >
            Thumbnail Vote
          </button>
          <button
            onClick={() => setActiveTab('MY_POLLS')}
            className={`px-6 py-2.5 text-[13px] font-bold rounded-xl whitespace-nowrap transition-all duration-300 ${activeTab === 'MY_POLLS' ? (isDarkMode ? 'bg-zinc-800 text-white shadow-lg' : 'bg-white text-zinc-900 shadow-md') : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
          >
            My Polls
          </button>
        </div>
      </div>

      {activeTab === 'MY_POLLS' ? (
        <MyPollsView isDarkMode={isDarkMode} />
      ) : (
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
        
        {/* Templates Gallery */}
        {activeTab === 'CREATE_MULTIPLE' && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Production Templates</h2>
            <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TEMPLATES.map(tpl => {
              const isSelected = selectedTemplate === tpl.id;
              const Icon = tpl.icon;
              return (
                <button
                  key={tpl.id}
                  onClick={() => applyTemplate(tpl)}
                  className={`
                    relative text-left p-5 rounded-2xl border-2 transition-all duration-300 overflow-hidden group hover:-translate-y-1 hover:shadow-xl
                    ${isSelected 
                      ? (isDarkMode ? 'border-white bg-zinc-900' : 'border-zinc-900 bg-zinc-100')
                      : (isDarkMode ? 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700' : 'border-zinc-200 bg-white hover:border-zinc-300')}
                  `}
                >
                  <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${tpl.color} opacity-10 rounded-bl-full group-hover:scale-125 transition-transform duration-500`} />
                  
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 shadow-sm bg-gradient-to-br ${tpl.color}`}>
                    <Icon size={20} className={isDarkMode ? 'text-zinc-300' : 'text-zinc-700'} />
                  </div>
                  <h3 className={`text-sm font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{tpl.title}</h3>
                  <p className={`text-[11px] font-medium leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>{tpl.desc}</p>
                  
                  {isSelected && (
                    <div className={`absolute top-4 right-4 w-5 h-5 rounded-full flex items-center justify-center shadow-sm ${isDarkMode ? 'bg-white' : 'bg-zinc-900'}`}>
                      <Check size={12} className={isDarkMode ? 'text-black' : 'text-white'} strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>
        )}

        {/* Builder Area */}
        <section className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200 shadow-xl shadow-zinc-200/40'}`}>
          <div className="space-y-6">
            
            {/* Question Input */}
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">The Question</label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask your audience anything..."
                className={`w-full min-h-[100px] p-4 rounded-2xl text-lg font-semibold resize-none transition-colors border-2 outline-none ${
                  isDarkMode 
                    ? 'bg-black border-zinc-800 text-white placeholder-zinc-700 focus:border-white' 
                    : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-zinc-900'
                }`}
              />
            </div>

            
            {/* Options Builder */}
            <AnimatePresence mode="popLayout">
              {(activeTab === 'CREATE_MULTIPLE' || activeTab === 'CREATE_THUMBNAIL') && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  {options.map((opt, index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-500'}`}>
                        {String.fromCharCode(65 + index)}
                      </div>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder={activeTab === 'CREATE_THUMBNAIL' ? `Option ${String.fromCharCode(65 + index)}` : `Option ${index + 1}`}
                        className={`flex-1 h-12 px-4 rounded-xl text-sm font-semibold outline-none transition-colors border-2 ${
                          isDarkMode 
                            ? 'bg-black border-zinc-800 text-white placeholder-zinc-700 focus:border-white' 
                            : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-zinc-900'
                        }`}
                      />
                      {activeTab === 'CREATE_THUMBNAIL' && (
                        <div className="relative shrink-0">
                          <input type="file" accept="image/*" className="hidden" id={`thumb-opt-${index}`} onChange={(e) => handleImageChange(index, e.target.files?.[0] || null)} />
                          <label htmlFor={`thumb-opt-${index}`} className={`w-12 h-12 flex items-center justify-center rounded-xl border-2 cursor-pointer transition-colors overflow-hidden ${optionImages[index] ? 'border-green-500 bg-green-500/10' : (isDarkMode ? 'border-zinc-800 bg-zinc-900 hover:border-zinc-600' : 'border-zinc-200 bg-zinc-100 hover:border-zinc-300')}`}>
                            {optionImages[index] ? (
                              <img src={URL.createObjectURL(optionImages[index])} className="w-full h-full object-cover" alt="thumb" />
                            ) : (
                              <ImageIcon2 size={16} className={isDarkMode ? 'text-zinc-500' : 'text-zinc-400'} />
                            )}
                          </label>
                        </div>
                      )}
                      {options.length > 2 && (
                        <button 
                          onClick={() => handleRemoveOption(index)}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isDarkMode ? 'bg-zinc-900 text-zinc-500 hover:text-white' : 'bg-zinc-100 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200'}`}
                        >
                          <X size={16} />
                        </button>
                      )}
                    </motion.div>
                  ))}
                  
                  {options.length < 5 && (
                    <button
                      onClick={handleAddOption}
                      className={`flex items-center gap-2 px-4 py-3 text-sm font-bold transition-colors ${isDarkMode ? 'text-zinc-300 hover:text-white' : 'text-zinc-600 hover:text-zinc-900'}`}
                    >
                      <Plus size={16} strokeWidth={3} />
                      Add another option
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Visibility Settings */}
            <div className={`mt-6 pt-6 border-t ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
                <Settings2 size={14} /> Advanced Settings
              </h3>
              
              <div className={`flex items-center justify-between p-4 rounded-xl ${isDarkMode ? 'bg-zinc-950' : 'bg-zinc-50'}`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-zinc-900 text-zinc-400' : 'bg-white text-zinc-500 shadow-sm'}`}>
                    {showResponseCount ? <Globe size={16} /> : <EyeOff size={16} />}
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Public Response Counts</p>
                    <p className={`text-[11px] font-medium leading-tight mt-1 max-w-[200px] ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>
                      {showResponseCount ? 'Everyone can see how many votes each option has.' : 'Only you can see the results. Audience sees their own vote.'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowResponseCount(!showResponseCount)}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-300 outline-none ${showResponseCount ? (isDarkMode ? 'bg-white' : 'bg-zinc-900') : (isDarkMode ? 'bg-zinc-800' : 'bg-zinc-300')}`}
                >
                  <motion.div 
                    initial={false}
                    animate={{ x: showResponseCount ? 24 : 2 }}
                    className={`absolute top-[2px] w-5 h-5 rounded-full shadow-sm ${showResponseCount ? (isDarkMode ? 'bg-black' : 'bg-white') : 'bg-white'}`}
                  />
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* Submit Action */}
        <div className="flex flex-col items-end pt-4 pb-12">
          {errorMsg && (
            <motion.p 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-500 text-sm font-bold mb-4 bg-red-500/10 px-4 py-2 rounded-xl"
            >
              {errorMsg}
            </motion.p>
          )}
          <button
            onClick={handleSubmit}
            disabled={!question || isSubmitting}
            className={`px-8 py-4 rounded-2xl text-sm font-black flex items-center gap-3 transition-all duration-300 ${
              (!question || isSubmitting)
                ? (isDarkMode ? 'bg-zinc-900 text-zinc-600' : 'bg-zinc-200 text-zinc-400')
                : (isDarkMode ? 'bg-white text-black hover:bg-zinc-200 hover:scale-[1.02]' : 'bg-zinc-900 text-white hover:bg-zinc-800 hover:scale-[1.02]')
            }`}
          >
            {isSubmitting ? (
              <div className={`w-5 h-5 border-2 border-t-transparent rounded-full animate-spin ${isDarkMode ? 'border-black' : 'border-white'}`} />
            ) : (
              <>
                Publish Growth Poll
                <ArrowRight size={18} strokeWidth={3} />
              </>
            )}
          </button>
        </div>

      </div>
      )}
    </div>
  );
}
