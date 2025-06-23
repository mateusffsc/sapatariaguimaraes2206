import React from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTechnicianPerformance } from '@/hooks/useAnalytics';
import { Loader2, TrendingUp, Clock, DollarSign, Target } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TechnicianPerformanceChartProps {
  startDate?: string;
  endDate?: string;
  className?: string;
}

export const TechnicianPerformanceChart: React.FC<TechnicianPerformanceChartProps> = ({
  startDate,
  endDate,
  className = ""
}) => {
  const { data: performanceData, isLoading, error } = useTechnicianPerformance(startDate, endDate);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Performance dos Técnicos</CardTitle>
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
          <CardTitle>Performance dos Técnicos</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Erro ao carregar dados de performance: {error.message}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const performance = performanceData?.data || [];

  const getEfficiencyColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    if (score >= 40) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const chartData = performance.map(tech => ({
    name: tech.technician_name.split(' ')[0], // Apenas primeiro nome
    'Taxa de Conclusão': tech.completion_rate,
    'Score de Eficiência': tech.efficiency_score,
    'Receita (R$)': tech.total_revenue / 1000, // Em milhares
    fullName: tech.technician_name,
    totalOrders: tech.total_orders,
    averageTime: tech.average_completion_time
  }));

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {performance.slice(0, 4).map((tech, index) => (
          <Card key={tech.technician_id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {tech.technician_name}
              </CardTitle>
              <Badge className={getEfficiencyColor(tech.efficiency_score)}>
                #{index + 1}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tech.efficiency_score}
              </div>
              <p className="text-xs text-muted-foreground">
                Score de Eficiência
              </p>
              <div className="flex items-center space-x-4 mt-2 text-xs">
                <div className="flex items-center space-x-1">
                  <Target size={12} />
                  <span>{tech.completion_rate.toFixed(1)}%</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock size={12} />
                  <span>{tech.average_completion_time.toFixed(1)}d</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráfico principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp size={20} />
            <span>Performance dos Técnicos</span>
          </CardTitle>
          <CardDescription>
            Comparação de eficiência, taxa de conclusão e receita gerada
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Nenhum dado disponível para o período selecionado
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border rounded-lg shadow-lg">
                            <p className="font-medium">{data.fullName}</p>
                            <div className="space-y-1 text-sm">
                              <p className="text-blue-600">
                                Taxa de Conclusão: {data['Taxa de Conclusão'].toFixed(1)}%
                              </p>
                              <p className="text-green-600">
                                Score de Eficiência: {data['Score de Eficiência']}
                              </p>
                              <p className="text-purple-600">
                                Receita: R$ {(data['Receita (R$)'] * 1000).toLocaleString('pt-BR')}
                              </p>
                              <p className="text-gray-600">
                                Total de Ordens: {data.totalOrders}
                              </p>
                              <p className="text-gray-600">
                                Tempo Médio: {data.averageTime.toFixed(1)} dias
                              </p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="Taxa de Conclusão" 
                    fill="#3B82F6" 
                    name="Taxa de Conclusão (%)"
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar 
                    dataKey="Score de Eficiência" 
                    fill="#10B981" 
                    name="Score de Eficiência"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabela detalhada */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhes da Performance</CardTitle>
          <CardDescription>
            Métricas detalhadas por técnico
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3">Técnico</th>
                  <th className="text-center py-3">Total OS</th>
                  <th className="text-center py-3">Concluídas</th>
                  <th className="text-center py-3">Taxa (%)</th>
                  <th className="text-center py-3">Tempo Médio</th>
                  <th className="text-center py-3">Receita</th>
                  <th className="text-center py-3">Eficiência</th>
                </tr>
              </thead>
              <tbody>
                {performance.map((tech) => (
                  <tr key={tech.technician_id} className="border-b hover:bg-gray-50">
                    <td className="py-3 font-medium">{tech.technician_name}</td>
                    <td className="text-center py-3">{tech.total_orders}</td>
                    <td className="text-center py-3">{tech.completed_orders}</td>
                    <td className="text-center py-3">
                      <Badge variant="outline">
                        {tech.completion_rate.toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="text-center py-3">
                      {tech.average_completion_time.toFixed(1)} dias
                    </td>
                    <td className="text-center py-3">
                      R$ {tech.total_revenue.toLocaleString('pt-BR')}
                    </td>
                    <td className="text-center py-3">
                      <Badge className={getEfficiencyColor(tech.efficiency_score)}>
                        {tech.efficiency_score}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 