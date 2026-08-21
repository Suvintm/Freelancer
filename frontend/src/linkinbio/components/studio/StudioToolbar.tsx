import React from 'react';
import { ArrowLeft, Sparkles, Check, Loader2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface StudioToolbarProps {
  templateName: string;
  isPublishing: boolean;
  publishSuccess: boolean;
  onPublish: () => void;
  publicUsername?: string;
}

export const StudioToolbar: React.FC<StudioToolbarProps> = ({
  templateName,
  isPublishing,
  publishSuccess,
  onPublish,
  publicUsername = 'username'
}) => {
  const navigate = useNavigate();

  return (
    <header className="h-14 border-b border-border-main/60 bg-container px-4 flex items-center justify-between shrink-0 select-none">
      {/* Left: Back & Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/link-in-bio')}
          className="w-8 h-8 rounded-xl border border-border-main flex items-center justify-center text-text-muted hover:text-text-main hover:bg-surface transition-all cursor-pointer"
          title="Back to Hub"
        >
          <ArrowLeft size={15} />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-text-main tracking-tight">
              Creator Studio
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {templateName}
            </span>
          </div>
          <p className="text-[10px] text-text-muted font-mono hidden sm:block">
            suvix.link/{publicUsername}
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => window.open(`/${publicUsername}`, '_blank')}
          className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-xl border border-border-main text-xs font-semibold text-text-muted hover:text-text-main hover:bg-surface transition-all"
        >
          <ExternalLink size={12} />
          <span>View Public</span>
        </button>

        <button
          type="button"
          disabled={isPublishing}
          onClick={onPublish}
          className={`h-9 px-5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all active:scale-95 shadow-md cursor-pointer ${
            publishSuccess
              ? 'bg-emerald-500 text-white'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
          }`}
        >
          {isPublishing ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              <span>Publishing...</span>
            </>
          ) : publishSuccess ? (
            <>
              <Check size={13} />
              <span>Published Live!</span>
            </>
          ) : (
            <>
              <Sparkles size={13} />
              <span>Publish Page</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};

export default StudioToolbar;
