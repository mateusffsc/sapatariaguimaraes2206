import React, { useState } from 'react';
import { 
  Line, 
  LineChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  Area,
  AreaChart,
  ComposedChart,
  Bar
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePeriodAnalysis } from '@/hooks/useAnalytics';
import { Loader2, TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PeriodTrendsChartProps {
  className?: string;
}

export const PeriodTrendsChart: React.FC<PeriodTrendsChartProps> = ({
  className = ""
}) => {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [months, setMonths] = useState(12);
  const [chartType, setChartType] = useState<'line' | 'area' | 'composed'>('line');

  const { data: periodData, isLoading, error } = usePeriodAnalysis(period, months);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Tendências por Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Tendências por Período</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Erro ao carregar dados de tendências: {typeof error === 'string' ? error : 'Erro desconhecido'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const trends = periodData?.data || [];

  const chartData = trends.map((trend) => ({
    period: trend.period,
    'Total de Ordens': trend.total_orders,
    'Ordens Concluídas': trend.completed_orders,
    'Taxa de Conclusão': trend.completion_rate,
    'Receita (R$)': trend.total_revenue / 1000, // Em milhares
    'Tempo Médio (dias)': trend.average_completion_time
  }));

  // Estatísticas resumidas
  const totalOrders = trends.reduce((sum, t) => sum + t.total_orders, 0);
  const totalRevenue = trends.reduce((sum, t) => sum + t.total_revenue, 0);
  const avgCompletionRate = trends.length > 0 
    ? trends.reduce((sum, t) => sum + t.completion_rate, 0) / trends.length 
    : 0;
  const avgCompletionTime = trends.length > 0 
    ? trends.reduce((sum, t) => sum + t.average_completion_time, 0) / trends.length 
    : 0;

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    };

    switch (chartType) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="period" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="Total de Ordens" 
              stackId="1" 
              stroke="#3B82F6" 
              fill="#3B82F6" 
              fillOpacity={0.6}
            />
            <Area 
              type="monotone" 
              dataKey="Ordens Concluídas" 
              stackId="1" 
              stroke="#10B981" 
              fill="#10B981" 
              fillOpacity={0.6}
            />
          </AreaChart>
        );

      case 'composed':
        return (
          <ComposedChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="period" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              yAxisId="left"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip />
            <Legend />
            <Bar 
              yAxisId="left"
              dataKey="Total de Ordens" 
              fill="#3B82F6" 
              name="Total de Ordens"
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="Taxa de Conclusão" 
              stroke="#10B981" 
              strokeWidth={3}
              name="Taxa de Conclusão (%)"
            />
          </ComposedChart>
        );

      default:
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="period" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="Total de Ordens" 
              stroke="#3B82F6" 
              strokeWidth={3}
              dot={{ r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="Ordens Concluídas" 
              stroke="#10B981" 
              strokeWidth={3}
              dot={{ r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="Taxa de Conclusão" 
              stroke="#F59E0B" 
              strokeWidth={3}
              dot={{ r: 4 }}
            />
          </LineChart>
        );
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Ordens</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              Últimos {months} meses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {totalRevenue.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">
              Últimos {months} meses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa Média</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgCompletionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Conclusão
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgCompletionTime.toFixed(1)} dias</div>
            <p className="text-xs text-muted-foreground">
              Para conclusão
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico principal */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp size={20} />
                <span>Tendências por Período</span>
              </CardTitle>
              <CardDescription>
                Análise de performance ao longo do tempo
              </CardDescription>
            </div>
            
            <div className="flex items-center space-x-2">
              <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="daily">Diário</SelectItem>
                </SelectContent>
              </Select>

              <Select value={months.toString()} onValueChange={(value) => setMonths(parseInt(value))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6m</SelectItem>
                  <SelectItem value="12">12m</SelectItem>
                  <SelectItem value="24">24m</SelectItem>
                </SelectContent>
              </Select>

              <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Linha</SelectItem>
                  <SelectItem value="area">Área</SelectItem>
                  <SelectItem value="composed">Misto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Nenhum dado disponível para o período selecionado
            </div>
          ) : (
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                {renderChart()}
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 