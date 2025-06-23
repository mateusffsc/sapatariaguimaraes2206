import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useBusinessMetrics } from '@/hooks/useAnalytics';
import { 
  Users, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Clock,
  AlertTriangle,
  Package,
  CreditCard,
  Loader2
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BusinessMetricsDashboardProps {
  className?: string;
}

export const BusinessMetricsDashboard: React.FC<BusinessMetricsDashboardProps> = ({
  className = ""
}) => {
  const { data: metricsData, isLoading, error } = useBusinessMetrics();

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-center h-20">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar métricas: {typeof error === 'string' ? error : 'Erro desconhecido'}
        </AlertDescription>
      </Alert>
    );
  }

  const metrics = metricsData?.data;

  if (!metrics) {
    return (
      <Alert className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Nenhuma métrica disponível
        </AlertDescription>
      </Alert>
    );
  }

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="h-4 w-4" />;
    if (growth < 0) return <TrendingDown className="h-4 w-4" />;
    return null;
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Receita Mensal */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.monthly_revenue)}
            </div>
            <div className={`flex items-center space-x-1 text-xs ${getGrowthColor(metrics.monthly_growth)}`}>
              {getGrowthIcon(metrics.monthly_growth)}
              <span>{formatPercentage(Math.abs(metrics.monthly_growth))} vs mês anterior</span>
            </div>
          </CardContent>
        </Card>

        {/* Total de Clientes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_customers}</div>
            <div className="text-xs text-muted-foreground">
              {metrics.active_customers} ativos este mês
            </div>
            <Progress 
              value={metrics.total_customers > 0 ? (metrics.active_customers / metrics.total_customers) * 100 : 0} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        {/* Ordens de Serviço */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ordens de Serviço</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_service_orders}</div>
            <div className="flex items-center justify-between text-xs mt-2">
              <span className="text-muted-foreground">
                {metrics.pending_service_orders} pendentes
              </span>
              {metrics.overdue_service_orders > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {metrics.overdue_service_orders} atrasadas
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Taxa de Conclusão */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercentage(metrics.completion_rate)}
            </div>
            <div className="text-xs text-muted-foreground">
              Tempo médio: {metrics.average_completion_time.toFixed(1)} dias
            </div>
            <Progress 
              value={metrics.completion_rate} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Métricas secundárias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Ticket Médio */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Ticket Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {formatCurrency(metrics.average_ticket)}
            </div>
            <div className="text-xs text-muted-foreground">
              Por ordem de serviço
            </div>
          </CardContent>
        </Card>

        {/* Contas a Receber */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center space-x-2">
              <CreditCard className="h-4 w-4" />
              <span>Contas a Receber</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {formatCurrency(metrics.total_receivables)}
            </div>
            <div className="text-xs text-muted-foreground">
              Crediário pendente
            </div>
          </CardContent>
        </Card>

        {/* Novos Clientes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Novos Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{metrics.new_customers_this_month}</div>
            <div className="text-xs text-muted-foreground">
              Neste mês
            </div>
            <div className="text-xs text-green-600 mt-1">
              Retenção: {formatPercentage(metrics.customer_retention_rate)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estoque */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Controle de Estoque</span>
          </CardTitle>
          <CardDescription>
            Status atual do inventário
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{metrics.total_products}</div>
              <div className="text-sm text-muted-foreground">Total de Produtos</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {metrics.low_stock_products}
              </div>
              <div className="text-sm text-muted-foreground">Estoque Baixo</div>
              {metrics.low_stock_products > 0 && (
                <Badge variant="outline" className="mt-1 text-yellow-600">
                  Atenção
                </Badge>
              )}
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {metrics.out_of_stock_products}
              </div>
              <div className="text-sm text-muted-foreground">Sem Estoque</div>
              {metrics.out_of_stock_products > 0 && (
                <Badge variant="destructive" className="mt-1">
                  Urgente
                </Badge>
              )}
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">
                {formatCurrency(metrics.inventory_value)}
              </div>
              <div className="text-sm text-muted-foreground">Valor do Estoque</div>
            </div>
          </div>

          {/* Alertas de estoque */}
          {(metrics.low_stock_products > 0 || metrics.out_of_stock_products > 0) && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Atenção no Estoque</h4>
                  <div className="text-sm text-yellow-700 mt-1">
                    {metrics.out_of_stock_products > 0 && (
                      <div>• {metrics.out_of_stock_products} produtos sem estoque</div>
                    )}
                    {metrics.low_stock_products > 0 && (
                      <div>• {metrics.low_stock_products} produtos com estoque baixo</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 