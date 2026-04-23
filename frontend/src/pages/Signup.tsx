import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { AuthBackground } from '../components/auth/AuthBackground';
import logo from '../assets/whitebglogo.png';

const LANGUAGES = [
  'English', 'Hindi', 'Kannada', 'Telugu', 'Tamil', 
  'Malayalam', 'Marathi', 'Bengali', 'Gujarati', 'Punjabi'
];

export default function Signup() {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/home');
  };

  return (
    <div className="flex h-screen w-full bg-black font-sans overflow-hidden relative">
      {/* Desktop Left Panel */}
      <div className="hidden lg:flex lg:w-[40%] p-8 bg-zinc-950 overflow-hidden relative border-r border-zinc-900">
        <AuthBackground />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black to-transparent z-10" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent z-10" />
      </div>

      {/* Mobile Background */}
      <div className="lg:hidden absolute inset-0 z-0 bg-black">
        <AuthBackground />
        <div className="absolute inset-x-0 bottom-0 h-[60%] bg-black z-10" />
        <div className="absolute inset-x-0 bottom-[60%] h-48 bg-gradient-to-t from-black to-transparent z-10" />
      </div>

      {/* Right Panel / Mobile Content Layer */}
      <div className="flex-1 lg:flex-none lg:w-[60%] flex flex-col h-full overflow-y-auto lg:overflow-hidden bg-transparent lg:bg-black z-20">
        <div className="flex justify-between items-center p-8 lg:px-24 lg:py-10 mb-4 lg:mb-6 sticky top-0 z-30 lg:relative lg:bg-transparent">
          {/* Mobile Header Overlay */}
          <div className="lg:hidden absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black via-black/70 to-transparent -z-10" />
          
          <img src={logo} alt="SuviX" className="h-12 lg:h-16 w-auto brightness-0 invert relative z-10" />
          <div className="flex items-center gap-2 text-xs lg:text-sm text-zinc-400 relative z-10">
            <span className="hidden sm:inline">Already have an account?</span>
            <Link to="/login">
              <Button variant="ghost" className="text-white font-bold hover:bg-white/10 px-4 py-2 rounded-xl text-xs lg:text-sm border border-white/10">
                Login Here
              </Button>
            </Link>
          </div>
        </div>

        <div className="max-w-[380px] lg:max-w-[420px] mx-auto w-full flex-1 flex flex-col justify-center px-8 pb-12 lg:px-0 lg:pb-0">
          <div className="mb-6 text-center">
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight mb-1">
              Join SuviX
            </h1>
            <p className="text-zinc-400 text-xs lg:text-sm">
              Enter your details below to create your account.
            </p>
          </div>

          <div className="space-y-4 lg:space-y-5">
            {/* Google Auth at the Top */}
            <Button 
              variant="outline" 
              className="w-full h-11 lg:h-12 border-zinc-800 text-white bg-zinc-900/50 hover:bg-zinc-900 rounded-xl flex items-center justify-center gap-3 font-bold text-sm"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-black/80 backdrop-blur-sm px-4 text-zinc-500 font-bold tracking-widest">OR</span>
              </div>
            </div>

            <form className="space-y-3 lg:space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input 
                  label="Full Name" 
                  placeholder="Your Name" 
                  className="h-11 bg-zinc-900/50 backdrop-blur-sm border-zinc-800 text-xs lg:text-sm"
                />
                <Input 
                  label="Username Handle" 
                  placeholder="unique_handle" 
                  className="h-11 bg-zinc-900/50 backdrop-blur-sm border-zinc-800 text-xs lg:text-sm"
                />
              </div>
              
              <Input 
                label="Email Address" 
                type="email" 
                placeholder="email@example.com" 
                className="h-11 bg-zinc-900/50 backdrop-blur-sm border-zinc-800 text-xs lg:text-sm"
              />
              
              <div className="grid grid-cols-2 gap-3">
                <Input 
                  label="Phone Number" 
                  placeholder="+91..." 
                  className="h-11 bg-zinc-900/50 backdrop-blur-sm border-zinc-800 text-xs lg:text-sm"
                />
                <Select 
                  label="Mother Tongue" 
                  className="h-11 bg-zinc-900/50 backdrop-blur-sm border-zinc-800 text-xs lg:text-sm"
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </Select>
              </div>

              <Input 
                label="Secure Password" 
                type="password" 
                placeholder="••••••••" 
                className="h-11 bg-zinc-900/50 backdrop-blur-sm border-zinc-800 text-xs lg:text-sm"
              />

              <Button size="md" className="w-full h-12 bg-white text-black hover:bg-zinc-200 rounded-xl font-bold mt-2">
                Create Account
              </Button>
            </form>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-zinc-500 font-medium pb-8 lg:pb-10">
          © 2026 SuviX Inc. All rights reserved.
        </div>
      </div>
    </div>
  );
}
