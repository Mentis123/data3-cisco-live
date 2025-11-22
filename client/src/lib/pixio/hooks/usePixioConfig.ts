import { useQuery } from '@tanstack/react-query';
import { loadConfig, type PixioConfig } from '../config';

export function usePixioConfig() {
  return useQuery<PixioConfig>({
    queryKey: ['pixio-config'],
    queryFn: loadConfig,
    staleTime: Infinity, // Config rarely changes
  });
}
