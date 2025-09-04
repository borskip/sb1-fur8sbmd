import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  name: string;
  avatar: string;
  email: string;
}

const USERS: User[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Dario',
    email: 'dario@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dario&style=circle&backgroundColor=b6e3f4&hairColor=2c1b18&facialHairType=beardMedium&facialHairColor=2c1b18&skinColor=f8d25c'
  },
  {
    id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    name: 'Sep',
    email: 'sep@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sep&style=circle&backgroundColor=b6e3f4&hairColor=f9d71c&facialHairType=blank&skinColor=ffdbb4'
  },
  {
    id: '7ba7b810-9dad-11d1-80b4-00c04fd430c8',
    name: 'Rob',
    email: 'rob@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rob&style=circle&backgroundColor=b6e3f4&hairColor=000000&facialHairType=blank&skinColor=edb98a&eyes=happy'
  }
];

interface AuthState {
  user: User | null;
  users: User[];
  login: (userId: string) => void;
  logout: () => void;
  getUsername: (userId: string) => string;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      users: USERS,
      login: (userId: string) => {
        const user = USERS.find(u => u.id === userId);
        if (user) {
          set({ user });
        }
      },
      logout: () => set({ user: null }),
      getUsername: (userId: string) => {
        return USERS.find(u => u.id === userId)?.name || 'Unknown User';
      }
    }),
    {
      name: 'movie-tracker-auth',
      partialize: (state) => ({ user: state.user })
    }
  )
);