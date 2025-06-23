import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportService } from '../services/reportService';

// Hook para relatório diário de caixa
export const useDailyCashReport = (date?: Date) => {
  return useQuery({
    queryKey: ['reports', 'daily-cash', date?.toISOString()],
    queryFn: () => reportService.generateDailyCashReport(date),
    staleTime: 30 * 60 * 1000, // 30 minutos
    refetchOnWindowFocus: false,
  });
};

// Hook para relatório semanal de OS
export const useWeeklyServiceOrdersReport = (date?: Date) => {
  return useQuery({
    queryKey: ['reports', 'weekly-orders', date?.toISOString()],
    queryFn: () => reportService.generateWeeklyServiceOrdersReport(date),
    staleTime: 60 * 60 * 1000, // 1 hora
    refetchOnWindowFocus: false,
  });
};

// Hook para balanço mensal
export const useMonthlyBalanceReport = (date?: Date) => {
  return useQuery({
    queryKey: ['reports', 'monthly-balance', date?.toISOString()],
    queryFn: () => reportService.generateMonthlyBalanceReport(date),
    staleTime: 60 * 60 * 1000, // 1 hora
    refetchOnWindowFocus: false,
  });
};

// Hook para gerar todos os relatórios
export const useAllReports = (date?: Date) => {
  return useQuery({
    queryKey: ['reports', 'all', date?.toISOString()],
    queryFn: () => reportService.generateAllReports(date),
    staleTime: 30 * 60 * 1000, // 30 minutos
    refetchOnWindowFocus: false,
  });
};

// Hook composto para dashboard de relatórios
export const useReportsDashboard = (date?: Date) => {
  const dailyReport = useDailyCashReport(date);
  const weeklyReport = useWeeklyServiceOrdersReport(date);
  const monthlyReport = useMonthlyBalanceReport(date);

  return {
    dailyReport,
    weeklyReport,
    monthlyReport,
    isLoading: dailyReport.isLoading || weeklyReport.isLoading || monthlyReport.isLoading,
    error: dailyReport.error || weeklyReport.error || monthlyReport.error,
    refetchAll: () => {
      dailyReport.refetch();
      weeklyReport.refetch();
      monthlyReport.refetch();
    }
  };
}; 