import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ConfigService } from '../services/configService';
import type { CompanySettings, SystemSettings, UpdateCompanySettings } from '../types/database';
import { useToast } from './use-toast';

// ==================== HOOKS PARA CONFIGURAÇÕES DA EMPRESA ====================

export function useConfiguracaoEmpresa() {
  return useQuery({
    queryKey: ['company_settings'],
    queryFn: () => ConfigService.obterConfiguracaoEmpresa(),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

export function useSalvarConfiguracaoEmpresa() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (dados: UpdateCompanySettings) => 
      ConfigService.criarOuAtualizarConfiguracaoEmpresa(dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company_settings'] });
      toast({
        title: 'Sucesso!',
        description: 'Configurações da empresa salvas com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro!',
        description: error.message || 'Erro ao salvar configurações da empresa.',
        variant: 'destructive',
      });
    },
  });
}

// ==================== HOOKS PARA CONFIGURAÇÕES DO SISTEMA ====================

export function useConfiguracoesSistema(categoria?: string) {
  return useQuery({
    queryKey: ['system_settings', categoria],
    queryFn: () => ConfigService.listarConfiguracoesSistema(categoria),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useConfiguracaoSistema(chave: string) {
  return useQuery({
    queryKey: ['system_setting', chave],
    queryFn: () => ConfigService.obterConfiguracaoSistema(chave),
    enabled: !!chave,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useValorConfiguracao<T = string>(chave: string, valorPadrao?: T) {
  return useQuery({
    queryKey: ['setting_value', chave],
    queryFn: () => ConfigService.obterValorConfiguracao<T>(chave, valorPadrao),
    enabled: !!chave,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useDefinirConfiguracaoSistema() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ 
      chave, 
      valor, 
      opcoes 
    }: { 
      chave: string; 
      valor: string | number | boolean | object;
      opcoes?: {
        tipo?: 'string' | 'number' | 'boolean' | 'json';
        descricao?: string;
        categoria?: string;
        isPublic?: boolean;
      };
    }) => ConfigService.definirConfiguracaoSistema(chave, valor, opcoes),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['system_settings'] });
      queryClient.invalidateQueries({ queryKey: ['system_setting', data.setting_key] });
      queryClient.invalidateQueries({ queryKey: ['setting_value', data.setting_key] });
      toast({
        title: 'Sucesso!',
        description: 'Configuração do sistema salva com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro!',
        description: error.message || 'Erro ao salvar configuração do sistema.',
        variant: 'destructive',
      });
    },
  });
}

export function useExcluirConfiguracaoSistema() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ConfigService.excluirConfiguracaoSistema,
    onSuccess: (_, chave) => {
      queryClient.invalidateQueries({ queryKey: ['system_settings'] });
      queryClient.invalidateQueries({ queryKey: ['system_setting', chave] });
      queryClient.invalidateQueries({ queryKey: ['setting_value', chave] });
      toast({
        title: 'Sucesso!',
        description: 'Configuração do sistema excluída com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro!',
        description: error.message || 'Erro ao excluir configuração do sistema.',
        variant: 'destructive',
      });
    },
  });
}

export function useInicializarConfiguracoesDefault() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ConfigService.inicializarConfiguracoesDefaut,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system_settings'] });
      toast({
        title: 'Sucesso!',
        description: 'Configurações padrão inicializadas com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro!',
        description: error.message || 'Erro ao inicializar configurações padrão.',
        variant: 'destructive',
      });
    },
  });
}

// ==================== HOOKS UTILITÁRIOS ====================

export function useConfiguracoesCategorizadas() {
  const { data: configuracoes, ...rest } = useConfiguracoesSistema();

  const configuracoesCategorizadas = configuracoes?.reduce((acc, config) => {
    const categoria = config.category || 'geral';
    if (!acc[categoria]) {
      acc[categoria] = [];
    }
    acc[categoria].push(config);
    return acc;
  }, {} as Record<string, SystemSettings[]>);

  return {
    data: configuracoesCategorizadas,
    ...rest
  };
}

export function useEstatisticasConfiguracao() {
  const { data: configuracoes } = useConfiguracoesSistema();

  const estatisticas = {
    total: configuracoes?.length || 0,
    categorias: new Set(configuracoes?.map(c => c.category)).size || 0,
    publicas: configuracoes?.filter(c => c.is_public).length || 0,
    privadas: configuracoes?.filter(c => !c.is_public).length || 0,
  };

  return estatisticas;
} 