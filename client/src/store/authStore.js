import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '../services/api';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      hasSeenOnboarding: false,
      isLoading: false,
      error: null,
      
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/login', { email, password });
          set({ user: response.data, hasSeenOnboarding: false, isLoading: false });
          return true;
        } catch (error) {
          set({ error: error.response?.data?.message || 'Login failed', isLoading: false });
          return false;
        }
      },
      
      register: async (username, email, password) => {
        set({ isLoading: true, error: null });
        try {
          await api.post('/auth/register', { username, email, password });
          set({ isLoading: false });
          return true;
        } catch (error) {
          set({ error: error.response?.data?.message || 'Registration failed', isLoading: false });
          return false;
        }
      },
      
      logout: () => {
        set({ user: null, hasSeenOnboarding: false });
      },

      fetchProfile: async () => {
        try {
          const res = await api.get('/auth/profile');
          const current = useAuthStore.getState().user;
          if (current && res.data) {
            set({ user: { ...current, warnings: res.data.warnings || 0 } });
          }
        } catch (err) {
          console.error('Failed to fetch profile', err);
        }
      },

      setHasSeenOnboarding: (value) => {
        set({ hasSeenOnboarding: value });
      },
      
      clearError: () => set({ error: null })
    }),
    {
      name: 'error404-auth',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export default useAuthStore;
