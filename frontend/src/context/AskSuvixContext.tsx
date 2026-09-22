import React, { createContext, useContext, useState, useCallback } from 'react';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text?: string;
  title?: string;
  timestamp: string;
  metrics?: { label: string; value: string; change?: string }[];
  actionTips?: string[];
  isAnalyzing?: boolean;
}

interface AskSuvixContextType {
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  openAskSuvix: (initialPrompt?: string) => void;
  closeAskSuvix: () => void;
  messages: ChatMessage[];
  sendMessage: (text: string) => void;
  isAnalyzing: boolean;
  activeCategory: string;
  setActiveCategory: (category: string) => void;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-welcome',
    sender: 'ai',
    title: "Hi! I'm SuviX ✦",
    text: "Ask me anything about your content, opportunities, analytics, brands, earnings or platform features. I'm here to help you grow.",
    timestamp: '10:24 AM',
  },
  {
    id: 'msg-sample-user',
    sender: 'user',
    text: 'How is my content performing this month?',
    timestamp: '10:24 AM',
  },
  {
    id: 'msg-sample-ai',
    sender: 'ai',
    title: 'Analyzing your data...',
    text: 'Your engagement rate surged by +24.6% this month across connected feeds. Reels are driving 72% of audience discoveries, and your Link in Bio conversion reached an all-time high.',
    metrics: [
      { label: 'Avg Retention', value: '46.2s', change: '+14%' },
      { label: 'Profile Reach', value: '18.4K', change: '+28%' },
      { label: 'Sponsor Score', value: '94/100', change: '+8' }
    ],
    actionTips: [
      'Publish your next reel during peak window: Wednesday at 6:30 PM.',
      'Feature your top converted service card at position #1 in Bio.'
    ],
    timestamp: '10:24 AM',
  }
];

const AskSuvixContext = createContext<AskSuvixContextType | undefined>(undefined);

export const AskSuvixProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('My analytics');

  const formatCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const generateAiResponse = (userText: string): ChatMessage => {
    const lower = userText.toLowerCase();
    const time = formatCurrentTime();

    if (lower.includes('brand') || lower.includes('sponsor') || lower.includes('opportunity')) {
      return {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        title: 'Brand Opportunities & Matchmaking',
        text: 'We found 3 high-match brand collaboration campaigns tailored for your creator niche on SuviX with budgets ranging from $750 to $1,800.',
        metrics: [
          { label: 'Match Score', value: '96%' },
          { label: 'Open Deals', value: '3 Active' },
          { label: 'Est. Revenue', value: '$1,450' }
        ],
        actionTips: [
          'Submit your verified media kit to the TechGear campaign.',
          'Add a dedicated brand pitch link on your SuviX Bio page.'
        ],
        timestamp: time
      };
    }

    if (lower.includes('earn') || lower.includes('money') || lower.includes('revenue')) {
      return {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        title: 'Monetization Strategy Insights',
        text: 'Your current RPM is 18% above industry median. Adding digital asset checkout in your Link in Bio will unlock an estimated +$620/mo in direct sales.',
        metrics: [
          { label: 'Current RPM', value: '$8.40' },
          { label: 'Projected +', value: '+$620/mo' }
        ],
        actionTips: [
          'Enable 1-click digital product checkout on your Link in Bio.',
          'Bundle preset packs or project templates for your top followers.'
        ],
        timestamp: time
      };
    }

    if (lower.includes('idea') || lower.includes('suggest') || lower.includes('content')) {
      return {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        title: 'Trending Content Strategy',
        text: 'Workflow breakdowns and "Behind the Scenes" tool reviews are generating 3.8x more shares this week across YouTube & Instagram.',
        actionTips: [
          'Record a 45-second reel showing your favorite creative shortcuts.',
          'Run a community poll on your next topic to boost algorithmic engagement.'
        ],
        timestamp: time
      };
    }

    const promptSnippet = userText.length > 70 ? `${userText.slice(0, 70)}...` : userText;

    return {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      title: 'SuviX AI Strategic Insights',
      text: `Analyzed your inquiry regarding "${promptSnippet}". Based on current creator ecosystem benchmarks and your live profile statistics, here is your tailored action plan:`,
      metrics: [
        { label: 'Impact Score', value: 'High' },
        { label: 'Growth Signal', value: '+22%' }
      ],
      actionTips: [
        'Apply these recommendations in your next content publishing cycle.',
        'Track live conversion signals in your Creator Tools dashboard.'
      ],
      timestamp: time
    };
  };

  const sendMessage = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const time = formatCurrentTime();
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: time
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsAnalyzing(true);

    setTimeout(() => {
      const aiReply = generateAiResponse(trimmed);
      setMessages((prev) => [...prev, aiReply]);
      setIsAnalyzing(false);
    }, 850);
  }, []);

  const openAskSuvix = useCallback((initialPrompt?: string) => {
    setIsExpanded(true);
    if (initialPrompt && initialPrompt.trim()) {
      sendMessage(initialPrompt.trim());
    }
  }, [sendMessage]);

  const closeAskSuvix = useCallback(() => {
    setIsExpanded(false);
  }, []);

  return (
    <AskSuvixContext.Provider
      value={{
        isExpanded,
        setIsExpanded,
        openAskSuvix,
        closeAskSuvix,
        messages,
        sendMessage,
        isAnalyzing,
        activeCategory,
        setActiveCategory
      }}
    >
      {children}
    </AskSuvixContext.Provider>
  );
};

export const useAskSuvix = () => {
  const context = useContext(AskSuvixContext);
  if (!context) {
    throw new Error('useAskSuvix must be used within an AskSuvixProvider');
  }
  return context;
};
