import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectUser } from '../../store/slices/authSlice';
import ProfileStats from '../components/overview/ProfileStats';
import CurrentDesignCard from '../components/overview/CurrentDesignCard';
import QuickActions from '../components/overview/QuickActions';
import { Sparkles, ArrowRight, Layers, BarChart3, Edit3 } from 'lucide-react';
import { DEFAULT_TEMPLATE_SLUG } from '../templates/registry';

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useSelector(selectUser);

  // Load saved profile configuration from local storage
  const savedData = useMemo(() => {
    try {
      const key = currentUser?.id ? `suvix_link_in_bio_config_${currentUser.id}` : 'suvix_link_in_bio_config_default';
      const item = localStorage.getItem(key);
      if (item) return JSON.parse(item);
    } catch (e) {
      console.warn('Error reading saved profile', e);
    }
    return null;
  }, [currentUser]);

  const isCreated = Boolean(savedData);
  const templateSlug = savedData?.templateSlug || DEFAULT_TEMPLATE_SLUG;
  const themeConfig = savedData?.themeConfig || {};
  const blocks = savedData?.blocks || [];
  const creator = savedData?.creator || {
    id: currentUser?.id || 'guest',
    username: currentUser?.username || 'nunabeauty',
    displayName: currentUser?.name || 'Nuna Beauty',
    bio: currentUser?.bio || 'Welcome to our link in bio page made on Many.bio!',
    profilePicture: currentUser?.profilePicture || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    isVerified: Boolean(currentUser?.is_verified),
  };

  const publicUrl = `https://suvix.link/${creator.username}`;

  return (
    <div className="w-full flex flex-col gap-8 select-none">
      {/* ── Hub Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-main/50 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-text-main">
              Link in Bio Hub
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              {isCreated ? 'Live Profile' : 'Setup Required'}
            </span>
          </div>
          <p className="text-xs text-text-muted mt-1 font-semibold">
            Manage your personal creator bio-link, customize themes, and track page analytics.
          </p>
        </div>

        {isCreated && (
          <QuickActions publicUrl={publicUrl} username={creator.username} />
        )}
      </div>

      {/* ── Main Layout: Onboarding or Active Dashboard ── */}
      {!isCreated ? (
        /* Empty / Onboarding State */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 text-[10px] font-bold uppercase tracking-wider">
              <Sparkles size={11} />
              <span>Production Feature</span>
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tight leading-tight text-text-main">
                Build your personal public creator page
              </h2>
              <p className="text-sm leading-relaxed text-text-muted">
                Consolidate your social channels, YouTube videos, Instagram posts, and custom links into one fast, mobile-optimized landing page designed with rich themes.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-4 rounded-2xl bg-surface/50 border border-border-main/60 space-y-1">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Layers size={16} />
                  <span className="text-xs font-bold text-text-main">Modular Templates</span>
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Choose from Minimal, Neon Glow, and Portfolio Pro layouts with custom editors.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-surface/50 border border-border-main/60 space-y-1">
                <div className="flex items-center gap-2 text-emerald-400">
                  <BarChart3 size={16} />
                  <span className="text-xs font-bold text-text-main">Live Analytics</span>
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Track visits, click-through rates, and see what links your audience loves.
                </p>
              </div>
            </div>

            <div className="pt-3">
              <button
                type="button"
                onClick={() => navigate('/link-in-bio/design')}
                className="h-12 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <span>Launch Creator Studio</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col items-center justify-center sticky top-6 self-start">
            <CurrentDesignCard
              templateSlug={templateSlug || DEFAULT_TEMPLATE_SLUG}
              creator={creator}
              blocks={blocks}
              theme={themeConfig}
              publicUrl={publicUrl}
            />
          </div>
        </div>
      ) : (
        /* Live Dashboard State */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Analytics & Links List */}
          <div className="lg:col-span-7 space-y-6">
            {/* Real-time stats */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold text-text-main uppercase tracking-wider">
                Performance Analytics
              </h3>
              <ProfileStats views={2480} clicks={614} ctr="24.8%" />
            </div>

            {/* Active links list */}
            <div className="space-y-3 p-4 rounded-2xl bg-surface/40 border border-border-main/60">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-text-main uppercase tracking-wider">
                  Active Links ({blocks.filter((b: any) => b.isVisible).length})
                </h3>
                <button
                  type="button"
                  onClick={() => navigate('/link-in-bio/design')}
                  className="text-xs font-bold text-indigo-500 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 size={11} />
                  <span>Edit Links in Studio</span>
                </button>
              </div>

              <div className="space-y-2">
                {blocks.filter((b: any) => b.isVisible).map((b: any) => (
                  <div
                    key={b.id}
                    className="p-3.5 rounded-xl bg-surface border border-border-main/50 flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-3">
                      <p className="text-xs font-semibold text-text-main truncate">{b.title}</p>
                      <p className="text-[10px] font-mono text-text-muted truncate">{b.url}</p>
                    </div>
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
                      {b.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Live Mockup Preview */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center sticky top-6 self-start">
            <CurrentDesignCard
              templateSlug={templateSlug}
              creator={creator}
              blocks={blocks}
              theme={themeConfig}
              publicUrl={publicUrl}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default OverviewPage;
