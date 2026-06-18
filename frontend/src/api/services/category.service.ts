import { api } from '../client';

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

export const categoryService = {
  fetchCategories: async (): Promise<RoleCategory[]> => {
    const res = await api.get('/auth/roles');
    if (res.data.success) {
      return res.data.categories;
    }
    throw new Error(res.data.message || 'Failed to load roles from server');
  },
};
