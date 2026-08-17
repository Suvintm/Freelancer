import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { STARTER_TEMPLATES } from '../../registry/templateRegistry';
import type { Template } from '../../types/template.types';
import { TemplateCard } from './TemplateCard';
import { TemplatePreviewModal } from './TemplatePreviewModal';
import { 
  X, 
  Search, 
  Layers, 
  ArrowRight, 
  Globe, 
  Check, 
  AlertCircle 
} from 'lucide-react';

interface TemplatePickerModalProps {
  isOpen: boolean;
  username?: string;
  onClose: () => void;
  onCreatePage: (templateId: string, pageTitle: string, pageSlug: string) => void;
}

const CATEGORIES: { id: string; label: string }[] = [
  { id: 'all', label: 'All Templates' },
  { id: 'creator', label: 'Creator & Influencer' },
  { id: 'commerce', label: 'Commerce & Shop' },
  { id: 'podcast', label: 'Podcast & Audio' },
  { id: 'music', label: 'Music & Artists' },
  { id: 'blank', label: 'Blank Canvas' },
];

export const TemplatePickerModal: React.FC<TemplatePickerModalProps> = ({
  isOpen,
  username = 'creator',
  onClose,
  onCreatePage,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  
  // Selection & Configuration Step
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [pageTitle, setPageTitle] = useState<string>('');
  const [pageSlug, setPageSlug] = useState<string>('');
  const [slugError, setSlugError] = useState<string | null>(null);

  // Prevent background body scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Filter templates based on category & search
  const filteredTemplates = useMemo(() => {
    return STARTER_TEMPLATES.filter((tpl) => {
      const matchesCategory =
        selectedCategory === 'all' ||
        tpl.category === selectedCategory ||
        (selectedCategory === 'blank' && tpl.id === 'blank');

      const matchesSearch =
        searchQuery.trim() === '' ||
        tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    if (!pageTitle) {
      setPageTitle(template.id === 'blank' ? 'My Bio Page' : `${template.name} Bio`);
    }
    if (!pageSlug) {
      setPageSlug(template.id === 'blank' ? 'bio' : template.category === 'creator' ? 'main' : template.category);
    }
  };

  const handleSlugChange = (val: string) => {
    const sanitized = val.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setPageSlug(sanitized);
    if (sanitized.length < 2) {
      setSlugError('Slug must be at least 2 characters.');
    } else {
      setSlugError(null);
    }
  };

  const handleCreate = () => {
    if (!selectedTemplate) return;
    const finalTitle = pageTitle.trim() || selectedTemplate.name;
    const finalSlug = pageSlug.trim() || 'bio';

    if (finalSlug.length < 2) {
      setSlugError('Slug must be at least 2 characters.');
      return;
    }

    onCreatePage(selectedTemplate.id, finalTitle, finalSlug);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        data-lenis-prevent="true"
        data-lenis-prevent-wheel="true"
        data-lenis-prevent-touch="true"
        onWheel={(e) => e.stopPropagation()}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-40"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', duration: 0.3 }}
          data-lenis-prevent="true"
          className="relative z-50 w-full max-w-4xl max-h-[86vh] flex flex-col rounded-2xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden font-sans"
        >
          {/* Header */}
          <div className="px-5 py-3 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-zinc-900/50 shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-sky-500/10 text-sky-500 border border-sky-500/20">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  Choose a Starting Template
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Select a tailored layout or start with a clean blank canvas.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Search & Category Tabs Bar */}
          <div className="px-5 py-2.5 border-b border-slate-100 dark:border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 bg-white dark:bg-[#111114] shrink-0">
            {/* Category Pills */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar w-full sm:w-auto py-0.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                      : 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-56 shrink-0">
              <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-7 pr-2.5 py-1 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-[11px] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white"
              />
            </div>
          </div>

          {/* Body: Template Grid + Right Configuration Step */}
          <div 
            data-lenis-prevent="true"
            onWheel={(e) => e.stopPropagation()}
            className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-4 bg-slate-50/40 dark:bg-zinc-950/40"
          >
            {/* Templates Catalog */}
            <div className={`${selectedTemplate ? 'lg:col-span-8' : 'lg:col-span-12'} grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5`}>
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isSelected={selectedTemplate?.id === template.id}
                  onPreview={(tpl) => setPreviewTemplate(tpl)}
                  onSelect={handleSelectTemplate}
                />
              ))}

              {filteredTemplates.length === 0 && (
                <div className="col-span-full py-10 flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-900 flex items-center justify-center text-slate-400 mb-2">
                    <Search className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                    No templates found
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                    Try searching with different keywords or switch categories.
                  </p>
                </div>
              )}
            </div>

            {/* Selected Template Page Setup Drawer (4 cols when active) */}
            {selectedTemplate && (
              <div className="lg:col-span-4 rounded-xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 p-4 shadow-xs flex flex-col justify-between space-y-3.5 animate-in fade-in duration-200 sticky top-0 self-start">
                <div>
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-zinc-800/80">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px]">
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[140px]">
                        {selectedTemplate.name}
                      </span>
                    </div>

                    <button
                      onClick={() => setSelectedTemplate(null)}
                      className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 cursor-pointer"
                    >
                      Change
                    </button>
                  </div>

                  {/* Form Inputs */}
                  <div className="space-y-2.5 mt-3">
                    {/* Page Title */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                        Page Title
                      </label>
                      <input
                        type="text"
                        value={pageTitle}
                        onChange={(e) => setPageTitle(e.target.value)}
                        placeholder="e.g. Summer Collection"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white"
                      />
                    </div>

                    {/* Page Custom Slug */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                        Custom URL Slug
                      </label>
                      <div className="flex items-center rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-2.5 py-1.5 focus-within:ring-1 focus-within:ring-slate-900 dark:focus-within:ring-white">
                        <span className="text-[10.5px] text-slate-400 font-mono">
                          suvix.me/{username}/
                        </span>
                        <input
                          type="text"
                          value={pageSlug}
                          onChange={(e) => handleSlugChange(e.target.value)}
                          placeholder="slug"
                          className="w-full bg-transparent text-[11px] text-slate-900 dark:text-white font-mono focus:outline-none pl-0.5"
                        />
                      </div>

                      {slugError ? (
                        <p className="text-[10px] text-rose-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-2.5 h-2.5" />
                          {slugError}
                        </p>
                      ) : (
                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 flex items-center gap-1 truncate">
                          <Globe className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                          suvix.me/{username}/{pageSlug || 'slug'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Final Create Action */}
                <div className="pt-3 border-t border-slate-100 dark:border-zinc-800">
                  <button
                    onClick={handleCreate}
                    className="w-full py-2 px-3 rounded-lg bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-bold transition-all active:scale-95 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Create & Open Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Live Device Full Preview Modal */}
        <TemplatePreviewModal
          template={previewTemplate}
          isOpen={!!previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          onSelect={(tpl) => {
            handleSelectTemplate(tpl);
            setPreviewTemplate(null);
          }}
        />
      </div>
    </AnimatePresence>
  );
};
