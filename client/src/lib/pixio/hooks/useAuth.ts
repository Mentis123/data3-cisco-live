import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pixioApi } from '../api';

interface User {
  id: string;
  email: string;
  name: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface AuthResponse {
  user: User;
  accessToken: string;
}

export function useAuth() {
  const queryClient = useQueryClient();

  // Get current user
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ['pixio-auth', 'user'],
    queryFn: async () => {
      try {
        return await pixioApi.get<User>('/api/auth/me');
      } catch (error: any) {
        if (error?.status === 401) {
          return null;
        }
        throw error;
      }
    },
    retry: false,
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await pixioApi.post<AuthResponse>('/api/auth/login', data);
      // Store access token if needed (or rely on httpOnly cookies)
      if (response.accessToken) {
        localStorage.setItem('pixio_access_token', response.accessToken);
      }
      return response;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['pixio-auth', 'user'], data.user);
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await pixioApi.post('/api/auth/logout');
      localStorage.removeItem('pixio_access_token');
    },
    onSuccess: () => {
      queryClient.setQueryData(['pixio-auth', 'user'], null);
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  };
}
