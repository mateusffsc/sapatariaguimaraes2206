import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../services/analyticsService';

// Hook para performance dos técnicos
export const useTechnicianPerformance = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: ['analytics', 'technician-performance', startDate, endDate],
    queryFn: () => analyticsService.getTechnicianPerformance(startDate, endDate),
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });
};

// Hook para análise por período
export const usePeriodAnalysis = (
  period: 'daily' | 'weekly' | 'monthly' = 'monthly',
  months: number = 12
) => {
  return useQuery({
    queryKey: ['analytics', 'period-analysis', period, months],
    queryFn: () => analyticsService.getPeriodAnalysis(period, months),
    staleTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
  });
};

// Hook para métricas gerais do negócio
export const useBusinessMetrics = () => {
  return useQuery({
    queryKey: ['analytics', 'business-metrics'],
    queryFn: () => analyticsService.getBusinessMetrics(),
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchOnWindowFocus: false,
    refetchInterval: 5 * 60 * 1000, // Atualizar a cada 5 minutos
  });
};

// Hook composto para todas as métricas da dashboard
export const useDashboardAnalytics = () => {
  const businessMetrics = useBusinessMetrics();
  const technicianPerformance = useTechnicianPerformance();
  const periodAnalysis = usePeriodAnalysis();

  return {
    businessMetrics,
    technicianPerformance,
    periodAnalysis,
    isLoading: businessMetrics.isLoading || technicianPerformance.isLoading || periodAnalysis.isLoading,
    error: businessMetrics.error || technicianPerformance.error || periodAnalysis.error,
    refetchAll: () => {
      businessMetrics.refetch();
      technicianPerformance.refetch();
      periodAnalysis.refetch();
    }
  };
}; 