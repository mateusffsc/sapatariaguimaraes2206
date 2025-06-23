import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auditService, type AuditLog, type CreateAuditLogData } from '../services/auditService';
import { toast } from './use-toast';

export const useAudit = () => {
  const queryClient = useQueryClient();

  // Mutation para registrar uma ação
  const logActionMutation = useMutation({
    mutationFn: (data: CreateAuditLogData) => auditService.logAction(data),
    onError: (error: Error) => {
      console.error('Erro ao registrar ação:', error);
      // Não mostrar toast para evitar spam em logs automáticos
    },
  });

  // Mutation para limpar logs antigos
  const cleanLogsMutation = useMutation({
    mutationFn: (daysToKeep: number) => auditService.cleanOldLogs(daysToKeep),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['audit', 'logs'] });
      queryClient.invalidateQueries({ queryKey: ['audit', 'stats'] });
      toast({
        title: "Logs limpos com sucesso!",
        description: `${data.deletedCount} registros foram removidos.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao limpar logs",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Funções de conveniência
  const logAction = (data: CreateAuditLogData) => {
    logActionMutation.mutate(data);
  };

  const logLogin = (success: boolean, details?: any) => {
    auditService.logLogin(success, details);
  };

  const logLogout = () => {
    auditService.logLogout();
  };

  const logCreate = (resource: string, resourceId: string, details?: any) => {
    auditService.logCreate(resource, resourceId, details);
  };

  const logUpdate = (resource: string, resourceId: string, details?: any) => {
    auditService.logUpdate(resource, resourceId, details);
  };

  const logDelete = (resource: string, resourceId: string, details?: any) => {
    auditService.logDelete(resource, resourceId, details);
  };

  const logView = (resource: string, resourceId?: string, details?: any) => {
    auditService.logView(resource, resourceId, details);
  };

  const logCritical = (action: string, resource: string, resourceId?: string, details?: any) => {
    auditService.logCritical(action, resource, resourceId, details);
  };

  const cleanOldLogs = (daysToKeep: number = 90) => {
    cleanLogsMutation.mutate(daysToKeep);
  };

  return {
    // Mutations
    isLogging: logActionMutation.isPending,
    isCleaning: cleanLogsMutation.isPending,

    // Actions
    logAction,
    logLogin,
    logLogout,
    logCreate,
    logUpdate,
    logDelete,
    logView,
    logCritical,
    
    // Utilities
    cleanOldLogs,
  };
};

export const useAuditLogs = (filters?: {
  page?: number;
  limit?: number;
  userId?: string;
  resource?: string;
  action?: string;
  severity?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery({
    queryKey: ['audit', 'logs', filters],
    queryFn: () => auditService.getLogs(filters),
    staleTime: 30 * 1000, // 30 segundos
    refetchOnWindowFocus: false,
  });
};

export const useAuditStats = () => {
  return useQuery({
    queryKey: ['audit', 'stats'],
    queryFn: () => auditService.getStats(),
    staleTime: 60 * 1000, // 1 minuto
    refetchOnWindowFocus: false,
  });
}; 