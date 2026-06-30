import { useQuery } from '@tanstack/react-query';
import { bitacoraService } from '../services/api';

const defaults = {
  chat_ia: true,
  onboarding: true,
};

export const useFeatureFlags = () => {
  const { data: flags = defaults } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: async () => {
      const arr = await bitacoraService.getFeatureFlags();
      const map = {};
      arr.forEach(f => { map[f.flag] = f.activo; });
      return { ...defaults, ...map };
    },
    staleTime: 5 * 60 * 1000,
  });
  return flags;
};
