import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { selectUser, updateUser } from '../store/slices/authSlice';
import { 
  User, 
  Settings as SettingsIcon, 
  ShieldCheck, 
  Bell, 
  Eye, 
  Camera, 
  Globe, 
  LogOut,
  Moon,
  Sun,
  Laptop,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useLogout } from '../mutations/useLogout';
import defaultProfile from '../assets/defaultprofile.png';
import { api } from '../api/client';

// ── Reusable Form Fields ───────────────────────────────────────────────────

function InputField({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  prefix,
  disabled = false,
  isDarkMode
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  prefix?: string;
  disabled?: boolean;
  isDarkMode: boolean;
}) {
  return (
    <div className="space-y-1.5 w-full">
      <label className={`block text-[11px] font-bold uppercase tracking-[0.12em] ${isDarkMode ? 'text-text-muted' : 'text-zinc-500'}`}>
        {label}
      </label>
      <div className="relative w-full">
        {prefix && (
          <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 font-medium text-[13px] ${isDarkMode ? 'text-text-muted' : 'text-zinc-400'}`}>
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full h-11 rounded-xl px-4 text-[13px] font-medium transition-all focus:outline-none ${prefix ? 'pl-8' : ''} ${
            isDarkMode 
              ? 'bg-zinc-950/60 border border-border-secondary text-white placeholder-text-muted/40 focus:border-zinc-500 disabled:opacity-50' 
              : 'bg-white border-[1.5px] border-zinc-950 text-zinc-950 placeholder-zinc-400 focus:bg-zinc-50 disabled:opacity-50'
          }`}
        />
      </div>
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  isDarkMode
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
  isDarkMode: boolean;
}) {
  return (
    <div className="space-y-1.5 w-full">
      <label className={`block text-[11px] font-bold uppercase tracking-[0.12em] ${isDarkMode ? 'text-text-muted' : 'text-zinc-500'}`}>
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`w-full rounded-xl p-4 text-[13px] font-medium transition-all focus:outline-none resize-none leading-relaxed ${
          isDarkMode 
            ? 'bg-zinc-950/60 border border-border-secondary text-white placeholder-text-muted/40 focus:border-zinc-500' 
            : 'bg-white border-[1.5px] border-zinc-950 text-zinc-950 placeholder-zinc-400 focus:bg-zinc-50'
        }`}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  isDarkMode
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
  isDarkMode: boolean;
}) {
  return (
    <div className="space-y-1.5 w-full">
      <label className={`block text-[11px] font-bold uppercase tracking-[0.12em] ${isDarkMode ? 'text-text-muted' : 'text-zinc-500'}`}>
        {label}
      </label>
      <div className="relative w-full">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full h-11 rounded-xl px-4 pr-10 text-[13px] font-medium transition-all focus:outline-none appearance-none cursor-pointer ${
            isDarkMode 
              ? 'bg-zinc-950/60 border border-border-secondary text-white focus:border-zinc-500' 
              : 'bg-white border-[1.5px] border-zinc-950 text-zinc-950 focus:bg-zinc-50'
          }`}
        >
          {options.map((opt) => (
            <option key={opt} value={opt} className={isDarkMode ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-950'}>
              {opt}
            </option>
          ))}
        </select>
        <div className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-text-muted' : 'text-zinc-500'}`}>
          <ChevronDown size={16} />
        </div>
      </div>
    </div>
  );
}

