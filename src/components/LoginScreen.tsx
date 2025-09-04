import React from 'react';
import { useAuth } from '../lib/auth';
import { Film, Sparkles } from 'lucide-react';

export function LoginScreen() {
  const { users, login } = useAuth();
  
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}
    >
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full mb-6">
            <Film className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Bios</h1>
          <p className="text-white/80 text-lg">Your personal movie companion</p>
        </div>

        {/* User Selection */}
        <div className="space-y-4">
          <h2 className="text-white text-center mb-6 flex items-center justify-center space-x-2">
            <Sparkles className="w-5 h-5" />
            <span>Choose your profile</span>
          </h2>
          
          {users.map(user => (
            <button
              key={user.id}
              onClick={() => login(user.id)}
              className="w-full flex items-center space-x-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-200 group"
            >
              <img
                src={user.avatar}
                alt={user.name}
                className="w-12 h-12 rounded-full ring-2 ring-white/30 group-hover:ring-white/50 transition-all"
              />
              <div className="flex-1 text-left">
                <h3 className="text-lg font-medium text-white">{user.name}</h3>
                <p className="text-sm text-white/70">Continue watching</p>
              </div>
              <div className="text-white/50 group-hover:text-white/80 transition-colors">
                →
              </div>
            </button>
          ))}
        </div>

        {/* Features */}
        <div className="mt-12 text-center">
          <p className="text-white/60 text-sm">
            Track • Rate • Discover • Share
          </p>
        </div>
      </div>
    </div>
  );
}