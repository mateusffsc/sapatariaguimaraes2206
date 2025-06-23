import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BusinessMetricsDashboard } from '@/components/analytics/BusinessMetricsDashboard';
import { TechnicianPerformanceChart } from '@/components/analytics/TechnicianPerformanceChart';
import { PeriodTrendsChart } from '@/components/analytics/PeriodTrendsChart';
import { useDashboardAnalytics } from '@/hooks/useAnalytics';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar as CalendarIcon,
  RefreshCw,
  Download,
  Settings
} from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { pt } from 'date-fns/locale';

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });

  const [activeTab, setActiveTab] = useState('overview');
  
  const { 
    businessMetrics, 
    technicianPerformance, 
    periodAnalysis, 
    isLoading, 
    error, 
    refetchAll 
  } = useDashboardAnalytics();

  const formatDateRange = () => {
    return `${format(dateRange.from, 'dd/MM/yyyy', { locale: pt })} - ${format(dateRange.to, 'dd/MM/yyyy', { locale: pt })}`;
  };

  const handleExportData = () => {
    // Funcionalidade de exportação - implementar posteriormente
    console.log('Exportando dados de analytics...');
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/' },
    { label: 'Analytics', href: '/analytics' }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics Avançadas"
        subtitle="Métricas detalhadas e análises de performance do negócio"
      >
        <div className="flex items-center space-x-2">
          {/* Seletor de período */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatDateRange()}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="p-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Período</label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDateRange({
                          from: startOfMonth(new Date()),
                          to: endOfMonth(new Date())
                        })}
                      >
                        Este Mês
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const lastMonth = new Date();
                          lastMonth.setMonth(lastMonth.getMonth() - 1);
                          setDateRange({
                            from: startOfMonth(lastMonth),
                            to: endOfMonth(lastMonth)
                          });
                        }}
                      >
                        Mês Anterior
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Botão de atualizar */}
          <Button
            variant="outline"
            size="sm"
            onClick={refetchAll}
            disabled={isLoading}
          >
            {isLoading ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Atualizar
          </Button>

          {/* Botão de exportar */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportData}
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </PageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Visão Geral</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Performance</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Tendências</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Relatórios</span>
          </TabsTrigger>
        </TabsList>

        {/* Aba de Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          <BusinessMetricsDashboard />
          
          {/* Resumo rápido dos outros módulos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Top Técnicos</span>
                </CardTitle>
                <CardDescription>
                  Melhores performances do período
                </CardDescription>
              </CardHeader>
              <CardContent>
                {technicianPerformance.isLoading ? (
                  <div className="text-center py-8 text-gray-500">
                    Carregando...
                  </div>
                ) : technicianPerformance.data?.data?.length ? (
                  <div className="space-y-3">
                    {technicianPerformance.data.data.slice(0, 3).map((tech, index) => (
                      <div key={tech.technician_id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{tech.technician_name}</div>
                            <div className="text-sm text-gray-500">
                              {tech.total_orders} ordens
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{tech.efficiency_score}</div>
                          <div className="text-sm text-gray-500">Score</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum dado disponível
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Tendência do Mês</span>
                </CardTitle>
                <CardDescription>
                  Performance recente
                </CardDescription>
              </CardHeader>
              <CardContent>
                {periodAnalysis.isLoading ? (
                  <div className="text-center py-8 text-gray-500">
                    Carregando...
                  </div>
                ) : periodAnalysis.data?.data?.length ? (
                  <div className="space-y-3">
                    {periodAnalysis.data.data.slice(-3).map((period) => (
                      <div key={period.period} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{period.period}</div>
                          <div className="text-sm text-gray-500">
                            {period.total_orders} ordens
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            R$ {period.total_revenue.toLocaleString('pt-BR')}
                          </div>
                          <div className="text-sm text-gray-500">
                            {period.completion_rate.toFixed(1)}% conclusão
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum dado disponível
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Aba de Performance dos Técnicos */}
        <TabsContent value="performance" className="space-y-6">
          <TechnicianPerformanceChart 
            startDate={format(dateRange.from, 'yyyy-MM-dd')}
            endDate={format(dateRange.to, 'yyyy-MM-dd')}
          />
        </TabsContent>

        {/* Aba de Tendências */}
        <TabsContent value="trends" className="space-y-6">
          <PeriodTrendsChart />
        </TabsContent>

        {/* Aba de Relatórios */}
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios Personalizados</CardTitle>
              <CardDescription>
                Configure e gere relatórios detalhados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <Settings className="mx-auto h-12 w-12 mb-4" />
                <h3 className="text-lg font-medium mb-2">Em Desenvolvimento</h3>
                <p>Relatórios personalizados estarão disponíveis em breve.</p>
                <p className="text-sm mt-2">
                  Funcionalidades planejadas: PDF, Excel, agendamento automático
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 