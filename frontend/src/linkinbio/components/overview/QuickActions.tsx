import React, { useState } from 'react';
import { Edit3, ExternalLink, Share2, Check, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuickActionsProps {
  publicUrl: string;
  username: string;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ publicUrl, username }) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      {/* Primary Edit Button */}
      <button
        type="button"
        onClick={() => navigate('/link-in-bio/design')}
        className="flex-1 sm:flex-none h-11 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
      >
        <Edit3 size={14} />
        <span>Customize Profile Design</span>
      </button>

      {/* Copy Link Button */}
      <button
        type="button"
        onClick={handleCopy}
        className="flex-1 sm:flex-none h-11 px-4 rounded-xl border border-border-main hover:bg-surface text-text-main text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
        <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
      </button>

      {/* View Public Live */}
      <button
        type="button"
        onClick={() => window.open(`/${username}`, '_blank')}
        className="flex-1 sm:flex-none h-11 px-4 rounded-xl border border-border-main hover:bg-surface text-text-muted hover:text-text-main text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        <ExternalLink size={14} />
        <span>View Live</span>
      </button>
    </div>
  );
};

export default QuickActions;
