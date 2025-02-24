import React from 'react';
import { useAuth } from '../lib/auth';
import { Film } from 'lucide-react';

export function LoginScreen() {
  const { users, login } = useAuth();
  
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 to-gray-800"
      style={{
        backgroundImage: `
          linear-gradient(to bottom right, rgba(17, 24, 39, 0.9), rgba(31, 41, 55, 0.9)),
          url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2560&auto=format&fit=crop')
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="w-full max-w-md mx-4">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-block p-3 rounded-full bg-primary/10 backdrop-blur-sm mb-4">
            <Film className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-white">Bios App</h1>
        </div>

        {/* Login Cards */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20">
          <div className="space-y-4">
            {users.map(user => (
              <button
                key={user.id}
                onClick={() => login(user.id)}
                className="w-full flex items-center space-x-4 p-4 rounded-xl 
                  bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 
                  transition-all duration-200 group"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-md 
                    group-hover:bg-primary/30 transition-colors" />
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="relative w-12 h-12 rounded-full ring-2 ring-white/20 
                      group-hover:ring-white/40 transition-all"
                  />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-lg font-medium text-white group-hover:text-primary 
                    transition-colors">
                    {user.name}
                  </h3>
                  <p className="text-sm text-gray-400">Click to continue</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}