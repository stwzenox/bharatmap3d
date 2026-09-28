import { create } from 'zustand';
import { User, UserRole, SuperAdminMetrics } from '../types';
import { AuthApi } from '../api/authClient';

interface AuthState {
  currentUser: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Modal visibility
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'signup';
  isSuperAdminModalOpen: boolean;
  isAddBuildingModalOpen: boolean;

  // Super Admin state
  adminsList: User[];
  superAdminMetrics: SuperAdminMetrics | null;
  isLoadingAdmins: boolean;

  // Actions
  openAuthModal: (tab?: 'login' | 'signup') => void;
  closeAuthModal: () => void;
  openSuperAdminModal: () => void;
  closeSuperAdminModal: () => void;
  openAddBuildingModal: () => void;
  closeAddBuildingModal: () => void;
  clearError: () => void;

  login: (email: string, password?: string) => Promise<User>;
  signup: (payload: {
    email: string;
    password?: string;
    name: string;
    role: 'citizen' | 'admin';
    organization?: string;
  }) => Promise<{ user: User; message: string }>;
  logout: () => void;

  fetchAdmins: () => Promise<void>;
  approveAdmin: (userId: string) => Promise<void>;
  revokeAdmin: (userId: string) => Promise<void>;
  deleteAdmin: (userId: string) => Promise<void>;
  fetchSuperAdminMetrics: (buildingsCount?: number) => Promise<void>;
}

const STORAGE_AUTH_USER_KEY = '3d_cadastre_active_user';

// Clean up legacy localStorage key
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem(STORAGE_AUTH_USER_KEY);
  } catch {}
}

function getInitialUser(): User | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = sessionStorage.getItem(STORAGE_AUTH_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set, get) => {
  const initialUser = getInitialUser();

  return {
    currentUser: initialUser,
    role: initialUser ? initialUser.role : 'guest',
    isAuthenticated: !!initialUser,
    isLoading: false,
    error: null,

    isAuthModalOpen: false,
    authModalTab: 'login',
    isSuperAdminModalOpen: false,
    isAddBuildingModalOpen: false,

    adminsList: [],
    superAdminMetrics: null,
    isLoadingAdmins: false,

    openAuthModal: (tab = 'login') => {
      set({ isAuthModalOpen: true, authModalTab: tab, error: null });
    },
    closeAuthModal: () => {
      set({ isAuthModalOpen: false, error: null });
    },

    openSuperAdminModal: () => {
      set({ isSuperAdminModalOpen: true });
      get().fetchAdmins();
      get().fetchSuperAdminMetrics();
    },
    closeSuperAdminModal: () => {
      set({ isSuperAdminModalOpen: false });
    },

    openAddBuildingModal: () => {
      set({ isAddBuildingModalOpen: true });
    },
    closeAddBuildingModal: () => {
      set({ isAddBuildingModalOpen: false });
    },

    clearError: () => {
      set({ error: null });
    },

    login: async (email: string, password?: string) => {
      set({ isLoading: true, error: null });
      try {
        const { user } = await AuthApi.login({ email, password });
        try { sessionStorage.setItem(STORAGE_AUTH_USER_KEY, JSON.stringify(user)); } catch {}
        set({
          currentUser: user,
          role: user.role,
          isAuthenticated: true,
          isLoading: false,
          isAuthModalOpen: false,
        });
        return user;
      } catch (err: any) {
        const msg = err.message || 'Login failed. Please check credentials.';
        set({ isLoading: false, error: msg });
        throw new Error(msg);
      }
    },

    signup: async (payload) => {
      set({ isLoading: true, error: null });
      try {
        const res = await AuthApi.signup(payload);
        set({ isLoading: false });
        // If citizen, automatically log them in or notify them
        if (res.user.role === 'citizen') {
          try { sessionStorage.setItem(STORAGE_AUTH_USER_KEY, JSON.stringify(res.user)); } catch {}
          set({
            currentUser: res.user,
            role: 'citizen',
            isAuthenticated: true,
            isAuthModalOpen: false,
          });
        }
        return res;
      } catch (err: any) {
        const msg = err.message || 'Signup failed.';
        set({ isLoading: false, error: msg });
        throw new Error(msg);
      }
    },

    logout: () => {
      try { sessionStorage.removeItem(STORAGE_AUTH_USER_KEY); } catch {}
      set({
        currentUser: null,
        role: 'guest',
        isAuthenticated: false,
        isSuperAdminModalOpen: false,
        isAddBuildingModalOpen: false,
      });
    },

    fetchAdmins: async () => {
      set({ isLoadingAdmins: true });
      try {
        const admins = await AuthApi.getAdmins();
        set({ adminsList: admins, isLoadingAdmins: false });
      } catch (err) {
        set({ isLoadingAdmins: false });
      }
    },

    approveAdmin: async (userId: string) => {
      try {
        await AuthApi.approveAdmin(userId);
        await get().fetchAdmins();
        await get().fetchSuperAdminMetrics();
      } catch (err: any) {
        set({ error: err.message });
      }
    },

    revokeAdmin: async (userId: string) => {
      try {
        await AuthApi.revokeAdmin(userId);
        await get().fetchAdmins();
        await get().fetchSuperAdminMetrics();
      } catch (err: any) {
        set({ error: err.message });
      }
    },

    deleteAdmin: async (userId: string) => {
      try {
        await AuthApi.deleteAdmin(userId);
        await get().fetchAdmins();
        await get().fetchSuperAdminMetrics();
      } catch (err: any) {
        set({ error: err.message });
      }
    },

    fetchSuperAdminMetrics: async (buildingsCount?: number) => {
      try {
        const metrics = await AuthApi.getSuperAdminMetrics(buildingsCount);
        set({ superAdminMetrics: metrics });
      } catch (err) {
        console.error('Failed to fetch super admin metrics', err);
      }
    }
  };
});
