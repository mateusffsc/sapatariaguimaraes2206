import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TemplateService } from '../services/templateService';
import type { DocumentTemplate, CreateDocumentTemplate, UpdateDocumentTemplate } from '../types/database';
import { useToast } from './use-toast';

// ==================== HOOKS PARA TEMPLATES ====================

export function useListarTemplates(tipo?: string) {
  return useQuery({
    queryKey: ['templates', tipo],
    queryFn: () => TemplateService.listarTemplates(tipo),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

export function useObterTemplate(id: number) {
  return useQuery({
    queryKey: ['template', id],
    queryFn: () => TemplateService.obterTemplate(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useObterTemplatePadrao(tipo: string, categoria?: string) {
  return useQuery({
    queryKey: ['template_padrao', tipo, categoria],
    queryFn: () => TemplateService.obterTemplatePadrao(tipo, categoria),
    enabled: !!tipo,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useCriarTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (dados: CreateDocumentTemplate) => 
      TemplateService.criarTemplate(dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast({
        title: 'Sucesso!',
        description: 'Template criado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro!',
        description: error.message || 'Erro ao criar template.',
        variant: 'destructive',
      });
    },
  });
}

export function useAtualizarTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, dados }: { id: number; dados: UpdateDocumentTemplate }) => 
      TemplateService.atualizarTemplate(id, dados),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['template', data.id] });
      toast({
        title: 'Sucesso!',
        description: 'Template atualizado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro!',
        description: error.message || 'Erro ao atualizar template.',
        variant: 'destructive',
      });
    },
  });
}

export function useExcluirTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: TemplateService.excluirTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast({
        title: 'Sucesso!',
        description: 'Template excluído com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro!',
        description: error.message || 'Erro ao excluir template.',
        variant: 'destructive',
      });
    },
  });
}

export function useDuplicarTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, novoNome }: { id: number; novoNome: string }) => 
      TemplateService.duplicarTemplate(id, novoNome),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast({
        title: 'Sucesso!',
        description: 'Template duplicado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro!',
        description: error.message || 'Erro ao duplicar template.',
        variant: 'destructive',
      });
    },
  });
}

export function useInicializarTemplatesPadrao() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: TemplateService.inicializarTemplatesPadrao,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast({
        title: 'Sucesso!',
        description: 'Templates padrão inicializados com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro!',
        description: error.message || 'Erro ao inicializar templates padrão.',
        variant: 'destructive',
      });
    },
  });
}

// ==================== HOOKS UTILITÁRIOS ====================

export function useTemplatesPorTipo() {
  const { data: templates, ...rest } = useListarTemplates();

  const templatesPorTipo = templates?.reduce((acc, template) => {
    if (!acc[template.type]) {
      acc[template.type] = [];
    }
    acc[template.type].push(template);
    return acc;
  }, {} as Record<string, DocumentTemplate[]>);

  return {
    data: templatesPorTipo,
    ...rest
  };
}

export function useEstatisticasTemplates() {
  const { data: templates } = useListarTemplates();

  const estatisticas = {
    total: templates?.length || 0,
    ativos: templates?.filter(t => t.is_active).length || 0,
    inativos: templates?.filter(t => !t.is_active).length || 0,
    padrao: templates?.filter(t => t.is_default).length || 0,
    porTipo: templates?.reduce((acc, template) => {
      acc[template.type] = (acc[template.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {},
  };

  return estatisticas;
}

export function useProcessarTemplate() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ templateContent, dados }: { templateContent: string; dados: Record<string, any> }) => 
      Promise.resolve(TemplateService.processarTemplate(templateContent, dados)),
    onError: (error) => {
      toast({
        title: 'Erro!',
        description: 'Erro ao processar template.',
        variant: 'destructive',
      });
    },
  });
}

export function useVariaveisDisponiveis() {
  return TemplateService.obterVariaveisDisponiveis();
} 