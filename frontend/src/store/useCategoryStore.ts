import { create } from 'zustand';
import { api } from '../api/client';

export interface RoleSubCategory {
  id: string;
  name: string;
  slug: string;
  roleCategoryId: string;
}

export interface RoleCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  roleGroup: 'CLIENT' | 'PROVIDER';
  description: string | null;
  info: string | null;
  subCategories: RoleSubCategory[];
}

interface CategoryState {
  categories: RoleCategory[];
  isLoading: boolean;
  error: string | null;
  initialized: boolean;
  fetchCategories: () => Promise<void>;
  getCategoryBySlug: (slug: string) => RoleCategory | undefined;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  isLoading: false,
  error: null,
  initialized: false,
  fetchCategories: async () => {
    if (get().initialized && get().categories.length > 0) return;

    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/auth/roles');
      if (res.data.success) {
        set({ 
          categories: res.data.categories, 
          initialized: true, 
          isLoading: false 
        });
      }
    } catch (error: any) {
      console.error('❌ [API] Fetch Categories Error:', error);
      set({ 
        error: error.message || 'Failed to load roles from server', 
        isLoading: false 
      });
    }
  },
  getCategoryBySlug: (slug: string) => {
    return get().categories.find(c => c.slug === slug);
  }
}));
