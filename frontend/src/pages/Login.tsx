import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AuthBackground } from '../components/auth/AuthBackground';
import { useAuthStore } from '../store/useAuthStore';
import logo from '../assets/whitebglogo.png';

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      navigate('/home');
    } catch (err: any) {
      setError(err);
    }
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
        <div className="absolute inset-x-0 bottom-0 h-[65%] bg-black z-10" />
        <div className="absolute inset-x-0 bottom-[65%] h-48 bg-gradient-to-t from-black to-transparent z-10" />
      </div>

      {/* Right Panel / Mobile Content Layer */}
      <div className="flex-1 lg:flex-none lg:w-[60%] flex flex-col h-full overflow-y-auto lg:overflow-hidden bg-transparent lg:bg-black z-20">
        <div className="flex justify-between items-center p-8 lg:px-24 lg:py-10 mb-4 lg:mb-8 sticky top-0 z-30 lg:relative lg:bg-transparent">
          {/* Mobile Header Overlay */}
          <div className="lg:hidden absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black via-black/70 to-transparent -z-10" />
          
          <img src={logo} alt="SuviX" className="h-12 lg:h-16 w-auto brightness-0 invert relative z-10" />
          <div className="flex items-center gap-2 text-xs lg:text-sm text-zinc-400 relative z-10">
            <span className="hidden sm:inline">New to SuviX?</span>
            <Link to="/role-selection">
              <Button variant="ghost" className="text-white font-bold hover:bg-white/10 px-4 py-2 rounded-xl text-xs lg:text-sm border border-white/10">
                Join Now
              </Button>
            </Link>
          </div>
        </div>

        <div className="max-w-[360px] mx-auto w-full flex-1 flex flex-col justify-center px-8 pb-12 lg:px-0 lg:pb-0">
          <div className="mb-8 text-center">
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight mb-1">
              Welcome Back
            </h1>
            <p className="text-zinc-400 text-xs lg:text-sm">
              Please enter your details below to login.
            </p>
          </div>

          <div className="space-y-6">
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

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl text-xs font-bold text-center">
                {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input 
                label="Email Address" 
                type="email" 
                placeholder="name@example.com" 
                className="h-12 bg-zinc-900/50 backdrop-blur-sm border-zinc-800"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <div className="space-y-1">
                <Input 
                  label="Password" 
                  type="password" 
                  placeholder="••••••••" 
                  className="h-12 bg-zinc-900/50 backdrop-blur-sm border-zinc-800"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <div className="text-right">
                  <Link to="#" className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors">
                    Forgot Password?
                  </Link>
                </div>
              </div>

              <Button 
                size="md" 
                className="w-full h-12 bg-white text-black hover:bg-zinc-200 rounded-xl font-bold"
                disabled={isLoading}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
          </div>
        </div>

        <div className="mt-12 lg:mt-16 text-center text-xs text-zinc-500 font-medium pb-8 lg:pb-12">
          © 2026 SuviX Inc. All rights reserved.
        </div>
      </div>
    </div>
  );
}
