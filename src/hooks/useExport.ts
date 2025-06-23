import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { exportService } from '../services/exportService';
import { DailyCashReport, WeeklyServiceOrdersReport, MonthlyBalanceReport } from '../services/reportService';
import { toast } from '@/hooks/use-toast';

interface ExportOptions {
  filename?: string;
  title?: string;
  subtitle?: string;
  includeCharts?: boolean;
  format?: 'pdf' | 'excel';
}

export const useExport = () => {
  const [isExporting, setIsExporting] = useState(false);

  // Hook para exportar relatório diário para PDF
  const exportDailyToPDF = useMutation({
    mutationFn: async ({ report, options }: { report: DailyCashReport; options?: ExportOptions }) => {
      setIsExporting(true);
      await exportService.exportDailyCashToPDF(report, options);
    },
    onSuccess: () => {
      toast({
        title: "Exportação concluída",
        description: "Relatório diário exportado para PDF com sucesso!",
      });
    },
    onError: (error) => {
      console.error('Erro ao exportar relatório diário para PDF:', error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar o relatório diário para PDF.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsExporting(false);
    }
  });

  // Hook para exportar relatório diário para Excel
  const exportDailyToExcel = useMutation({
    mutationFn: async ({ report, options }: { report: DailyCashReport; options?: ExportOptions }) => {
      setIsExporting(true);
      await exportService.exportDailyCashToExcel(report, options);
    },
    onSuccess: () => {
      toast({
        title: "Exportação concluída",
        description: "Relatório diário exportado para Excel com sucesso!",
      });
    },
    onError: (error) => {
      console.error('Erro ao exportar relatório diário para Excel:', error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar o relatório diário para Excel.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsExporting(false);
    }
  });

  // Hook para exportar relatório semanal para PDF
  const exportWeeklyToPDF = useMutation({
    mutationFn: async ({ report, options }: { report: WeeklyServiceOrdersReport; options?: ExportOptions }) => {
      setIsExporting(true);
      await exportService.exportWeeklyToPDF(report, options);
    },
    onSuccess: () => {
      toast({
        title: "Exportação concluída",
        description: "Relatório semanal exportado para PDF com sucesso!",
      });
    },
    onError: (error) => {
      console.error('Erro ao exportar relatório semanal para PDF:', error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar o relatório semanal para PDF.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsExporting(false);
    }
  });

  // Hook para exportar relatório semanal para Excel
  const exportWeeklyToExcel = useMutation({
    mutationFn: async ({ report, options }: { report: WeeklyServiceOrdersReport; options?: ExportOptions }) => {
      setIsExporting(true);
      await exportService.exportWeeklyToExcel(report, options);
    },
    onSuccess: () => {
      toast({
        title: "Exportação concluída",
        description: "Relatório semanal exportado para Excel com sucesso!",
      });
    },
    onError: (error) => {
      console.error('Erro ao exportar relatório semanal:', error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar o relatório semanal.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsExporting(false);
    }
  });

  // Hook para exportar balanço mensal para PDF
  const exportMonthlyToPDF = useMutation({
    mutationFn: async ({ report, options }: { report: MonthlyBalanceReport; options?: ExportOptions }) => {
      setIsExporting(true);
      await exportService.exportMonthlyToPDF(report, options);
    },
    onSuccess: () => {
      toast({
        title: "Exportação concluída",
        description: "Balanço mensal exportado para PDF com sucesso!",
      });
    },
    onError: (error) => {
      console.error('Erro ao exportar balanço mensal para PDF:', error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar o balanço mensal para PDF.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsExporting(false);
    }
  });

  // Hook para exportar balanço mensal para Excel
  const exportMonthlyToExcel = useMutation({
    mutationFn: async ({ report, options }: { report: MonthlyBalanceReport; options?: ExportOptions }) => {
      setIsExporting(true);
      await exportService.exportMonthlyToExcel(report, options);
    },
    onSuccess: () => {
      toast({
        title: "Exportação concluída",
        description: "Balanço mensal exportado para Excel com sucesso!",
      });
    },
    onError: (error) => {
      console.error('Erro ao exportar balanço mensal:', error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar o balanço mensal.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsExporting(false);
    }
  });

  // Hook para exportar todos os relatórios consolidados
  const exportAllToExcel = useMutation({
    mutationFn: async ({ 
      dailyReport, 
      weeklyReport, 
      monthlyReport, 
      options 
    }: { 
      dailyReport: DailyCashReport; 
      weeklyReport: WeeklyServiceOrdersReport; 
      monthlyReport: MonthlyBalanceReport; 
      options?: ExportOptions 
    }) => {
      setIsExporting(true);
      await exportService.exportAllToExcel(dailyReport, weeklyReport, monthlyReport, options);
    },
    onSuccess: () => {
      toast({
        title: "Exportação concluída",
        description: "Todos os relatórios foram consolidados e exportados com sucesso!",
      });
    },
    onError: (error) => {
      console.error('Erro ao exportar relatórios consolidados:', error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os relatórios consolidados.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsExporting(false);
    }
  });

  // Funções de conveniência
  const exportDailyReport = (report: DailyCashReport, format: 'pdf' | 'excel' = 'pdf', options?: ExportOptions) => {
    if (format === 'pdf') {
      exportDailyToPDF.mutate({ report, options });
    } else {
      exportDailyToExcel.mutate({ report, options });
    }
  };

  const exportWeeklyReport = (report: WeeklyServiceOrdersReport, format: 'pdf' | 'excel' = 'excel', options?: ExportOptions) => {
    if (format === 'pdf') {
      exportWeeklyToPDF.mutate({ report, options });
    } else {
      exportWeeklyToExcel.mutate({ report, options });
    }
  };

  const exportMonthlyReport = (report: MonthlyBalanceReport, format: 'pdf' | 'excel' = 'excel', options?: ExportOptions) => {
    if (format === 'pdf') {
      exportMonthlyToPDF.mutate({ report, options });
    } else {
      exportMonthlyToExcel.mutate({ report, options });
    }
  };

  const exportAllReports = (
    dailyReport: DailyCashReport,
    weeklyReport: WeeklyServiceOrdersReport,
    monthlyReport: MonthlyBalanceReport,
    options?: ExportOptions
  ) => {
    exportAllToExcel.mutate({ dailyReport, weeklyReport, monthlyReport, options });
  };

  return {
    // Estados
    isExporting: isExporting || 
      exportDailyToPDF.isPending || 
      exportDailyToExcel.isPending || 
      exportWeeklyToPDF.isPending ||
      exportWeeklyToExcel.isPending || 
      exportMonthlyToPDF.isPending ||
      exportMonthlyToExcel.isPending || 
      exportAllToExcel.isPending,

    // Funções de exportação
    exportDailyReport,
    exportWeeklyReport,
    exportMonthlyReport,
    exportAllReports,

    // Mutações individuais (para uso avançado)
    exportDailyToPDF,
    exportDailyToExcel,
    exportWeeklyToPDF,
    exportWeeklyToExcel,
    exportMonthlyToPDF,
    exportMonthlyToExcel,
    exportAllToExcel,

    // Status das operações
    errors: {
      daily: exportDailyToPDF.error || exportDailyToExcel.error,
      weekly: exportWeeklyToPDF.error || exportWeeklyToExcel.error,
      monthly: exportMonthlyToPDF.error || exportMonthlyToExcel.error,
      all: exportAllToExcel.error
    }
  };
}; 