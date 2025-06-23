import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { WeeklyServiceOrdersReport } from '@/services/reportService';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Users,
  Wrench,
  TrendingUp
} from 'lucide-react';

interface WeeklyServiceOrdersReportCardProps {
  report: WeeklyServiceOrdersReport;
  className?: string;
}

export const WeeklyServiceOrdersReportCard: React.FC<WeeklyServiceOrdersReportCardProps> = ({
  report,
  className = ""
}) => {
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'cancelled': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getEfficiencyColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>Resumo Semanal de Ordens de Serviço</span>
        </CardTitle>
        <CardDescription>
          {formatDate(report.week_start)} - {formatDate(report.week_end)} • {report.total_orders} ordens
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Resumo Geral */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Total</div>
            <div className="text-xl font-bold">{report.total_orders}</div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Concluídas</div>
            <div className="text-xl font-bold text-green-600">
              {report.completed_orders}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Pendentes</div>
            <div className="text-xl font-bold text-yellow-600">
              {report.pending_orders}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Canceladas</div>
            <div className="text-xl font-bold text-red-600">
              {report.cancelled_orders}
            </div>
          </div>
        </div>

        {/* Taxa de Conclusão */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Taxa de Conclusão</span>
            <Badge variant="outline" className="text-green-600">
              {report.completion_rate.toFixed(1)}%
            </Badge>
          </div>
          <Progress value={report.completion_rate} className="h-2" />
        </div>

        <Separator />

        {/* Métricas de Performance */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 text-sm text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <span>Tempo Médio</span>
            </div>
            <div className="text-lg font-semibold">
              {report.average_completion_time.toFixed(1)} dias
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 text-sm text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span>Receita Total</span>
            </div>
            <div className="text-lg font-semibold text-green-600">
              {formatCurrency(report.total_revenue)}
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 text-sm text-muted-foreground mb-1">
              <FileText className="h-4 w-4" />
              <span>Ticket Médio</span>
            </div>
            <div className="text-lg font-semibold">
              {formatCurrency(report.average_order_value)}
            </div>
          </div>
        </div>

        <Separator />

        {/* Performance dos Técnicos */}
        <div>
          <h4 className="font-medium mb-3 flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Performance dos Técnicos</span>
          </h4>
          
          {report.technician_performance.length > 0 ? (
            <div className="space-y-3">
              {report.technician_performance.slice(0, 5).map((tech, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className="w-8 h-8 rounded-full p-0 flex items-center justify-center text-xs">
                      {index + 1}
                    </Badge>
                    <span className="font-medium">{tech.technician_name}</span>
                  </div>
                  
                  <div className="flex items-center space-x-3 text-sm">
                    <span className="text-muted-foreground">
                      {tech.orders_completed} ordens
                    </span>
                    <Badge 
                      variant="secondary" 
                      className={getEfficiencyColor(tech.efficiency_score)}
                    >
                      {tech.efficiency_score}% eficiência
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground text-sm">
              Nenhum técnico com ordens nesta semana
            </div>
          )}
        </div>

        <Separator />

        {/* Breakdown por Serviço */}
        <div>
          <h4 className="font-medium mb-3 flex items-center space-x-2">
            <Wrench className="h-4 w-4" />
            <span>Serviços Mais Demandados</span>
          </h4>
          
          {report.service_breakdown.length > 0 ? (
            <div className="space-y-2">
              {report.service_breakdown.slice(0, 5).map((service, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
                      {index + 1}
                    </Badge>
                    <span className="text-sm">{service.service_name}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-muted-foreground">{service.count}x</span>
                    <span className="font-medium">
                      {formatCurrency(service.revenue)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground text-sm">
              Nenhum serviço registrado esta semana
            </div>
          )}
        </div>

        {/* Insights */}
        {report.total_orders > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h5 className="font-medium text-blue-800 mb-2">💡 Insights da Semana</h5>
            <div className="text-sm text-blue-700 space-y-1">
              <div>
                • Média de {(report.total_orders / 7).toFixed(1)} ordens por dia
              </div>
              {report.completion_rate >= 80 && (
                <div>• Excelente taxa de conclusão ({report.completion_rate.toFixed(1)}%)</div>
              )}
              {report.completion_rate < 60 && (
                <div>• Taxa de conclusão abaixo do ideal - considere revisar processos</div>
              )}
              {report.average_completion_time > 5 && (
                <div>• Tempo médio de conclusão elevado - pode indicar sobrecarga</div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 