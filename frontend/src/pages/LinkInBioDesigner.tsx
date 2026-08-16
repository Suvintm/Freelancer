import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { selectUser } from '../store/slices/authSlice';
import { useTheme } from '../hooks/useTheme';
import defaultProfile from '../assets/defaultprofile.png';
import { templateRegistry } from './link-in-bio/templates.tsx';
import type { TemplateKey, ResolvedTheme, LinkBlock } from './link-in-bio/templates.tsx';
import { 
  Link as LinkIcon, Plus, Trash2, ArrowUp, ArrowDown, Eye, Globe, 
  Youtube, Instagram, Sparkles, Check, Edit2, ArrowLeft, Paintbrush, 
  Settings as SettingsIcon, Image, Sliders, LayoutGrid, Info
} from 'lucide-react';

const FONTS_LIST = ['Inter', 'Poppins', 'Playfair Display', 'JetBrains Mono'];

const BACKGROUND_PRESETS = [
  { name: 'Aurora Waves', type: 'gradient', value: 'linear-gradient(to bottom right, #4facfe 0%, #00f2fe 100%)' },
  { name: 'Sunset Glow', type: 'gradient', value: 'linear-gradient(to bottom, #ff9966, #ff5e62)' },
  { name: 'Glassy Twilight', type: 'gradient', value: 'linear-gradient(to top, #30cfd0 0%, #330867 100%)' },
  { name: 'Neon Cyber', type: 'solid', value: '#09090b' },
  { name: 'Clean Light', type: 'solid', value: '#f9fafb' },
  { name: 'Forest Mist', type: 'image', value: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80' },
  { name: 'Abstract Art', type: 'image', value: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=600&q=80' }
];

export default function LinkInBioDesigner() {
  const { userId } = useParams<{ userId: string }>();
  const user = useSelector(selectUser);
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  // Selected Sidebar Tab: 'templates' | 'theme' | 'blocks' | 'profile'
  const [activeTab, setActiveTab] = useState<'templates' | 'theme' | 'blocks' | 'profile'>('templates');

  // Core Configuration States
  const [displayName, setDisplayName] = useState(user?.name || 'Your Name');
  const [bio, setBio] = useState('Professional Creator · Welcome to my hub! 🚀');
  const [templateKey, setTemplateKey] = useState<TemplateKey>('minimal-v1');
  const [themeSettings, setThemeSettings] = useState<ResolvedTheme>({
    primaryColor: '#ffffff',
    secondaryColor: '#6366f1',
    backgroundColor: '#09090b',
    textColor: '#09090b',
    fontFamily: 'Inter',
    borderRadius: 12,
    spacing: 12,
    shadowIntensity: 1,
    backgroundType: 'gradient',
    backgroundValue: 'linear-gradient(to bottom right, #4facfe 0%, #00f2fe 100%)'
  });

  const [links, setLinks] = useState<LinkBlock[]>([
    { id: '1', type: 'LINK', title: 'My Personal Portfolio', url: 'https://mysite.com', isVisible: true },
    { id: '2', type: 'YOUTUBE_CHANNEL', title: 'Subscribe to my YouTube', url: 'https://youtube.com', isVisible: true },
    { id: '3', type: 'INSTAGRAM_PROFILE', title: 'Follow me on Instagram', url: 'https://instagram.com', isVisible: true }
  ]);

  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newType, setNewType] = useState<'LINK' | 'YOUTUBE_CHANNEL' | 'INSTAGRAM_PROFILE'>('LINK');
  const [publishSuccess, setPublishSuccess] = useState(false);

  // Load existing configuration from localStorage if available
  useEffect(() => {
    const savedConfig = localStorage.getItem(`suvix_link_in_bio_config_${userId || user?.id}`);
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setDisplayName(parsed.displayName || user?.name || 'Your Name');
        setBio(parsed.bio || '');
        if (parsed.templateKey) setTemplateKey(parsed.templateKey);
        if (parsed.themeSettings) {
          setThemeSettings({
            ...themeSettings,
            ...parsed.themeSettings
          });
        }
        setLinks(parsed.links || []);
      } catch (e) {
        console.error('Failed to parse link-in-bio config', e);
      }
    }
  }, [userId, user]);

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;

    let formattedUrl = newUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const newBlock: LinkBlock = {
      id: Date.now().toString(),
      type: newType,
      title: newTitle,
      url: formattedUrl,
      isVisible: true
    };

    setLinks([...links, newBlock]);
    setNewTitle('');
    setNewUrl('');
    setNewType('LINK');
  };

  const handleDeleteLink = (id: string) => {
    setLinks(links.filter(l => l.id !== id));
  };

  const toggleVisibility = (id: string) => {
    setLinks(links.map(l => l.id === id ? { ...l, isVisible: !l.isVisible } : l));
  };

  const moveLink = (index: number, direction: 'up' | 'down') => {
    const updatedLinks = [...links];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= links.length) return;
    
    const temp = updatedLinks[index];
    updatedLinks[index] = updatedLinks[targetIndex];
    updatedLinks[targetIndex] = temp;
    
    setLinks(updatedLinks);
  };

  const handlePublish = () => {
    const config = {
      isCreated: true,
      displayName,
      bio,
      templateKey,
      themeSettings,
      links,
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem(`suvix_link_in_bio_config_${userId || user?.id}`, JSON.stringify(config));
    
    setPublishSuccess(true);
    setTimeout(() => {
      setPublishSuccess(false);
      navigate('/link-in-bio');
    }, 1500);
  };

  const updateThemeSetting = (key: keyof ResolvedTheme, value: any) => {
    setThemeSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Dynamic CSS Variables injection
  const inlineCssVars = useMemo(() => {
    const fontMapping = (font: string) => {
      switch (font) {
        case 'Playfair Display': return '"Playfair Display", serif';
        case 'JetBrains Mono': return '"JetBrains Mono", monospace';
        case 'Poppins': return '"Poppins", sans-serif';
        default: return '"Inter", sans-serif';
      }
    };

    return {
      '--pp-primary': themeSettings.primaryColor,
      '--pp-secondary': themeSettings.secondaryColor,
      '--pp-bg': themeSettings.backgroundType === 'solid' ? themeSettings.backgroundColor : 'transparent',
      '--pp-text': themeSettings.textColor,
      '--pp-font': fontMapping(themeSettings.fontFamily),
      '--pp-radius': `${themeSettings.borderRadius}px`,
      '--pp-spacing': `${themeSettings.spacing}px`
    } as React.CSSProperties;
  }, [themeSettings]);

  // Background style computation
  const canvasBackgroundStyle = useMemo(() => {
    const style: React.CSSProperties = {};
    if (themeSettings.backgroundType === 'solid') {
      style.backgroundColor = themeSettings.backgroundColor;
    } else if (themeSettings.backgroundType === 'gradient') {
      style.backgroundImage = themeSettings.backgroundValue;
    } else if (themeSettings.backgroundType === 'image') {
      style.backgroundImage = `url(${themeSettings.backgroundValue})`;
      style.backgroundSize = 'cover';
      style.backgroundPosition = 'center';
    }
    return style;
  }, [themeSettings]);

  const SelectedTemplateComponent = templateRegistry[templateKey] || templateRegistry['minimal-v1'];

  return (
    <div className="w-full h-full flex flex-col gap-6 select-none p-6 max-w-6xl mx-auto overflow-hidden">
      
      {/* ── Header Area ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-main/50 pb-5">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/link-in-bio')}
            className={`
              h-10 w-10 rounded-xl flex items-center justify-center border transition-all active:scale-95 cursor-pointer
              ${isDarkMode 
                ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800' 
                : 'bg-white border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'}
            `}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className={`text-2xl font-bold tracking-tight text-text-main`}>
              Design Your Bio Page
            </h1>
            <p className="text-xs text-text-muted mt-1 font-semibold">
              Customize layouts, color themes, backgrounds, and links in real-time.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={handlePublish}
            className={`
              w-full sm:w-auto h-10 px-6 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all active:scale-[0.98] cursor-pointer shadow-md
              ${publishSuccess 
                ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                : (isDarkMode ? 'bg-white text-black hover:bg-zinc-200' : 'bg-zinc-950 text-white hover:bg-zinc-900')}
            `}
          >
            {publishSuccess ? <Check size={14} /> : <Sparkles size={14} />}
            {publishSuccess ? 'Page Published!' : 'Publish Page'}
          </button>
        </div>
      </div>

      {/* ── Split Grid Layout ── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden min-h-0">
        
        {/* Left column: Editor Sidebar with Tab Navigation */}
        <div className="lg:col-span-7 h-full overflow-y-auto pr-2 scrollbar-hide flex flex-col gap-5 py-2">
          
          {/* Tab Selection */}
          <div className="flex border-b border-border-main/50 pb-2 gap-2">
            {[
              { id: 'templates', label: 'Templates', icon: LayoutGrid },
              { id: 'theme', label: 'Theme Customize', icon: Paintbrush },
              { id: 'profile', label: 'Profile Info', icon: Edit2 },
              { id: 'blocks', label: 'Links & Blocks', icon: LinkIcon }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-bold transition-all duration-200 cursor-pointer border
                    ${isActive 
                      ? (isDarkMode ? 'bg-white border-white text-black' : 'bg-zinc-950 border-zinc-950 text-white')
                      : (isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white' : 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 shadow-sm')}
                  `}
                >
                  <Icon size={13} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Contents */}
          <div className="space-y-5">
            
            {/* 1. Templates selector */}
            {activeTab === 'templates' && (
              <div className={`p-6 rounded-[28px] border ${isDarkMode ? 'bg-black border-border-main' : 'bg-white border-zinc-200 shadow-sm'} space-y-4`}>
                <div className="flex items-center gap-1.5 text-xs font-bold text-text-muted uppercase tracking-wider">
                  <LayoutGrid size={12} />
                  <span>Choose Layout Template</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { id: 'minimal-v1', name: 'Minimalist Slate', desc: 'Flat elegant shapes and high-contrast spacing.' },
                    { id: 'neon-glow-v1', name: 'Neon Cyberpunk', desc: 'Monochrome obsidian boxes with cyan glow accents.' },
                    { id: 'glassmorphism-v1', name: 'Glassmorphism', desc: 'Futuristic glass panels over beautiful gradient waves.' },
                    { id: 'solid-obsidian-v1', name: 'Solid Obsidian', desc: 'Premium flat dark aesthetic with distinct outline styles.' },
                    { id: 'coral-sunset-v1', name: 'Coral Sunset', desc: 'Warm gradients paired with elegant serif text layout.' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTemplateKey(t.id as TemplateKey)}
                      className={`
                        p-4 rounded-2xl border text-left flex flex-col gap-2 transition-all cursor-pointer
                        ${templateKey === t.id 
                          ? (isDarkMode ? 'border-white bg-zinc-950' : 'border-zinc-950 bg-zinc-50')
                          : (isDarkMode ? 'border-zinc-800 bg-black hover:bg-zinc-950' : 'border-zinc-200 bg-white hover:bg-zinc-50')}
                      `}
                    >
                      <span className="text-xs font-bold text-text-main flex items-center gap-2">
                        {t.name}
                        {templateKey === t.id && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
                      </span>
                      <p className="text-[10px] text-text-muted leading-relaxed font-semibold">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Theme Customizer */}
            {activeTab === 'theme' && (
              <div className="space-y-5">
                {/* Visual Colors & Fonts */}
                <div className={`p-6 rounded-[28px] border ${isDarkMode ? 'bg-black border-border-main' : 'bg-white border-zinc-200 shadow-sm'} space-y-4`}>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-text-muted uppercase tracking-wider">
                    <Paintbrush size={12} />
                    <span>Visual Design & Colors</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Primary Button BG */}
                    <div>
                      <label className="text-[11px] font-bold text-text-muted block mb-1">Button Background</label>
                      <div className="flex gap-2">
                        <input 
                          type="color" 
                          value={themeSettings.primaryColor}
                          onChange={(e) => updateThemeSetting('primaryColor', e.target.value)}
                          className="w-10 h-10 rounded-xl cursor-pointer border border-border-main"
                        />
                        <input 
                          type="text" 
                          value={themeSettings.primaryColor}
                          onChange={(e) => updateThemeSetting('primaryColor', e.target.value)}
                          className={`w-full h-10 px-3.5 rounded-xl border text-xs font-semibold focus:outline-none transition-colors ${
                            isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Button Text Color */}
                    <div>
                      <label className="text-[11px] font-bold text-text-muted block mb-1">Button Text</label>
                      <div className="flex gap-2">
                        <input 
                          type="color" 
                          value={themeSettings.textColor}
                          onChange={(e) => updateThemeSetting('textColor', e.target.value)}
                          className="w-10 h-10 rounded-xl cursor-pointer border border-border-main"
                        />
                        <input 
                          type="text" 
                          value={themeSettings.textColor}
                          onChange={(e) => updateThemeSetting('textColor', e.target.value)}
                          className={`w-full h-10 px-3.5 rounded-xl border text-xs font-semibold focus:outline-none transition-colors ${
                            isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Accent color */}
                    <div>
                      <label className="text-[11px] font-bold text-text-muted block mb-1">Accent Highlight</label>
                      <div className="flex gap-2">
                        <input 
                          type="color" 
                          value={themeSettings.secondaryColor}
                          onChange={(e) => updateThemeSetting('secondaryColor', e.target.value)}
                          className="w-10 h-10 rounded-xl cursor-pointer border border-border-main"
                        />
                        <input 
                          type="text" 
                          value={themeSettings.secondaryColor}
                          onChange={(e) => updateThemeSetting('secondaryColor', e.target.value)}
                          className={`w-full h-10 px-3.5 rounded-xl border text-xs font-semibold focus:outline-none transition-colors ${
                            isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Typography Font family */}
                    <div>
                      <label className="text-[11px] font-bold text-text-muted block mb-1">Font Family</label>
                      <select
                        value={themeSettings.fontFamily}
                        onChange={(e) => updateThemeSetting('fontFamily', e.target.value)}
                        className={`w-full h-10 px-3 rounded-xl border text-xs font-semibold focus:outline-none transition-colors ${
                          isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                        }`}
                      >
                        {FONTS_LIST.map(f => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Layout Configurations */}
                <div className={`p-6 rounded-[28px] border ${isDarkMode ? 'bg-black border-border-main' : 'bg-white border-zinc-200 shadow-sm'} space-y-4`}>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-text-muted uppercase tracking-wider">
                    <Sliders size={12} />
                    <span>Layout Settings</span>
                  </div>

                  <div className="space-y-4">
                    {/* Border radius */}
                    <div>
                      <div className="flex justify-between text-[11px] font-bold text-text-muted mb-1">
                        <span>Button Corner Rounding</span>
                        <span>{themeSettings.borderRadius}px</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="32" 
                        value={themeSettings.borderRadius}
                        onChange={(e) => updateThemeSetting('borderRadius', parseInt(e.target.value))}
                        className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                    </div>

                    {/* Block spacing */}
                    <div>
                      <div className="flex justify-between text-[11px] font-bold text-text-muted mb-1">
                        <span>Vertical Block Spacing</span>
                        <span>{themeSettings.spacing}px</span>
                      </div>
                      <input 
                        type="range" 
                        min="8" 
                        max="24" 
                        value={themeSettings.spacing}
                        onChange={(e) => updateThemeSetting('spacing', parseInt(e.target.value))}
                        className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                    </div>

                    {/* Shadow Intensity */}
                    <div>
                      <div className="flex justify-between text-[11px] font-bold text-text-muted mb-1">
                        <span>Card Shadow Depth</span>
                        <span>{themeSettings.shadowIntensity}x</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="4" 
                        step="0.5"
                        value={themeSettings.shadowIntensity}
                        onChange={(e) => updateThemeSetting('shadowIntensity', parseFloat(e.target.value))}
                        className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Background configs */}
                <div className={`p-6 rounded-[28px] border ${isDarkMode ? 'bg-black border-border-main' : 'bg-white border-zinc-200 shadow-sm'} space-y-4`}>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-text-muted uppercase tracking-wider">
                    <Image size={12} />
                    <span>Background Type & Styling</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {['solid', 'gradient', 'image'].map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          updateThemeSetting('backgroundType', t);
                          if (t === 'solid') updateThemeSetting('backgroundValue', '#09090b');
                          else if (t === 'gradient') updateThemeSetting('backgroundValue', BACKGROUND_PRESETS[0].value);
                          else updateThemeSetting('backgroundValue', BACKGROUND_PRESETS[5].value);
                        }}
                        className={`
                          py-2 rounded-xl border text-xs font-bold uppercase transition-all cursor-pointer
                          ${themeSettings.backgroundType === t
                            ? (isDarkMode ? 'bg-white border-white text-black' : 'bg-zinc-950 border-zinc-950 text-white')
                            : (isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white' : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50')}
                        `}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  {/* Preset Background Selectors */}
                  <div>
                    <label className="text-[11px] font-bold text-text-muted block mb-2">Preset Canvas Backdrops</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {BACKGROUND_PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          onClick={() => {
                            updateThemeSetting('backgroundType', preset.type);
                            updateThemeSetting('backgroundValue', preset.value);
                            if (preset.type === 'solid') {
                              updateThemeSetting('backgroundColor', preset.value);
                            }
                          }}
                          className={`
                            p-2.5 rounded-xl border flex flex-col gap-1 items-center justify-center text-center cursor-pointer transition-all
                            ${isDarkMode ? 'border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900' : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100'}
                          `}
                        >
                          <div 
                            className="w-10 h-10 rounded-lg shadow-sm border border-black/10 shrink-0" 
                            style={{ 
                              background: preset.type === 'image' ? `url(${preset.value}) center/cover` : preset.value,
                              backgroundColor: preset.type === 'solid' ? preset.value : undefined
                            }} 
                          />
                          <span className="text-[9px] font-bold truncate w-full text-text-muted mt-0.5">{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Manual Value Entry */}
                  <div>
                    <label className="text-[11px] font-bold text-text-muted block mb-1">
                      {themeSettings.backgroundType === 'solid' && 'Solid Color Hex'}
                      {themeSettings.backgroundType === 'gradient' && 'CSS Gradient Code'}
                      {themeSettings.backgroundType === 'image' && 'Background Image URL'}
                    </label>
                    {themeSettings.backgroundType === 'solid' ? (
                      <div className="flex gap-2">
                        <input 
                          type="color" 
                          value={themeSettings.backgroundColor}
                          onChange={(e) => {
                            updateThemeSetting('backgroundColor', e.target.value);
                            updateThemeSetting('backgroundValue', e.target.value);
                          }}
                          className="w-10 h-10 rounded-xl cursor-pointer border border-border-main"
                        />
                        <input 
                          type="text" 
                          value={themeSettings.backgroundColor}
                          onChange={(e) => {
                            updateThemeSetting('backgroundColor', e.target.value);
                            updateThemeSetting('backgroundValue', e.target.value);
                          }}
                          className={`w-full h-10 px-3.5 rounded-xl border text-xs font-semibold focus:outline-none transition-colors ${
                            isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                          }`}
                        />
                      </div>
                    ) : (
                      <input 
                        type="text" 
                        value={themeSettings.backgroundValue}
                        onChange={(e) => updateThemeSetting('backgroundValue', e.target.value)}
                        className={`w-full h-10 px-3.5 rounded-xl border text-xs font-semibold focus:outline-none transition-colors ${
                          isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                        }`}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 3. Profile Information */}
            {activeTab === 'profile' && (
              <div className={`p-6 rounded-[28px] border ${isDarkMode ? 'bg-black border-border-main' : 'bg-white border-zinc-200 shadow-sm'} space-y-4`}>
                <div className="flex items-center gap-1.5 text-xs font-bold text-text-muted uppercase tracking-wider">
                  <Info size={12} />
                  <span>Profile Header Information</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <div className="md:col-span-3 flex justify-center">
                    <img 
                      src={user?.profilePicture || defaultProfile} 
                      alt="Profile Avatar" 
                      className={`w-20 h-20 rounded-full object-cover border-4 ${isDarkMode ? 'border-zinc-900' : 'border-zinc-100'} shadow-md`}
                    />
                  </div>
                  <div className="md:col-span-9 space-y-3">
                    <div>
                      <label className="text-[11px] font-bold text-text-muted block mb-1">Display Name</label>
                      <input 
                        type="text" 
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className={`w-full h-10 px-3.5 rounded-xl border text-xs font-semibold focus:outline-none transition-colors ${
                          isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white focus:border-zinc-700' : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-zinc-400'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-text-muted block mb-1">Bio Description</label>
                      <textarea 
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={2}
                        className={`w-full p-3 rounded-xl border text-xs font-semibold focus:outline-none transition-colors resize-none ${
                          isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white focus:border-zinc-700' : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-zinc-400'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Blocks list builder */}
            {activeTab === 'blocks' && (
              <div className="space-y-5">
                {/* Add new block form */}
                <form onSubmit={handleAddLink} className={`p-6 rounded-[28px] border ${isDarkMode ? 'bg-black border-border-main' : 'bg-white border-zinc-200 shadow-sm'} space-y-4`}>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-text-muted uppercase tracking-wider">
                    <Plus size={12} />
                    <span>Create a Link Block</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-3">
                      <select
                        value={newType}
                        onChange={(e) => setNewType(e.target.value as any)}
                        className={`w-full h-10 px-3 rounded-xl border text-xs font-semibold focus:outline-none transition-colors ${
                          isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                        }`}
                      >
                        <option value="LINK">Standard Link</option>
                        <option value="YOUTUBE_CHANNEL">YouTube</option>
                        <option value="INSTAGRAM_PROFILE">Instagram</option>
                      </select>
                    </div>
                    <div className="sm:col-span-4">
                      <input
                        type="text"
                        placeholder="Link Title (e.g. My Website)"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className={`w-full h-10 px-3.5 rounded-xl border text-xs font-semibold focus:outline-none transition-colors ${
                          isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white focus:border-zinc-700' : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-zinc-400'
                        }`}
                      />
                    </div>
                    <div className="sm:col-span-5 flex gap-2">
                      <input
                        type="text"
                        placeholder="URL (e.g. site.com)"
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                        className={`w-full h-10 px-3.5 rounded-xl border text-xs font-semibold focus:outline-none transition-colors flex-1 ${
                          isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white focus:border-zinc-700' : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-zinc-400'
                        }`}
                      />
                      <button
                        type="submit"
                        className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                          isDarkMode ? 'bg-white text-black hover:bg-zinc-200' : 'bg-zinc-950 text-white hover:bg-zinc-900'
                        }`}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </form>

                {/* Blocks sorting */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-text-muted uppercase tracking-wider px-2">
                    <span>Active Blocks ({links.length})</span>
                  </div>
                  {links.length === 0 ? (
                    <div className={`p-8 text-center rounded-[24px] border border-dashed ${isDarkMode ? 'border-border-main/50' : 'border-zinc-200'}`}>
                      <p className="text-xs text-text-muted font-semibold">No blocks configured yet. Create one above!</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {links.map((link, idx) => {
                        const Icon = link.type === 'YOUTUBE_CHANNEL' ? Youtube : link.type === 'INSTAGRAM_PROFILE' ? Instagram : LinkIcon;
                        return (
                          <div
                            key={link.id}
                            className={`
                              p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all
                              ${isDarkMode ? 'bg-zinc-950 border-border-main' : 'bg-white border-zinc-200 shadow-sm'}
                              ${!link.isVisible && 'opacity-60'}
                            `}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                isDarkMode ? 'bg-zinc-900 text-zinc-400' : 'bg-zinc-50 text-zinc-500'
                              }`}>
                                <Icon size={16} />
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold truncate text-text-main">{link.title}</h4>
                                <p className="text-[10px] text-text-muted truncate mt-0.5 font-semibold">{link.url}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => moveLink(idx, 'up')}
                                disabled={idx === 0}
                                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                  isDarkMode ? 'border-border-main text-zinc-400 hover:bg-zinc-900 disabled:opacity-30' : 'border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:opacity-30'
                                }`}
                              >
                                <ArrowUp size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveLink(idx, 'down')}
                                disabled={idx === links.length - 1}
                                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                  isDarkMode ? 'border-border-main text-zinc-400 hover:bg-zinc-900 disabled:opacity-30' : 'border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:opacity-30'
                                }`}
                              >
                                <ArrowDown size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleVisibility(link.id)}
                                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                  isDarkMode 
                                    ? `border-border-main ${link.isVisible ? 'text-zinc-200 hover:bg-zinc-900' : 'text-zinc-600 hover:bg-zinc-900'}` 
                                    : `border-zinc-200 ${link.isVisible ? 'text-zinc-700 hover:bg-zinc-50' : 'text-zinc-400 hover:bg-zinc-50'}`
                                }`}
                                title={link.isVisible ? 'Hide Block' : 'Show Block'}
                              >
                                <Eye size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteLink(link.id)}
                                className={`p-1.5 rounded-lg border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer`}
                                title="Delete Block"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Right column: Interactive Live Phone Preview Canvas */}
        <div className="lg:col-span-5 h-full flex flex-col items-center justify-center">
          <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 select-none flex items-center gap-1.5">
            <Eye size={12} />
            <span>Interactive Template Preview</span>
          </div>
          
          <div 
            className="w-[290px] h-[580px] rounded-[44px] border-[10px] border-zinc-900 dark:border-zinc-800 overflow-hidden relative shadow-2xl flex flex-col transition-all duration-300"
            style={canvasBackgroundStyle}
          >
            {/* Top camera Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-zinc-900 dark:bg-zinc-800 rounded-b-2xl z-50 flex items-center justify-center">
              <div className="w-12 h-1.5 bg-black/40 rounded-full mb-1" />
            </div>

            {/* Injected CSS Variables wrapper */}
            <div style={inlineCssVars} className="w-full h-full flex flex-col overflow-y-auto scrollbar-hide pt-10">
              
              {/* Profile Details Trigger (Clicking Avatar/Bio redirects sidebar to Profile Info tab) */}
              <div 
                onClick={() => setActiveTab('profile')}
                className="cursor-pointer group/preview-profile relative border border-transparent hover:border-indigo-500/40 hover:bg-indigo-500/5 rounded-2xl m-2 p-2 transition-all"
              >
                <SelectedTemplateComponent
                  profile={{
                    displayName,
                    bio,
                    profileImageUrl: user?.profilePicture || null,
                    username: user?.username || 'username',
                    isVerified: user?.is_verified
                  }}
                  blocks={[]}
                  theme={themeSettings}
                />
                
                {/* Floating edit indicator */}
                <div className="absolute top-2 right-2 opacity-0 group-hover/preview-profile:opacity-100 bg-indigo-600 text-white rounded-lg p-1 transition-all">
                  <Edit2 size={10} />
                </div>
              </div>

              {/* Blocks Trigger (Clicking Links wrapper redirects sidebar to Blocks tab) */}
              <div 
                onClick={() => setActiveTab('blocks')}
                className="cursor-pointer group/preview-blocks relative border border-transparent hover:border-indigo-500/40 hover:bg-indigo-500/5 rounded-2xl m-2 p-2 transition-all flex-1 flex flex-col"
              >
                <SelectedTemplateComponent
                  profile={{
                    displayName: '',
                    bio: '',
                    username: '',
                    isVerified: false
                  }}
                  blocks={links}
                  theme={themeSettings}
                />

                {/* Floating edit indicator */}
                <div className="absolute top-2 right-2 opacity-0 group-hover/preview-blocks:opacity-100 bg-indigo-600 text-white rounded-lg p-1 transition-all">
                  <Sliders size={10} />
                </div>
              </div>

              {/* Footer design watermark */}
              <div className="mt-auto pb-4 flex items-center justify-center gap-1.5 opacity-60 text-text-main select-none font-sans shrink-0">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                </svg>
                <span className="text-[9px] font-bold uppercase tracking-wider">SuviX</span>
              </div>

            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