function ToggleField({ 
  label, 
  description, 
  checked, 
  onChange, 
  isDarkMode 
}: { 
  label: string; 
  description: string; 
  checked: boolean; 
  onChange: (val: boolean) => void;
  isDarkMode: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-border-secondary/40 last:border-0">
      <div className="space-y-0.5 pr-4">
        <p className={`text-[13px] font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}>{label}</p>
        <p className={`text-[11px] ${isDarkMode ? 'text-text-muted' : 'text-zinc-500'}`}>{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`w-10 h-5.5 rounded-full relative transition-colors duration-200 shrink-0 cursor-pointer ${
          checked 
            ? (isDarkMode ? 'bg-white' : 'bg-zinc-950') 
            : (isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200')
        }`}
      >
        <span 
          className={`w-4 h-4 rounded-full absolute top-[3px] transition-all duration-200 ${
            checked 
              ? (isDarkMode ? 'bg-black left-[21px]' : 'bg-white left-[21px]') 
              : (isDarkMode ? 'bg-zinc-400 left-[3px]' : 'bg-zinc-400 left-[3px]')
          }`}
        />
      </button>
    </div>
  );
}

// ── Main Page Component ────────────────────────────────────────────────────

export default function Settings() {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { isDarkMode, themeMode, setThemeMode } = useTheme();
  const { mutateAsync: logout } = useLogout();

  const [activeCategory, setActiveCategory] = useState('profile');
  const [mobileShowContent, setMobileShowContent] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Profile forms
  const [displayName, setDisplayName] = useState(user?.name || 'SuviX Creator');
  const [username, setUsername] = useState(user?.username || 'suvix.official');
  const [bio, setBio] = useState(user?.bio || 'Professional Creator · UI Designer');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File size exceeds 5MB limit.");
      return;
    }

    // 1. Instantly update the UI optimistically using a local Data URL
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        dispatch(updateUser({ profilePicture: dataUrl }));
      }
    };
    reader.readAsDataURL(file);

    // 2. Upload to backend
    try {
      const formData = new FormData();
      formData.append("image", file);

      // Using our API client to hit the backend route
      // The backend route is POST /api/user/me/profile-picture
      await api.post("/user/me/profile-picture", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // The backend returns { profilePicture: new_secure_url } and also emits a socket event
      // Redux already has the optimistic base64 update, but the socket event or next fetch will sync the official S3 URL.
      showToast("Profile picture successfully uploaded!");
    } catch (error) {
      console.error("Failed to upload profile picture:", error);
      showToast("Failed to upload profile picture. Please try again.");
    }
  };

  // Account forms
  const [email, setEmail] = useState(user?.email || 'creator@suvix.app');
  const [phone, setPhone] = useState((user as { phone?: string })?.phone || '+1 (555) 019-2834');
  const [language, setLanguage] = useState('English');

  // Security forms
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactor, setTwoFactor] = useState(false);

  // Notifications forms
  const [pushNotif, setPushNotif] = useState(true);
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);

  // Creator Hub forms
  const [payoutEmail, setPayoutEmail] = useState(user?.email || 'payouts@suvix.app');

  const showToast = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Submit Handlers
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      // Simulate network delay for smooth animation visibility
      await new Promise(resolve => setTimeout(resolve, 600));
      const res = await api.patch('/user/me', {
        name: displayName,
        username: username,
        bio: bio
      });
      if (res.data.success) {
        dispatch(updateUser({
          name: res.data.user.name,
          username: res.data.user.username,
          bio: res.data.user.bio
        }));
        showToast('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      showToast('Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(updateUser({
      email: email
    }));
    showToast('Account settings updated!');
  };

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    showToast('Security settings updated!');
  };

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Notification preferences updated!');
  };

  const handleSaveCreator = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Creator settings updated!');
  };

  const CATEGORIES = [
    { id: 'profile',       label: 'Edit Profile',       icon: User },
    { id: 'account',       label: 'Account Settings',   icon: SettingsIcon },
    { id: 'security',      label: 'Privacy & Security', icon: ShieldCheck },
    { id: 'notifications', label: 'Notifications',      icon: Bell },
    { id: 'display',       label: 'Display & Theme',    icon: Eye },
    { id: 'creator',       label: 'Creator Hub',        icon: Globe },
  ];

  const youtubeChannels = user?.youtubeProfile || [];
  
  const hasProfileChanges = 
    displayName !== (user?.name || '') ||
    username !== (user?.username || '') ||
    bio !== (user?.bio || '');

  return (
    <div className="absolute inset-0 z-[60] bg-page flex flex-col lg:flex-row gap-5 p-3 lg:p-6 overflow-hidden overscroll-none">
      
      {/* 1. Left Sidebar Navigation Column */}
      <aside className={`w-full lg:w-[280px] xl:w-[320px] shrink-0 h-full flex flex-col overflow-hidden rounded-[32px] p-5 border relative transition-all duration-300 ${
        isDarkMode ? 'bg-black border-border-main' : 'bg-zinc-50/50 border-zinc-950 border-[1.5px] shadow-sm'
      } ${!mobileShowContent ? 'flex' : 'hidden lg:flex'}`}>
        
        {/* Header */}
        <div className="shrink-0 mb-4 px-2">
          <p className={`text-[11px] font-bold uppercase tracking-[0.12em] mb-1.5 ${isDarkMode ? 'text-text-muted' : 'text-zinc-500'}`}>
            System Preferences
          </p>
          <h2 className={`text-xl font-bold tracking-tight font-display ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}>
            Settings
          </h2>
        </div>

        {/* Options List */}
        <nav className="flex-1 overflow-y-auto no-scrollbar space-y-1.5 pr-1">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setMobileShowContent(true);
                }}
                className={[
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all border w-full text-left cursor-pointer',
                  isDarkMode
                    ? (isActive 
                        ? 'bg-text-main text-container font-semibold border-transparent' 
                        : 'text-text-muted hover:bg-border-secondary hover:text-text-main border-transparent')
                    : (isActive 
                        ? 'bg-zinc-950 text-white font-semibold border-zinc-950 shadow-sm' 
                        : 'text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-950 border-transparent hover:border-zinc-300')
                ].join(' ')}
              >
                <cat.icon
                  size={16}
                  strokeWidth={isActive ? 2.5 : 1.75}
                />
                {cat.label}
              </button>
            );
          })}
        </nav>

        {/* Footer (Logout) */}
        <div className={`shrink-0 pt-4 mt-auto border-t ${isDarkMode ? 'border-border-main' : 'border-zinc-200'}`}>
          <button 
            onClick={handleLogout}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-rose-500 hover:bg-rose-500/8 transition-colors w-full border border-transparent cursor-pointer ${
              !isDarkMode && 'hover:border-rose-200 hover:bg-rose-50/50'
            }`}
          >
            <LogOut size={16} strokeWidth={1.75} />
            Log out
          </button>
        </div>
      </aside>

      {/* 2. Main Content Area Column */}
      <main className={`flex-1 h-full rounded-[32px] border relative overflow-hidden flex flex-col min-w-0 transition-all duration-300 ${
        isDarkMode ? 'bg-black border-border-main' : 'bg-zinc-50/50 border-zinc-950 border-[1.5px] shadow-sm'
      } ${mobileShowContent ? 'flex' : 'hidden lg:flex'}`}>
        
        {/* Glow Element */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-accent-primary/[0.03] blur-[120px] pointer-events-none" />

        <div className="flex-1 overflow-y-auto no-scrollbar p-6 lg:p-8 relative">
          <div className="max-w-2xl">
            
            {/* Back button for mobile */}
            <button 
              onClick={() => setMobileShowContent(false)}
              className="lg:hidden flex items-center gap-2 mb-6 text-[13px] font-medium text-text-muted hover:text-text-main transition-colors cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>Back to Settings</span>
            </button>

            {/* ──── Profile Panel ──── */}
            {activeCategory === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`text-lg font-bold font-display tracking-tight mb-1 ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}>
                      Edit Profile
                    </h3>
                    <p className={`text-[13px] ${isDarkMode ? 'text-text-muted' : 'text-zinc-500'}`}>
                      Control your digital identity and public brand identity.
                    </p>
                  </div>
                  <button 
                    type="submit"
                    disabled={!hasProfileChanges || isSavingProfile}
                    className={`flex items-center justify-center gap-1.5 h-9 px-5 rounded-xl text-[12px] font-bold transition-all min-w-[120px] ${
                      hasProfileChanges 
                        ? isDarkMode 
                          ? 'bg-white text-black hover:bg-zinc-100 active:scale-[0.98] cursor-pointer' 
                          : 'bg-zinc-950 text-white hover:bg-zinc-900 shadow-sm active:scale-[0.98] cursor-pointer'
                        : isDarkMode 
                          ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                          : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                    }`}
                  >
                    {isSavingProfile ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6 pb-2">
                  <div className="relative group w-24 h-24">
                    <input 
                      type="file" 
                      id="profile-upload" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                      className="hidden" 
                    />
                    <label htmlFor="profile-upload" className="cursor-pointer block w-full h-full">
                      <div className={`w-full h-full rounded-full overflow-hidden border p-1 transition-all group-hover:opacity-90 ${
                        isDarkMode ? 'border-border-secondary bg-zinc-950/40' : 'border-zinc-950 border-[1.5px] bg-white'
                      }`}>
                        <img 
                          src={user?.profilePicture || defaultProfile} 
                          alt="Avatar" 
                          className="w-full h-full rounded-full object-cover"
                        />
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full border flex items-center justify-center shadow-lg transition-transform active:scale-90 hover:scale-105 cursor-pointer ${
                        isDarkMode ? 'bg-white text-black border-zinc-200' : 'bg-zinc-950 text-white border-zinc-950'
                      }`}>
                        <Camera size={14} />
                      </div>
                    </label>
                  </div>
                  <div className="text-center sm:text-left space-y-1">
                    <p className={`text-[13px] font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}>
                      Profile Picture
                    </p>
                    <p className={`text-[11px] ${isDarkMode ? 'text-text-muted' : 'text-zinc-500'}`}>
                      PNG, JPG or GIF. Max 5MB.
                    </p>
                  </div>
                </div>

                <div className="space-y-5 max-w-xl">
                  <InputField
                    label="Display Name"
                    value={displayName}
                    onChange={setDisplayName}
                    placeholder="Enter display name"
                    isDarkMode={isDarkMode}
                  />
                  <InputField
                    label="Username"
                    value={username}
                    onChange={setUsername}
                    placeholder="username"
                    prefix="@"
                    isDarkMode={isDarkMode}
                  />
                  <TextareaField
                    label="Bio"
                    value={bio}
                    onChange={setBio}
                    placeholder="Tell your story..."
                    isDarkMode={isDarkMode}
                  />
                </div>
              </form>
            )}

            {/* ──── Account Settings Panel ──── */}
            {activeCategory === 'account' && (
              <form onSubmit={handleSaveAccount} className="space-y-8">
                <div>
                  <h3 className={`text-lg font-bold font-display tracking-tight mb-1 ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}>
                    Account Settings
                  </h3>
                  <p className={`text-[13px] ${isDarkMode ? 'text-text-muted' : 'text-zinc-500'}`}>
                    Manage your credentials, system options, and locale preferences.
                  </p>
                </div>

                <div className="space-y-5 max-w-xl">
                  <InputField
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    placeholder="email@example.com"
                    isDarkMode={isDarkMode}
                  />
                  <InputField
                    label="Phone Number"
                    type="tel"
                    value={phone}
                    onChange={setPhone}
                    placeholder="+1 (555) 000-0000"
                    isDarkMode={isDarkMode}
                  />
                  <SelectField
                    label="Preferred Language"
                    value={language}
                    onChange={setLanguage}
                    options={['English', 'Spanish', 'French', 'German', 'Hindi', 'Japanese']}
                    isDarkMode={isDarkMode}
                  />
                </div>

                <div className="pt-4 border-t border-border-secondary/40">
                  <button 
                    type="submit"
                    className={`h-11 px-8 rounded-xl text-[13px] font-bold transition-all active:scale-[0.98] cursor-pointer w-full sm:w-auto ${
                      isDarkMode ? 'bg-white text-black hover:bg-zinc-100' : 'bg-zinc-950 text-white hover:bg-zinc-900 shadow-sm'
                    }`}
                  >
                    Save Settings
                  </button>
                </div>
              </form>
            )}

            {/* ──── Security Panel ──── */}
            {activeCategory === 'security' && (
              <form onSubmit={handleSaveSecurity} className="space-y-8">
                <div>
                  <h3 className={`text-lg font-bold font-display tracking-tight mb-1 ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}>
                    Privacy & Security
                  </h3>
                  <p className={`text-[13px] ${isDarkMode ? 'text-text-muted' : 'text-zinc-500'}`}>
                    Update your password and manage safety features.
                  </p>
                </div>

                <div className="space-y-5 max-w-xl">
                  <InputField
                    label="Current Password"
                    type="password"
                    value={currentPassword}
                    onChange={setCurrentPassword}
                    placeholder="••••••••"
                    isDarkMode={isDarkMode}
                  />
                  <InputField
                    label="New Password"
                    type="password"
                    value={newPassword}
                    onChange={setNewPassword}
                    placeholder="••••••••"
                    isDarkMode={isDarkMode}
                  />
                  <InputField
                    label="Confirm New Password"
                    type="password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    placeholder="••••••••"
                    isDarkMode={isDarkMode}
                  />

                  <div className="pt-4">
                    <ToggleField
                      label="Two-Factor Authentication"
                      description="Add an extra layer of security by requiring a verification code at login."
                      checked={twoFactor}
                      onChange={setTwoFactor}
                      isDarkMode={isDarkMode}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-border-secondary/40">
                  <button 
                    type="submit"
                    className={`h-11 px-8 rounded-xl text-[13px] font-bold transition-all active:scale-[0.98] cursor-pointer w-full sm:w-auto ${
                      isDarkMode ? 'bg-white text-black hover:bg-zinc-100' : 'bg-zinc-950 text-white hover:bg-zinc-900 shadow-sm'
                    }`}
                  >
                    Update Password
                  </button>
                </div>
              </form>
            )}

            {/* ──── Notifications Panel ──── */}
            {activeCategory === 'notifications' && (
              <form onSubmit={handleSaveNotifications} className="space-y-8">
                <div>
                  <h3 className={`text-lg font-bold font-display tracking-tight mb-1 ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}>
                    Notification Alerts
                  </h3>
                  <p className={`text-[13px] ${isDarkMode ? 'text-text-muted' : 'text-zinc-500'}`}>
                    Configure how and when you receive push, email, and SMS updates.
                  </p>
                </div>

                <div className="max-w-xl">
                  <ToggleField
                    label="Push Notifications"
                    description="Receive live push notifications on your desktop or mobile app."
                    checked={pushNotif}
                    onChange={setPushNotif}
                    isDarkMode={isDarkMode}
                  />
                  <ToggleField
                    label="Email Digests"
                    description="Weekly emails summarizing your views, recommendations, and jobs."
                    checked={emailNotif}
                    onChange={setEmailNotif}
                    isDarkMode={isDarkMode}
                  />
                  <ToggleField
                    label="SMS Transactions"
                    description="Critical alerts regarding payouts, system maintenance, and login issues."
                    checked={smsNotif}
                    onChange={setSmsNotif}
                    isDarkMode={isDarkMode}
                  />
                </div>

                <div className="pt-4 border-t border-border-secondary/40">
                  <button 
                    type="submit"
                    className={`h-11 px-8 rounded-xl text-[13px] font-bold transition-all active:scale-[0.98] cursor-pointer w-full sm:w-auto ${
                      isDarkMode ? 'bg-white text-black hover:bg-zinc-100' : 'bg-zinc-950 text-white hover:bg-zinc-900 shadow-sm'
                    }`}
                  >
                    Save Preferences
                  </button>
                </div>
              </form>
            )}

            {/* ──── Display & Theme Panel ──── */}
            {activeCategory === 'display' && (
              <div className="space-y-8">
                <div>
                  <h3 className={`text-lg font-bold font-display tracking-tight mb-1 ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}>
                    Display & Theme
                  </h3>
                  <p className={`text-[13px] ${isDarkMode ? 'text-text-muted' : 'text-zinc-500'}`}>
                    Customize the visual style of your SuviX dashboard.
                  </p>
                </div>

                <div className="space-y-6 max-w-xl">
                  {/* Theme Selector */}
                  <div className="space-y-3">
                    <label className={`block text-[11px] font-bold uppercase tracking-[0.12em] ${isDarkMode ? 'text-text-muted' : 'text-zinc-500'}`}>
                      Theme Preference
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Light Mode Button */}
                      <button 
                        type="button"
                        onClick={() => setThemeMode('light')}
                        className={`flex flex-col items-center justify-center p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                          themeMode === 'light'
                            ? (isDarkMode ? 'bg-white border-zinc-200 text-zinc-950 shadow-md' : 'bg-zinc-950 border-zinc-950 text-white shadow-md')
                            : (isDarkMode ? 'bg-zinc-950/40 border-border-main text-text-muted hover:border-zinc-700 hover:text-white' : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-950 hover:text-zinc-950')
                        }`}
                      >
                        <Sun size={20} className="mb-2" />
                        <span className="text-[13px] font-semibold">Light Mode</span>
                      </button>

                      {/* Dark Mode Button */}
                      <button 
                        type="button"
                        onClick={() => setThemeMode('dark')}
                        className={`flex flex-col items-center justify-center p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                          themeMode === 'dark'
                            ? (isDarkMode ? 'bg-white border-zinc-200 text-zinc-950 shadow-md' : 'bg-zinc-950 border-zinc-950 text-white shadow-md')
                            : (isDarkMode ? 'bg-zinc-950/40 border-border-main text-text-muted hover:border-zinc-700 hover:text-white' : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-950 hover:text-zinc-950')
                        }`}
                      >
                        <Moon size={20} className="mb-2" />
                        <span className="text-[13px] font-semibold">Dark Mode</span>
                      </button>

                      {/* Sync with System Button */}
                      <button 
                        type="button"
                        onClick={() => setThemeMode('system')}
                        className={`flex flex-col items-center justify-center p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                          themeMode === 'system'
                            ? (isDarkMode ? 'bg-white border-zinc-200 text-zinc-950 shadow-md' : 'bg-zinc-950 border-zinc-950 text-white shadow-md')
                            : (isDarkMode ? 'bg-zinc-950/40 border-border-main text-text-muted hover:border-zinc-700 hover:text-white' : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-950 hover:text-zinc-950')
                        }`}
                      >
                        <Laptop size={20} className="mb-2" />
                        <span className="text-[13px] font-semibold">System Sync</span>
                      </button>
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl border border-dashed text-[12px] leading-relaxed ${
                    isDarkMode ? 'bg-zinc-950/20 border-border-main text-text-muted' : 'bg-zinc-50 border-zinc-300 text-zinc-600'
                  }`}>
                    <p>
                      <strong>System Sync</strong> will automatically transition your app style based on your Operating System's light and dark mode preferences.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ──── Creator Hub Panel ──── */}
            {activeCategory === 'creator' && (
              <form onSubmit={handleSaveCreator} className="space-y-8">
                <div>
                  <h3 className={`text-lg font-bold font-display tracking-tight mb-1 ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}>
                    Creator Hub
                  </h3>
                  <p className={`text-[13px] ${isDarkMode ? 'text-text-muted' : 'text-zinc-500'}`}>
                    Manage connected channels, verification tags, and payout setup.
                  </p>
                </div>

                <div className="space-y-6 max-w-xl">
                  {/* YouTube Connection status */}
                  <div className="space-y-3">
                    <label className={`block text-[11px] font-bold uppercase tracking-[0.12em] ${isDarkMode ? 'text-text-muted' : 'text-zinc-500'}`}>
                      Connected Accounts
                    </label>

                    {youtubeChannels.length > 0 ? (
                      youtubeChannels.slice(0, 1).map((channel) => (
                        <div 
                          key={channel.channel_id} 
                          className={`relative overflow-hidden rounded-[24px] border transition-all duration-300 ${
                            isDarkMode 
                              ? 'bg-zinc-950/40 border-border-main' 
                              : 'bg-white border-zinc-950 border-[1.5px] shadow-sm'
                          }`}
                        >
                          <div className="h-[3px] w-full bg-[#FF0000] opacity-85" />
                          <div className="p-5 space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="relative shrink-0">
                                  <img
                                    src={channel.thumbnail_url}
                                    alt={channel.channel_name}
                                    className={`w-12 h-12 rounded-full object-cover border-2 ${isDarkMode ? 'border-border-main' : 'border-zinc-200'}`}
                                  />
                                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#FF0000] rounded-full flex items-center justify-center shadow-md border-2 border-white dark:border-black">
                                    <svg width="8" height="6" viewBox="0 0 24 17" fill="white">
                                      <path d="M23.5 2.9c-.3-1-1.1-1.8-2.1-2.1C19.5 0 12 0 12 0S4.5 0 2.6.8C1.6 1.1.8 2 .5 2.9 0 4.8 0 8.5 0 8.5s0 3.7.5 5.6c.3 1 1.1 1.8 2.1 2.1C4.5 17 12 17 12 17s7.5 0 9.4-.8c1-.3 1.8-1.1 2.1-2.1.5-1.9.5-5.6.5-5.6s0-3.7-.5-5.6z"/>
                                      <path d="M9.5 12.1V4.9l6.3 3.6-6.3 3.6z" fill="#FF0000"/>
                                    </svg>
                                  </div>
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-sm font-bold text-text-main leading-tight truncate">
                                    {channel.channel_name}
                                  </h4>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">
                                      Connected
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className={`grid grid-cols-3 gap-2 p-3 rounded-2xl border text-center ${
                              isDarkMode ? 'bg-zinc-900/30 border-border-secondary' : 'bg-zinc-50 border-zinc-150'
                            }`}>
                              {[
                                { value: channel.subscriber_count || 0, label: 'Subs' },
                                { value: channel.view_count || 0, label: 'Views' },
                                { value: channel.video_count || 0, label: 'Videos' },
                              ].map(({ value, label }) => {
                                let displayVal = '0';
                                const num = typeof value === 'string' ? parseInt(value, 10) || 0 : value;
                                if (num >= 1000000) displayVal = (num / 1000000).toFixed(1) + 'M';
                                else if (num >= 1000) displayVal = (num / 1000).toFixed(1) + 'K';
                                else displayVal = num.toString();
                                return (
                                  <div key={label} className="flex flex-col items-center">
                                    <span className="text-[9px] font-semibold text-text-muted uppercase tracking-wider">{label}</span>
                                    <span className="text-[13px] font-bold text-text-main font-display mt-0.5">{displayVal}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div 
                        onClick={() => navigate('/youtube-connect')}
                        className={`border-2 border-dashed rounded-2xl p-5 text-center flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-300 ${
                          isDarkMode 
                            ? 'border-border-main bg-black/40 hover:border-rose-500/50 hover:bg-rose-500/5' 
                            : 'border-zinc-950 bg-zinc-50/50 hover:bg-zinc-950/10 hover:shadow-sm'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-zinc-900 text-rose-500' : 'bg-zinc-200 text-rose-600'}`}>
                          <svg width="20" height="15" viewBox="0 0 24 17" fill="currentColor">
                            <path d="M23.5 2.9c-.3-1-1.1-1.8-2.1-2.1C19.5 0 12 0 12 0S4.5 0 2.6.8C1.6 1.1.8 2 .5 2.9 0 4.8 0 8.5 0 8.5s0 3.7.5 5.6c.3 1 1.1 1.8 2.1 2.1C4.5 17 12 17 12 17s7.5 0 9.4-.8c1-.3 1.8-1.1 2.1-2.1.5-1.9.5-5.6.5-5.6s0-3.7-.5-5.6z"/>
                            <path d="M9.5 12.1V4.9l6.3 3.6-6.3 3.6z" fill="white"/>
                          </svg>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-text-main">No Channels Connected</p>
                          <p className="text-[10px] text-text-muted leading-relaxed max-w-[200px] mx-auto">
                            You don't have any channels connected. Get started by linking your YouTube.
                          </p>
                        </div>
                        <button 
                          type="button"
                          className={`mt-1 px-4 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                            isDarkMode ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-zinc-950 text-white hover:bg-zinc-900'
                          }`}
                        >
                          Connect Channel
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Payout Details */}
                  <InputField
                    label="Payout Email"
                    type="email"
                    value={payoutEmail}
                    onChange={setPayoutEmail}
                    placeholder="payouts@suvix.app"
                    isDarkMode={isDarkMode}
                  />

                  {/* Verification Status */}
                  <div className="space-y-2">
                    <label className={`block text-[11px] font-bold uppercase tracking-[0.12em] ${isDarkMode ? 'text-text-muted' : 'text-zinc-500'}`}>
                      Verification Status
                    </label>
                    <div className={`flex items-center gap-3 p-4 rounded-xl border ${
                      isDarkMode ? 'bg-zinc-950/20 border-border-secondary' : 'bg-white border-zinc-200'
                    }`}>
                      {user?.primaryRole?.group === 'PROVIDER' ? (
                        <>
                          <CheckCircle size={18} className="text-emerald-500 shrink-0" />
                          <div>
                            <p className={`text-[12px] font-bold ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}>Verified Partner</p>
                            <p className={`text-[11px] ${isDarkMode ? 'text-text-muted' : 'text-zinc-500'}`}>You have access to creator hub tools and analytics.</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <AlertCircle size={18} className="text-zinc-500 shrink-0" />
                          <div className="flex-1">
                            <p className={`text-[12px] font-bold ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}>Standard Member</p>
                            <p className={`text-[11px] ${isDarkMode ? 'text-text-muted' : 'text-zinc-500'}`}>Verify your profile or connect a channel to unlock payouts.</p>
                          </div>
                          <button 
                            type="button" 
                            className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all border cursor-pointer ${
                              isDarkMode ? 'bg-zinc-900 border-border-main text-white hover:bg-zinc-800' : 'bg-zinc-50 border-zinc-950 text-zinc-950 hover:bg-zinc-100'
                            }`}
                          >
                            Apply
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border-secondary/40">
                  <button 
                    type="submit"
                    className={`h-11 px-8 rounded-xl text-[13px] font-bold transition-all active:scale-[0.98] cursor-pointer w-full sm:w-auto ${
                      isDarkMode ? 'bg-white text-black hover:bg-zinc-100' : 'bg-zinc-950 text-white hover:bg-zinc-900 shadow-sm'
                    }`}
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      </main>

      {/* Toast Notification */}
      {successMessage && (
        <div className={`absolute bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl animate-fade-up transition-all duration-300 ${
          isDarkMode ? 'bg-white border-zinc-200 text-zinc-950 shadow-2xl' : 'bg-zinc-950 border-zinc-850 text-white shadow-2xl'
        }`}>
          <CheckCircle size={18} className="text-emerald-500" />
          <span className="text-[13px] font-semibold tracking-tight">{successMessage}</span>
        </div>
      )}
    </div>
  );
}

