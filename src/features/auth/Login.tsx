import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../services/api/authApi';
import { LogIn } from 'lucide-react';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';

export function Login() {
  const [email, setEmail] = useState('test@vku.udn.vn');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: () => authApi.login({ email, password }),
    onSuccess: (data) => {
      localStorage.setItem('auth_token', data.token);
      queryClient.setQueryData(['currentUser'], data.user);
      navigate('/dashboard');
    },
    onError: (err: any) => {
      setError(err.message || 'Login failed');
    }
  });

  const googleLoginMutation = useMutation({
    mutationFn: async () => {
      let googleUser;
      if (Capacitor.isNativePlatform()) {
        googleUser = await GoogleAuth.signIn();
      } else {
        // Fallback for demo on Web without real client ID
        await new Promise(r => setTimeout(r, 800));
        googleUser = {
          authentication: { idToken: 'mock-google-token' }
        };
      }
      return authApi.loginWithGoogle(googleUser.authentication.idToken);
    },
    onSuccess: (data) => {
      localStorage.setItem('auth_token', data.token);
      queryClient.setQueryData(['currentUser'], data.user);
      navigate('/dashboard');
    },
    onError: (err: any) => {
      setError(err.message || 'Google Login failed');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    loginMutation.mutate();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-primary-600 p-8 text-center text-white">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">VKU Field Survey</h1>
          <p className="text-primary-100 mt-2 text-sm">Sign in to continue</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <button
            type="submit"
            disabled={loginMutation.isPending || googleLoginMutation.isPending}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
          >
            {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">Or continue with</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>
          
          <button
            type="button"
            onClick={() => googleLoginMutation.mutate()}
            disabled={loginMutation.isPending || googleLoginMutation.isPending}
            className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-2.5 rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center shadow-sm"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 mr-2" />
            {googleLoginMutation.isPending ? 'Connecting...' : 'Google'}
          </button>
        </form>
      </div>
    </div>
  );
}
