import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { 
  CalendarIcon,
  FileText, 
  Download,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  Clock,
  DollarSign
} from 'lucide-react';

import { useReportsDashboard } from '@/hooks/useReports';
import { useExport } from '@/hooks/useExport';
import { DailyCashReportCard } from '@/components/reports/DailyCashReportCard';
import { WeeklyServiceOrdersReportCard } from '@/components/reports/WeeklyServiceOrdersReportCard';
import { MonthlyBalanceReportCard } from '@/components/reports/MonthlyBalanceReportCard';
import { ExportModal, ExportConfig } from '@/components/modals/ExportModal';

export function RelatoriosPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState("overview");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const { dailyReport, weeklyReport, monthlyReport, isLoading, error, refetchAll } = useReportsDashboard(selectedDate);
  const { 
    exportDailyReport, 
    exportWeeklyReport, 
    exportMonthlyReport, 
    exportAllReports, 
    isExporting 
  } = useExport();

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setIsCalendarOpen(false);
    }
  };

  const handleRefresh = () => {
    refetchAll();
  };

  const formatDateForDisplay = (date: Date) => {
    return format(date, "d 'de' MMMM 'de' yyyy", { locale: pt });
  };

  const getQuickStats = () => {
    if (isLoading || error) return null;

    const dailyData = dailyReport.data?.data;
    const weeklyData = weeklyReport.data?.data;
    const monthlyData = monthlyReport.data?.data;

    return {
      dailyRevenue: dailyData?.total_receipts || 0,
      weeklyOrders: weeklyData?.total_orders || 0,
      monthlyProfit: monthlyData?.profit.net || 0,
      completionRate: weeklyData?.completion_rate || 0
    };
  };

  const quickStats = getQuickStats();

  // Disponibilizar relatórios para exportação
  const availableReports = [
    {
      id: 'daily',
      name: 'Relatório Diário de Caixa',
      description: 'Movimentação financeira diária completa',
      data: dailyReport.data?.data
    },
    {
      id: 'weekly',
      name: 'Resumo Semanal de Ordens',
      description: 'Performance semanal de ordens de serviço',
      data: weeklyReport.data?.data
    },
    {
      id: 'monthly', 
      name: 'Balanço Mensal',
      description: 'Balanço financeiro e KPIs mensais',
      data: monthlyReport.data?.data
    }
  ];

  const handleExport = (config: ExportConfig) => {
    const reports = config.reports;
    
    if (config.consolidate && reports.length > 1) {
      // Exportar todos consolidados
      if (dailyReport.data?.data && weeklyReport.data?.data && monthlyReport.data?.data) {
        exportAllReports(
          dailyReport.data.data,
          weeklyReport.data.data,
          monthlyReport.data.data,
          {
            filename: config.filename,
            format: config.format
          }
        );
      }
    } else {
      // Exportar individualmente
      reports.forEach(reportId => {
        switch (reportId) {
          case 'daily':
            if (dailyReport.data?.data) {
              exportDailyReport(dailyReport.data.data, config.format, {
                filename: config.filename
              });
            }
            break;
          case 'weekly':
            if (weeklyReport.data?.data) {
              exportWeeklyReport(weeklyReport.data.data, config.format, {
                filename: config.filename
              });
            }
            break;
          case 'monthly':
            if (monthlyReport.data?.data) {
              exportMonthlyReport(monthlyReport.data.data, config.format, {
                filename: config.filename
              });
            }
            break;
        }
      });
    }
    
    setExportModalOpen(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Relatórios Automáticos"
        subtitle="Visualize relatórios gerenciais automáticos do seu negócio"
      >
        <div className="flex items-center space-x-3">
          {/* Seletor de Data */}
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatDateForDisplay(selectedDate)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Botão de Atualizar */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </Button>

          {/* Botão de Exportar */}
          <Button
            variant="default"
            size="sm"
            onClick={() => setExportModalOpen(true)}
            className="flex items-center space-x-2"
            disabled={isLoading || isExporting}
          >
            <Download className="h-4 w-4" />
            <span>{isExporting ? 'Exportando...' : 'Exportar'}</span>
          </Button>
        </div>
      </PageHeader>

      {/* Resumo Rápido */}
      {quickStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <div className="text-sm text-muted-foreground">Receita Diária</div>
              </div>
              <div className="text-lg font-bold text-green-600">
                {quickStats.dailyRevenue.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <div className="text-sm text-muted-foreground">Ordens Semanais</div>
              </div>
              <div className="text-lg font-bold text-blue-600">
                {quickStats.weeklyOrders}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <div className="text-sm text-muted-foreground">Lucro Mensal</div>
              </div>
              <div className="text-lg font-bold text-purple-600">
                {quickStats.monthlyProfit.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <div className="text-sm text-muted-foreground">Taxa Conclusão</div>
              </div>
              <div className="text-lg font-bold text-orange-600">
                {quickStats.completionRate.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar relatórios: {error?.message || 'Erro desconhecido'}
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs de Relatórios */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="daily">Diário</TabsTrigger>
          <TabsTrigger value="weekly">Semanal</TabsTrigger>
          <TabsTrigger value="monthly">Mensal</TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Resumo dos Relatórios */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo Executivo</CardTitle>
                <CardDescription>
                  Principais indicadores para {formatDateForDisplay(selectedDate)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Status dos Relatórios</span>
                      <div className="flex space-x-1">
                        <Badge variant={dailyReport.data?.data ? 'default' : 'secondary'}>
                          Diário
                        </Badge>
                        <Badge variant={weeklyReport.data?.data ? 'default' : 'secondary'}>
                          Semanal
                        </Badge>
                        <Badge variant={monthlyReport.data?.data ? 'default' : 'secondary'}>
                          Mensal
                        </Badge>
                      </div>
                    </div>
                    
                    {quickStats && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Receita do dia</span>
                          <span className="font-medium">
                            {quickStats.dailyRevenue.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            })}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Ordens da semana</span>
                          <span className="font-medium">{quickStats.weeklyOrders}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Lucro do mês</span>
                          <span className={`font-medium ${
                            quickStats.monthlyProfit >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {quickStats.monthlyProfit.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            })}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ações Rápidas */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
                <CardDescription>
                  Gere e exporte relatórios específicos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => setExportModalOpen(true)}
                  disabled={isLoading || isExporting}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Exportar Relatórios Selecionados
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => {
                    if (dailyReport.data?.data && weeklyReport.data?.data && monthlyReport.data?.data) {
                      exportAllReports(
                        dailyReport.data.data,
                        weeklyReport.data.data,
                        monthlyReport.data.data
                      );
                    }
                  }}
                  disabled={isLoading || isExporting || !dailyReport.data?.data || !weeklyReport.data?.data || !monthlyReport.data?.data}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {isExporting ? 'Exportando...' : 'Exportar Todos Consolidados'}
                </Button>
                
                <Button variant="outline" className="w-full justify-start" disabled>
                  <Clock className="mr-2 h-4 w-4" />
                  Agendar Relatório Automático
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Relatório Diário */}
        <TabsContent value="daily">
          {isLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </CardContent>
            </Card>
          ) : dailyReport.data?.data ? (
            <DailyCashReportCard report={dailyReport.data.data} />
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhum dado disponível para o relatório diário
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Relatório Semanal */}
        <TabsContent value="weekly">
          {isLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </CardContent>
            </Card>
          ) : weeklyReport.data?.data ? (
            <WeeklyServiceOrdersReportCard report={weeklyReport.data.data} />
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhum dado disponível para o relatório semanal
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Relatório Mensal */}
        <TabsContent value="monthly">
          {isLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </CardContent>
            </Card>
          ) : monthlyReport.data?.data ? (
            <MonthlyBalanceReportCard report={monthlyReport.data.data} />
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhum dado disponível para o relatório mensal
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de Exportação */}
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        onExport={handleExport}
        isExporting={isExporting}
        availableReports={availableReports}
        selectedDate={selectedDate}
      />
    </div>
  );
} 