import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { whatsappAutomationService, AutomationRule, AutomationExecution, AutomationStats } from '@/services/whatsappAutomationService';
import { toast } from '@/hooks/use-toast';

// Hook para regras de automação
export const useAutomationRules = () => {
  const queryClient = useQueryClient();

  const rulesQuery = useQuery({
    queryKey: ['automation-rules'],
    queryFn: () => whatsappAutomationService.getAutomationRules(),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });

  const createRuleMutation = useMutation({
    mutationFn: (rule: Omit<AutomationRule, 'id' | 'created_at' | 'updated_at'>) => 
      whatsappAutomationService.createAutomationRule(rule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      queryClient.invalidateQueries({ queryKey: ['automation-stats'] });
      toast({
        title: "Sucesso",
        description: "Regra de automação criada com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar regra de automação",
        variant: "destructive",
      });
    },
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({ id, rule }: { id: string; rule: Partial<AutomationRule> }) => 
      whatsappAutomationService.updateAutomationRule(id, rule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      queryClient.invalidateQueries({ queryKey: ['automation-stats'] });
      toast({
        title: "Sucesso",
        description: "Regra de automação atualizada com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar regra de automação",
        variant: "destructive",
      });
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (id: string) => whatsappAutomationService.deleteAutomationRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      queryClient.invalidateQueries({ queryKey: ['automation-stats'] });
      queryClient.invalidateQueries({ queryKey: ['automation-executions'] });
      toast({
        title: "Sucesso",
        description: "Regra de automação excluída com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir regra de automação",
        variant: "destructive",
      });
    },
  });

  const toggleRuleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => 
      whatsappAutomationService.updateAutomationRule(id, { active }),
    onSuccess: (_, { active }) => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      queryClient.invalidateQueries({ queryKey: ['automation-stats'] });
      toast({
        title: "Sucesso",
        description: `Regra ${active ? 'ativada' : 'desativada'} com sucesso!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao alterar status da regra",
        variant: "destructive",
      });
    },
  });

  return {
    rules: rulesQuery.data || [],
    isLoading: rulesQuery.isLoading,
    error: rulesQuery.error,
    createRule: createRuleMutation.mutate,
    isCreating: createRuleMutation.isPending,
    updateRule: updateRuleMutation.mutate,
    isUpdating: updateRuleMutation.isPending,
    deleteRule: deleteRuleMutation.mutate,
    isDeleting: deleteRuleMutation.isPending,
    toggleRule: toggleRuleMutation.mutate,
    isToggling: toggleRuleMutation.isPending,
    refetch: rulesQuery.refetch,
  };
};

// Hook para execuções de automação
export const useAutomationExecutions = (limit = 50) => {
  const queryClient = useQueryClient();

  const executionsQuery = useQuery({
    queryKey: ['automation-executions', limit],
    queryFn: () => whatsappAutomationService.getAutomationExecutions(limit),
    staleTime: 30 * 1000, // 30 segundos
    refetchInterval: 60 * 1000, // Refetch a cada minuto
  });

  const scheduleAutomationMutation = useMutation({
    mutationFn: ({ 
      ruleId, 
      serviceOrderId, 
      scheduledAt 
    }: { 
      ruleId: string; 
      serviceOrderId: string; 
      scheduledAt: Date; 
    }) => whatsappAutomationService.scheduleAutomation(ruleId, serviceOrderId, scheduledAt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-executions'] });
      queryClient.invalidateQueries({ queryKey: ['automation-stats'] });
      toast({
        title: "Sucesso",
        description: "Automação agendada com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro no agendamento",
        description: error.message || "Erro ao agendar automação",
        variant: "destructive",
      });
    },
  });

  const executeAutomationMutation = useMutation({
    mutationFn: (executionId: string) => whatsappAutomationService.executeScheduledAutomation(executionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-executions'] });
      queryClient.invalidateQueries({ queryKey: ['automation-stats'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-messages'] });
      toast({
        title: "Sucesso",
        description: "Automação executada com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro na execução",
        description: error.message || "Erro ao executar automação",
        variant: "destructive",
      });
    },
  });

  const processScheduledMutation = useMutation({
    mutationFn: () => whatsappAutomationService.processScheduledAutomations(),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['automation-executions'] });
      queryClient.invalidateQueries({ queryKey: ['automation-stats'] });
      toast({
        title: "Processamento concluído",
        description: `${result.processed} automações processadas, ${result.errors} erros`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro no processamento",
        description: error.message || "Erro ao processar automações agendadas",
        variant: "destructive",
      });
    },
  });

  return {
    executions: executionsQuery.data || [],
    isLoading: executionsQuery.isLoading,
    error: executionsQuery.error,
    scheduleAutomation: scheduleAutomationMutation.mutate,
    isScheduling: scheduleAutomationMutation.isPending,
    executeAutomation: executeAutomationMutation.mutate,
    isExecuting: executeAutomationMutation.isPending,
    processScheduled: processScheduledMutation.mutate,
    isProcessing: processScheduledMutation.isPending,
    refetch: executionsQuery.refetch,
  };
};

// Hook para estatísticas de automação
export const useAutomationStats = () => {
  const statsQuery = useQuery({
    queryKey: ['automation-stats'],
    queryFn: () => whatsappAutomationService.getAutomationStats(),
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

// Hook para execução em lote de automações
export const useAutomationBatch = () => {
  const queryClient = useQueryClient();

  const runBatchMutation = useMutation({
    mutationFn: () => whatsappAutomationService.runAutomationBatch(),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['automation-executions'] });
      queryClient.invalidateQueries({ queryKey: ['automation-stats'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-messages'] });
      
      toast({
        title: "Processamento em lote concluído",
        description: `${result.processed} automações processadas com ${result.errors} erros`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro no processamento em lote",
        description: error.message || "Erro ao executar processamento em lote",
        variant: "destructive",
      });
    },
  });

  return {
    runBatch: runBatchMutation.mutate,
    isRunning: runBatchMutation.isPending,
    lastResult: runBatchMutation.data,
  };
};

// Hook combinado para dashboard de automações
export const useAutomationDashboard = () => {
  const rules = useAutomationRules();
  const executions = useAutomationExecutions(20); // Últimas 20 execuções
  const stats = useAutomationStats();
  const batch = useAutomationBatch();

  const isLoading = rules.isLoading || executions.isLoading || stats.isLoading;
  const hasError = rules.error || executions.error || stats.error;

  const refetchAll = () => {
    rules.refetch();
    executions.refetch();
    stats.refetch();
  };

  return {
    // Dados
    rules: rules.rules,
    executions: executions.executions,
    stats: stats.stats,
    
    // Estados
    isLoading,
    hasError,
    
    // Operações de regras
    createRule: rules.createRule,
    updateRule: rules.updateRule,
    deleteRule: rules.deleteRule,
    toggleRule: rules.toggleRule,
    
    // Operações de execução
    scheduleAutomation: executions.scheduleAutomation,
    executeAutomation: executions.executeAutomation,
    processScheduled: executions.processScheduled,
    
    // Processamento em lote
    runBatch: batch.runBatch,
    isRunningBatch: batch.isRunning,
    batchResult: batch.lastResult,
    
    // Estados de loading
    isCreatingRule: rules.isCreating,
    isUpdatingRule: rules.isUpdating,
    isDeletingRule: rules.isDeleting,
    isTogglingRule: rules.isToggling,
    isScheduling: executions.isScheduling,
    isExecuting: executions.isExecuting,
    isProcessing: executions.isProcessing,
    
    // Utilitários
    refetchAll,
  };
}; 