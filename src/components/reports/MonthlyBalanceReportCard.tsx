import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { MonthlyBalanceReport } from '@/services/reportService';
import { 
  Calendar,
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Users,
  Package,
  ShoppingCart,
  Star,
  AlertTriangle
} from 'lucide-react';

interface MonthlyBalanceReportCardProps {
  report: MonthlyBalanceReport;
  className?: string;
}

export const MonthlyBalanceReportCard: React.FC<MonthlyBalanceReportCardProps> = ({
  report,
  className = ""
}) => {
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getProfitColor = (value: number) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getProfitIcon = (value: number) => {
    return value >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />;
  };

  const getMarginQuality = (margin: number) => {
    if (margin >= 30) return { label: 'Excelente', color: 'text-green-600' };
    if (margin >= 20) return { label: 'Boa', color: 'text-blue-600' };
    if (margin >= 10) return { label: 'Regular', color: 'text-yellow-600' };
    if (margin >= 0) return { label: 'Baixa', color: 'text-orange-600' };
    return { label: 'Prejuízo', color: 'text-red-600' };
  };

  const marginQuality = getMarginQuality(report.profit.margin_percentage);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5" />
          <span>Balanço Mensal</span>
        </CardTitle>
        <CardDescription>
          {report.month} de {report.year}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Resumo Financeiro */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Receitas */}
          <div className="text-center bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-center space-x-1 text-green-600 mb-2">
              <TrendingUp className="h-5 w-5" />
              <span className="font-medium">Receitas</span>
            </div>
            <div className="text-2xl font-bold text-green-700">
              {formatCurrency(report.revenue.total)}
            </div>
            <div className="text-sm text-green-600 mt-2 space-y-1">
              <div>OS: {formatCurrency(report.revenue.service_orders)}</div>
              <div>Vendas: {formatCurrency(report.revenue.sales)}</div>
            </div>
          </div>

          {/* Despesas */}
          <div className="text-center bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-center space-x-1 text-red-600 mb-2">
              <TrendingDown className="h-5 w-5" />
              <span className="font-medium">Despesas</span>
            </div>
            <div className="text-2xl font-bold text-red-700">
              {formatCurrency(report.expenses.total)}
            </div>
            <div className="text-sm text-red-600 mt-2 space-y-1">
              <div>Compras: {formatCurrency(report.expenses.purchases)}</div>
              <div>Operacional: {formatCurrency(report.expenses.operational)}</div>
            </div>
          </div>

          {/* Lucro Líquido */}
          <div className={`text-center border rounded-lg p-4 ${
            report.profit.net >= 0 
              ? 'bg-blue-50 border-blue-200' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className={`flex items-center justify-center space-x-1 mb-2 ${getProfitColor(report.profit.net)}`}>
              {getProfitIcon(report.profit.net)}
              <span className="font-medium">Lucro Líquido</span>
            </div>
            <div className={`text-2xl font-bold ${getProfitColor(report.profit.net)}`}>
              {formatCurrency(report.profit.net)}
            </div>
            <div className="mt-2">
              <Badge 
                variant="outline" 
                className={marginQuality.color}
              >
                {formatPercentage(report.profit.margin_percentage)} - {marginQuality.label}
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* Indicadores de Clientes */}
        <div>
          <h4 className="font-medium mb-3 flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Indicadores de Clientes</span>
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Total</div>
              <div className="text-xl font-bold">{report.customers.total}</div>
            </div>
            
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Novos</div>
              <div className="text-xl font-bold text-blue-600">
                {report.customers.new}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Retornaram</div>
              <div className="text-xl font-bold text-green-600">
                {report.customers.returning}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Retenção</div>
              <div className="text-xl font-bold">
                {formatPercentage(report.customers.retention_rate)}
              </div>
            </div>
          </div>

          {/* Barra de Retenção */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Taxa de Retenção</span>
              <Badge 
                variant={report.customers.retention_rate >= 70 ? 'default' : 'secondary'}
                className={report.customers.retention_rate >= 70 ? 'bg-green-600' : 'bg-yellow-600'}
              >
                {formatPercentage(report.customers.retention_rate)}
              </Badge>
            </div>
            <Progress value={report.customers.retention_rate} className="h-2" />
          </div>
        </div>

        <Separator />

        {/* Controle de Estoque */}
        <div>
          <h4 className="font-medium mb-3 flex items-center space-x-2">
            <Package className="h-4 w-4" />
            <span>Controle de Estoque</span>
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Valor Total</div>
              <div className="text-lg font-semibold">
                {formatCurrency(report.inventory.value)}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Giro do Estoque</div>
              <div className="text-lg font-semibold">
                {report.inventory.turnover.toFixed(1)}x
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Estoque Baixo</div>
              <div className={`text-lg font-semibold ${
                report.inventory.low_stock_items > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {report.inventory.low_stock_items} itens
              </div>
            </div>
          </div>

          {report.inventory.low_stock_items > 0 && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                Atenção: {report.inventory.low_stock_items} produtos com estoque baixo
              </span>
            </div>
          )}
        </div>

        <Separator />

        {/* KPIs Principais */}
        <div>
          <h4 className="font-medium mb-3 flex items-center space-x-2">
            <Star className="h-4 w-4" />
            <span>KPIs Principais</span>
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-center space-x-1 text-blue-600 mb-1">
                <ShoppingCart className="h-4 w-4" />
                <span className="text-sm font-medium">Ticket Médio</span>
              </div>
              <div className="text-lg font-bold text-blue-700">
                {formatCurrency(report.kpis.average_ticket)}
              </div>
            </div>
            
            <div className="text-center bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-center space-x-1 text-green-600 mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">OS por Dia</span>
              </div>
              <div className="text-lg font-bold text-green-700">
                {report.kpis.orders_per_day.toFixed(1)}
              </div>
            </div>
            
            <div className="text-center bg-purple-50 border border-purple-200 rounded-lg p-3">
              <div className="flex items-center justify-center space-x-1 text-purple-600 mb-1">
                <Star className="h-4 w-4" />
                <span className="text-sm font-medium">Satisfação</span>
              </div>
              <div className="text-lg font-bold text-purple-700">
                {formatPercentage(report.kpis.customer_satisfaction)}
              </div>
            </div>
          </div>
        </div>

        {/* Insights do Mês */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h5 className="font-medium text-gray-800 mb-2">📊 Resumo do Mês</h5>
          <div className="text-sm text-gray-700 space-y-1">
            <div>
              • {report.customers.new > 0 ? `${report.customers.new} novos clientes adquiridos` : 'Nenhum cliente novo este mês'}
            </div>
            <div>
              • Margem de lucro {marginQuality.label.toLowerCase()} ({formatPercentage(report.profit.margin_percentage)})
            </div>
            {report.customers.retention_rate >= 70 ? (
              <div>• Boa retenção de clientes ({formatPercentage(report.customers.retention_rate)})</div>
            ) : (
              <div>• Retenção de clientes pode melhorar ({formatPercentage(report.customers.retention_rate)})</div>
            )}
            {report.inventory.low_stock_items > 0 && (
              <div>• Atenção aos produtos com estoque baixo</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 