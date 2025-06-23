import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DailyCashReport } from '@/services/reportService';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  Banknote,
  Receipt,
  PieChart
} from 'lucide-react';

interface DailyCashReportCardProps {
  report: DailyCashReport;
  className?: string;
}

export const DailyCashReportCard: React.FC<DailyCashReportCardProps> = ({
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
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getBalanceColor = () => {
    if (report.closing_balance > report.opening_balance) return 'text-green-600';
    if (report.closing_balance < report.opening_balance) return 'text-red-600';
    return 'text-gray-600';
  };

  const getBalanceIcon = () => {
    if (report.closing_balance > report.opening_balance) return <TrendingUp className="h-4 w-4" />;
    if (report.closing_balance < report.opening_balance) return <TrendingDown className="h-4 w-4" />;
    return <DollarSign className="h-4 w-4" />;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Receipt className="h-5 w-5" />
          <span>Relatório Diário de Caixa</span>
        </CardTitle>
        <CardDescription>
          {formatDate(report.date)} • {report.transactions_count} transações
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Resumo do Caixa */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Saldo Inicial</div>
            <div className="text-lg font-semibold">
              {formatCurrency(report.opening_balance)}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Receitas</div>
            <div className="text-lg font-semibold text-green-600">
              {formatCurrency(report.total_receipts)}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Despesas</div>
            <div className="text-lg font-semibold text-red-600">
              {formatCurrency(report.total_expenses)}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Saldo Final</div>
            <div className={`text-lg font-semibold flex items-center justify-center space-x-1 ${getBalanceColor()}`}>
              {getBalanceIcon()}
              <span>{formatCurrency(report.closing_balance)}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Breakdown de Receitas */}
        <div>
          <h4 className="font-medium mb-3 flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Receitas por Origem</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Ordens de Serviço</span>
              <Badge variant="outline" className="text-green-600">
                {formatCurrency(report.service_orders_revenue)}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Vendas</span>
              <Badge variant="outline" className="text-blue-600">
                {formatCurrency(report.sales_revenue)}
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* Formas de Pagamento */}
        <div>
          <h4 className="font-medium mb-3 flex items-center space-x-2">
            <CreditCard className="h-4 w-4" />
            <span>Formas de Pagamento</span>
          </h4>
          <div className="space-y-3">
            {report.summary.payment_methods_breakdown.map((payment, index) => (
              <div key={index} className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  {payment.method === 'cash' && <Banknote className="h-4 w-4" />}
                  {payment.method === 'card' && <CreditCard className="h-4 w-4" />}
                  {payment.method === 'credit' && <Receipt className="h-4 w-4" />}
                  <span className="text-sm capitalize">
                    {payment.method === 'cash' ? 'Dinheiro' : 
                     payment.method === 'card' ? 'Cartão' :
                     payment.method === 'credit' ? 'Crediário' : payment.method}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">
                    {payment.percentage.toFixed(1)}%
                  </Badge>
                  <span className="font-medium">
                    {formatCurrency(payment.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Top Serviços */}
        <div>
          <h4 className="font-medium mb-3 flex items-center space-x-2">
            <PieChart className="h-4 w-4" />
            <span>Top Serviços do Dia</span>
          </h4>
          <div className="space-y-2">
            {report.summary.top_services.length > 0 ? (
              report.summary.top_services.map((service, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
                      {index + 1}
                    </Badge>
                    <span className="text-sm">{service.name}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-muted-foreground">{service.count}x</span>
                    <span className="font-medium">
                      {formatCurrency(service.revenue)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground text-sm">
                Nenhum serviço registrado hoje
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 