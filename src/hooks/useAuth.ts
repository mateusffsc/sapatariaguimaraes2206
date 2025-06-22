import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AuthService, type LoginCredentials, type RegisterData, type AuthUser } from '../services/authService';
import type { Session } from '@supabase/supabase-js';
import { toast } from '../hooks/use-toast';

export interface AuthState {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export const useAuth = () => {
  const queryClient = useQueryClient();
  
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false
  });

  // Query para verificar se há sessão ativa
  const { data: sessionData, isLoading: isLoadingSession } = useQuery({
    queryKey: ['auth', 'session'],
    queryFn: async () => {
      const session = await AuthService.getCurrentSession();
      const user = session ? await AuthService.getCurrentUser() : null;
      return { session, user };
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });

  // Mutation para login
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await AuthService.signIn(credentials);
      if (response.error) {
        throw new Error(response.error);
      }
      return response;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'session'], data);
      toast({
        title: "Login realizado com sucesso!",
        description: `Bem-vindo, ${data.user?.fullName}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro no login",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation para registro
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const response = await AuthService.signUp(userData);
      if (response.error) {
        throw new Error(response.error);
      }
      return response;
    },
    onSuccess: (data) => {
      if (data.user?.emailConfirmed) {
        queryClient.setQueryData(['auth', 'session'], data);
        toast({
          title: "Cadastro realizado com sucesso!",
          description: `Bem-vindo, ${data.user?.fullName}!`,
        });
      } else {
        toast({
          title: "Cadastro realizado!",
          description: "Verifique seu email para confirmar sua conta.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro no cadastro",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation para logout
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await AuthService.signOut();
      if (response.error) {
        throw new Error(response.error);
      }
      return response;
    },
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'session'], null);
      queryClient.clear(); // Limpar todo cache
      toast({
        title: "Logout realizado com sucesso!",
        description: "Até logo!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro no logout",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation para reset de senha
  const resetPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await AuthService.requestPasswordReset(email);
      if (response.error) {
        throw new Error(response.error);
      }
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao enviar email",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation para atualizar senha
  const updatePasswordMutation = useMutation({
    mutationFn: async (newPassword: string) => {
      const response = await AuthService.updatePassword(newPassword);
      if (response.error) {
        throw new Error(response.error);
      }
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Senha atualizada!",
        description: "Sua senha foi atualizada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar senha",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation para atualizar perfil
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: { fullName?: string; email?: string; metadata?: Record<string, any> }) => {
      const response = await AuthService.updateProfile(updates);
      if (response.error) {
        throw new Error(response.error);
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'session'] });
      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram atualizadas com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Funções de conveniência
  const signIn = useCallback((credentials: LoginCredentials) => {
    return loginMutation.mutateAsync(credentials);
  }, [loginMutation]);

  const signUp = useCallback((userData: RegisterData) => {
    return registerMutation.mutateAsync(userData);
  }, [registerMutation]);

  const signOut = useCallback(() => {
    return logoutMutation.mutateAsync();
  }, [logoutMutation]);

  const requestPasswordReset = useCallback((email: string) => {
    return resetPasswordMutation.mutateAsync(email);
  }, [resetPasswordMutation]);

  const updatePassword = useCallback((newPassword: string) => {
    return updatePasswordMutation.mutateAsync(newPassword);
  }, [updatePasswordMutation]);

  const updateProfile = useCallback((updates: { fullName?: string; email?: string; metadata?: Record<string, any> }) => {
    return updateProfileMutation.mutateAsync(updates);
  }, [updateProfileMutation]);

  // Listener para mudanças de autenticação
  useEffect(() => {
    const { data: { subscription } } = AuthService.onAuthStateChange((user, session) => {
      const newData = { user, session };
      queryClient.setQueryData(['auth', 'session'], newData);
      
      setAuthState({
        user,
        session,
        isLoading: false,
        isAuthenticated: !!session
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  // Atualizar estado quando sessionData muda
  useEffect(() => {
    if (sessionData !== undefined) {
      setAuthState({
        user: sessionData?.user || null,
        session: sessionData?.session || null,
        isLoading: isLoadingSession,
        isAuthenticated: !!sessionData?.session
      });
    }
  }, [sessionData, isLoadingSession]);

  return {
    // Estado
    ...authState,
    
    // Loading states
    isSigningIn: loginMutation.isPending,
    isSigningUp: registerMutation.isPending,
    isSigningOut: logoutMutation.isPending,
    isResettingPassword: resetPasswordMutation.isPending,
    isUpdatingPassword: updatePasswordMutation.isPending,
    isUpdatingProfile: updateProfileMutation.isPending,

    // Funções
    signIn,
    signUp,
    signOut,
    requestPasswordReset,
    updatePassword,
    updateProfile,

    // Utilitários
    validateEmail: AuthService.validateEmail,
    validatePassword: AuthService.validatePassword,
    generateStrongPassword: AuthService.generateStrongPassword,
  };
};

// Hook para verificar se usuário está autenticado (simples)
export const useIsAuthenticated = () => {
  const { isAuthenticated, isLoading } = useAuth();
  return { isAuthenticated, isLoading };
};

// Hook para obter apenas o usuário atual
export const useCurrentUser = () => {
  const { user, isLoading } = useAuth();
  return { user, isLoading };
}; 