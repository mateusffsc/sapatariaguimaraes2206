import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { whatsappService, WhatsAppTemplate, WhatsAppMessage, WhatsAppConfig } from '@/services/whatsappService';
import { toast } from '@/hooks/use-toast';

// Hook para configuração do WhatsApp
export const useWhatsAppConfig = () => {
  const queryClient = useQueryClient();

  const configQuery = useQuery({
    queryKey: ['whatsapp-config'],
    queryFn: () => whatsappService.getConfig(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const updateConfigMutation = useMutation({
    mutationFn: (config: Partial<WhatsAppConfig>) => whatsappService.updateConfig(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-config'] });
      toast({
        title: "Sucesso",
        description: "Configuração do WhatsApp atualizada com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar configuração do WhatsApp",
        variant: "destructive",
      });
    },
  });

  const checkConnectionMutation = useMutation({
    mutationFn: () => whatsappService.checkConnection(),
    onSuccess: (result) => {
      if (result.connected) {
        toast({
          title: "Conexão estabelecida",
          description: "WhatsApp conectado com sucesso!",
        });
      } else {
        toast({
          title: "Falha na conexão",
          description: result.error || "Não foi possível conectar ao WhatsApp",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro de conexão",
        description: error.message || "Erro ao verificar conexão do WhatsApp",
        variant: "destructive",
      });
    },
  });

  return {
    config: configQuery.data,
    isLoading: configQuery.isLoading,
    error: configQuery.error,
    updateConfig: updateConfigMutation.mutate,
    isUpdating: updateConfigMutation.isPending,
    checkConnection: checkConnectionMutation.mutate,
    isChecking: checkConnectionMutation.isPending,
    connectionResult: checkConnectionMutation.data,
    refetch: configQuery.refetch,
  };
};

// Hook para templates do WhatsApp
export const useWhatsAppTemplates = () => {
  const queryClient = useQueryClient();

  const templatesQuery = useQuery({
    queryKey: ['whatsapp-templates'],
    queryFn: () => whatsappService.getTemplates(),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });

  const createTemplateMutation = useMutation({
    mutationFn: (template: Omit<WhatsAppTemplate, 'id' | 'created_at' | 'updated_at'>) => 
      whatsappService.createTemplate(template),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
      toast({
        title: "Sucesso",
        description: "Template criado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar template",
        variant: "destructive",
      });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, template }: { id: string; template: Partial<WhatsAppTemplate> }) => 
      whatsappService.updateTemplate(id, template),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
      toast({
        title: "Sucesso",
        description: "Template atualizado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar template",
        variant: "destructive",
      });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id: string) => whatsappService.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
      toast({
        title: "Sucesso",
        description: "Template excluído com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir template",
        variant: "destructive",
      });
    },
  });

  return {
    templates: templatesQuery.data || [],
    isLoading: templatesQuery.isLoading,
    error: templatesQuery.error,
    createTemplate: createTemplateMutation.mutate,
    isCreating: createTemplateMutation.isPending,
    updateTemplate: updateTemplateMutation.mutate,
    isUpdating: updateTemplateMutation.isPending,
    deleteTemplate: deleteTemplateMutation.mutate,
    isDeleting: deleteTemplateMutation.isPending,
    refetch: templatesQuery.refetch,
  };
};

// Hook para mensagens do WhatsApp
export const useWhatsAppMessages = (limit = 50) => {
  const queryClient = useQueryClient();

  const messagesQuery = useQuery({
    queryKey: ['whatsapp-messages', limit],
    queryFn: () => whatsappService.getMessages(limit),
    staleTime: 30 * 1000, // 30 segundos
    refetchInterval: 60 * 1000, // Refetch a cada minuto
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ 
      phone, 
      message, 
      templateId, 
      serviceOrderId 
    }: { 
      phone: string; 
      message: string; 
      templateId?: string; 
      serviceOrderId?: string; 
    }) => whatsappService.sendMessage(phone, message, templateId, serviceOrderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-messages'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-stats'] });
      toast({
        title: "Sucesso",
        description: "Mensagem enviada com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro no envio",
        description: error.message || "Erro ao enviar mensagem",
        variant: "destructive",
      });
    },
  });

  const sendTemplateMessageMutation = useMutation({
    mutationFn: ({ 
      phone, 
      templateId, 
      variables, 
      serviceOrderId 
    }: { 
      phone: string; 
      templateId: string; 
      variables: Record<string, any>; 
      serviceOrderId?: string; 
    }) => whatsappService.sendTemplateMessage(phone, templateId, variables, serviceOrderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-messages'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-stats'] });
      toast({
        title: "Sucesso",
        description: "Mensagem template enviada com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro no envio",
        description: error.message || "Erro ao enviar mensagem template",
        variant: "destructive",
      });
    },
  });

  return {
    messages: messagesQuery.data || [],
    isLoading: messagesQuery.isLoading,
    error: messagesQuery.error,
    sendMessage: sendMessageMutation.mutate,
    isSending: sendMessageMutation.isPending,
    sendTemplateMessage: sendTemplateMessageMutation.mutate,
    isSendingTemplate: sendTemplateMessageMutation.isPending,
    refetch: messagesQuery.refetch,
  };
};

// Hook para estatísticas do WhatsApp
export const useWhatsAppStats = () => {
  const statsQuery = useQuery({
    queryKey: ['whatsapp-stats'],
    queryFn: () => whatsappService.getStats(),
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchInterval: 5 * 60 * 1000, // Refetch a cada 5 minutos
  });

  return {
    stats: statsQuery.data,
    isLoading: statsQuery.isLoading,
    error: statsQuery.error,
    refetch: statsQuery.refetch,
  };
};

// Hook combinado para dashboard do WhatsApp
export const useWhatsAppDashboard = () => {
  const config = useWhatsAppConfig();
  const templates = useWhatsAppTemplates();
  const messages = useWhatsAppMessages(20); // Últimas 20 mensagens
  const stats = useWhatsAppStats();

  const isLoading = config.isLoading || templates.isLoading || messages.isLoading || stats.isLoading;
  const hasError = config.error || templates.error || messages.error || stats.error;

  const refetchAll = () => {
    config.refetch();
    templates.refetch();
    messages.refetch();
    stats.refetch();
  };

  return {
    config: config.config,
    templates: templates.templates,
    messages: messages.messages,
    stats: stats.stats,
    isLoading,
    hasError,
    refetchAll,
    // Operações
    updateConfig: config.updateConfig,
    checkConnection: config.checkConnection,
    createTemplate: templates.createTemplate,
    updateTemplate: templates.updateTemplate,
    deleteTemplate: templates.deleteTemplate,
    sendMessage: messages.sendMessage,
    sendTemplateMessage: messages.sendTemplateMessage,
    // Estados
    isUpdatingConfig: config.isUpdating,
    isCheckingConnection: config.isChecking,
    isCreatingTemplate: templates.isCreating,
    isUpdatingTemplate: templates.isUpdating,
    isDeletingTemplate: templates.isDeleting,
    isSendingMessage: messages.isSending || messages.isSendingTemplate,
  };
}; 