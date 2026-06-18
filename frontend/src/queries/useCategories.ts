import { useQuery } from '@tanstack/react-query';
import { categoryService } from '../api/services/category.service';
import type { RoleCategory } from '../api/services/category.service';

export const CATEGORIES_QUERY_KEY = ['roles', 'categories'];

export const useCategories = () => {
  const query = useQuery({
    queryKey: CATEGORIES_QUERY_KEY,
    queryFn: categoryService.fetchCategories,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000,    // 1 hour
  });

  const getCategoryBySlug = (slug: string): RoleCategory | undefined => {
    return query.data?.find((c) => c.slug === slug);
  };

  return {
    ...query,
    categories: query.data || [],
    getCategoryBySlug,
  };
};
