import { useState } from 'react';
import { supabase } from '../utils/supabase';
import { motion } from 'motion/react';
import { Lock, Mail, Loader2, ArrowLeft } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
  onBack: () => void;
}

export function Login({ onLogin, onBack }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      onLogin();
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl border border-espresso/5 overflow-hidden"
      >
        <div className="p-8 md:p-12">
          <button 
            onClick={onBack}
            className="mb-8 flex items-center gap-2 text-cocoa/50 hover:text-cocoa transition-colors font-bold text-sm uppercase tracking-widest"
          >
            <ArrowLeft size={16} /> Back to Site
          </button>

          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-cream rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Lock className="text-cocoa" size={32} />
            </div>
            <h1 className="text-3xl font-serif font-bold text-espresso">Admin Login</h1>
            <p className="text-cocoa/60 mt-2">Manage your bakery and orders</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-cocoa/40 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-cocoa/30" size={18} />
                <input 
                  required
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@minicrumbs.com"
                  className="w-full bg-cream-dark/50 border-2 border-transparent focus:border-blush/30 focus:bg-white rounded-2xl px-12 py-4 outline-none transition-all text-espresso"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-cocoa/40 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-cocoa/30" size={18} />
                <input 
                  required
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-cream-dark/50 border-2 border-transparent focus:border-blush/30 focus:bg-white rounded-2xl px-12 py-4 outline-none transition-all text-espresso"
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium"
              >
                {error}
              </motion.div>
            )}

            <button 
              disabled={loading}
              type="submit"
              className="w-full bg-espresso text-cream font-bold py-5 rounded-2xl shadow-xl hover:bg-cocoa active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70"
            >
              {loading ? (
                <>Logging in... <Loader2 className="animate-spin" size={20} /></>
              ) : (
                <>Sign In to Dashboard</>
              )}
            </button>
          </form>
        </div>
        
        <div className="bg-cream p-6 text-center border-t border-espresso/5">
          <span className="text-[10px] font-bold text-cocoa/40 uppercase tracking-[0.2em]">Authorized Personnel Only</span>
        </div>
      </motion.div>
    </div>
  );
}
