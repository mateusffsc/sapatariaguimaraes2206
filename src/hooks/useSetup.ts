import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import SetupService from '../services/setupService';
import { toast } from 'sonner';

export function useSetup() {
  const [isInitializing, setIsInitializing] = useState(false);

  // Verificar se há admin no sistema
  const { 
    data: hasAdmin, 
    isLoading: checkingAdmin, 
    refetch: recheckAdmin 
  } = useQuery({
    queryKey: ['system', 'has-admin'],
    queryFn: () => SetupService.hasAdminUser(),
    retry: 2,
    refetchOnWindowFocus: false
  });

  // Criar admin padrão
  const createAdminMutation = useMutation({
    mutationFn: () => SetupService.createDefaultAdmin(),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message);
        recheckAdmin();
      } else {
        toast.error(result.message);
      }
    },
    onError: (error) => {
      console.error('Erro ao criar admin:', error);
      toast.error('Erro inesperado ao criar usuário admin');
    }
  });

  // Forçar criação do admin
  const forceCreateAdminMutation = useMutation({
    mutationFn: () => SetupService.forceCreateAdmin(),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message);
        recheckAdmin();
      } else {
        toast.error(result.message);
      }
    },
    onError: (error) => {
      console.error('Erro ao forçar criação do admin:', error);
      toast.error('Erro inesperado ao forçar criação do admin');
    }
  });

  // Inicializar sistema completo
  const initializeSystemMutation = useMutation({
    mutationFn: () => SetupService.initializeSystem(),
    onSuccess: (result) => {
      if (result.success) {
        if (result.adminCreated) {
          toast.success('Sistema inicializado! Usuário admin criado.');
        } else {
          toast.info('Sistema já estava inicializado.');
        }
        recheckAdmin();
      } else {
        toast.error(result.message);
      }
    },
    onError: (error) => {
      console.error('Erro na inicialização:', error);
      toast.error('Erro inesperado na inicialização do sistema');
    }
  });

  /**
   * Auto-inicialização desativada para evitar loops e erros quando a chave Supabase
   * não possui privilégios de administrador.  Caso deseje habilitar este comportamento,
   * defina a variável de ambiente VITE_AUTO_SETUP=1 e reinicie o front-end.
   */
  useEffect(() => {
    const autoSetup = import.meta.env.VITE_AUTO_SETUP === '1';
    if (
      autoSetup &&
      !checkingAdmin &&
      hasAdmin === false &&
      !isInitializing &&
      !initializeSystemMutation.isPending
    ) {
      setIsInitializing(true);
      console.log('Sistema sem admin detectado, inicializando...');

      initializeSystemMutation.mutateAsync().finally(() => setIsInitializing(false));
    }
  }, [hasAdmin, checkingAdmin, isInitializing, initializeSystemMutation]);

  return {
    // Estado
    hasAdmin,
    isCheckingAdmin: checkingAdmin,
    isInitializing: isInitializing || initializeSystemMutation.isPending,
    
    // Ações
    createAdmin: createAdminMutation.mutateAsync,
    forceCreateAdmin: forceCreateAdminMutation.mutateAsync,
    initializeSystem: initializeSystemMutation.mutateAsync,
    recheckAdmin,
    
    // Loading states
    isCreatingAdmin: createAdminMutation.isPending,
    isForcingAdmin: forceCreateAdminMutation.isPending,
    isInitializingSystem: initializeSystemMutation.isPending,
    
    // Credenciais padrão
    defaultCredentials: SetupService.getDefaultAdminCredentials(),
    
    // Utils
    isDefaultAdmin: SetupService.isDefaultAdmin
  };
}

// Hook para verificar se precisa de setup
export function useRequiresSetup() {
  const { hasAdmin, isCheckingAdmin } = useSetup();
  
  return {
    requiresSetup: hasAdmin === false,
    isLoading: isCheckingAdmin,
    systemReady: hasAdmin === true
  };
} 