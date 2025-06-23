import React, { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  ArrowRightLeft, 
  CalendarDays, 
  Filter,
  BarChart3,
  PieChart,
  Download,
  Eye
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, subYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { useMovimentacoes, useResumoFinanceiro } from '../hooks/useFinanceiro';
import { NovaMovimentacaoModal } from '../components/modals/NovaMovimentacaoModal';
import { RelatorioMensal } from '../components/financeiro/RelatorioMensal';
import { RelatorioAnual } from '../components/financeiro/RelatorioAnual';
import { FluxoCaixaDetalhado } from '../components/financeiro/FluxoCaixaDetalhado';
import { GraficoReceitaDespesa } from '../components/financeiro/GraficoReceitaDespesa';
import { ContasPagarSection } from '../components/financeiro/ContasPagarSection';

export function FinanceiroPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [selectedPeriod, setSelectedPeriod] = useState('mes-atual');

  // Formatar dates para API
  const dataInicio = dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : '';
  const dataFim = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : '';

  const { data: movimentacoes, isLoading: loadingMovimentacoes } = useMovimentacoes(dataInicio, dataFim);
  const { data: resumo, isLoading: loadingResumo } = useResumoFinanceiro(dataInicio, dataFim);

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const handlePeriodChange = (periodo: string) => {
    setSelectedPeriod(periodo);
    const hoje = new Date();
    
    switch (periodo) {
      case 'mes-atual':
        setDateRange({
          from: startOfMonth(hoje),
          to: endOfMonth(hoje)
        });
        break;
      case 'mes-anterior':
        const mesAnterior = subMonths(hoje, 1);
        setDateRange({
          from: startOfMonth(mesAnterior),
          to: endOfMonth(mesAnterior)
        });
        break;
      case 'ano-atual':
        setDateRange({
          from: startOfYear(hoje),
          to: endOfYear(hoje)
        });
        break;
      case 'ano-anterior':
        const anoAnterior = subYears(hoje, 1);
        setDateRange({
          from: startOfYear(anoAnterior),
          to: endOfYear(anoAnterior)
        });
        break;
    }
  };

  const isLoading = loadingMovimentacoes || loadingResumo;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financeiro"
        subtitle="Relatórios e análises financeiras"
        action={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Movimentação
          </Button>
        }
      />

      {/* Filtros de Período */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Período de Análise</CardTitle>
          <CardDescription>
            Selecione o período para visualizar os relatórios financeiros
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecionar período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mes-atual">Mês Atual</SelectItem>
                <SelectItem value="mes-anterior">Mês Anterior</SelectItem>
                <SelectItem value="ano-atual">Ano Atual</SelectItem>
                <SelectItem value="ano-anterior">Ano Anterior</SelectItem>
                <SelectItem value="personalizado">Período Personalizado</SelectItem>
              </SelectContent>
            </Select>

            {selectedPeriod === 'personalizado' && (
              <div className="flex gap-2 items-center">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !dateRange.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                            {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                          </>
                        ) : (
                          format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                        )
                      ) : (
                        <span>Selecionar período</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange.from}
                      selected={{
                        from: dateRange.from,
                        to: dateRange.to,
                      }}
                      onSelect={(range) => setDateRange({
                        from: range?.from,
                        to: range?.to,
                      })}
                      numberOfMonths={2}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            <div className="text-sm text-muted-foreground">
              Período: {dateRange.from && format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
              {dateRange.to && format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Receitas</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatarMoeda(resumo?.totalEntradas || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {movimentacoes?.filter(m => m.tipo === 'entrada').length || 0} movimentações
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Despesas</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatarMoeda(resumo?.totalSaidas || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {movimentacoes?.filter(m => m.tipo === 'saida').length || 0} movimentações
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldo Período</CardTitle>
                <ArrowRightLeft className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  (resumo?.saldoPeriodo || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatarMoeda(resumo?.saldoPeriodo || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Receitas - Despesas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Movimentações</CardTitle>
                <BarChart3 className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {movimentacoes?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total no período
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Abas dos Relatórios */}
          <Tabs defaultValue="grafico" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="grafico" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Gráficos
              </TabsTrigger>
              <TabsTrigger value="mensal" className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Mensal
              </TabsTrigger>
              <TabsTrigger value="anual" className="flex items-center gap-2">
                <PieChart className="h-4 w-4" />
                Anual
              </TabsTrigger>
              <TabsTrigger value="fluxo" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Fluxo de Caixa
              </TabsTrigger>
              <TabsTrigger value="contas-pagar" className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Contas a Pagar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="grafico" className="space-y-4">
              <GraficoReceitaDespesa 
                dataInicio={dataInicio} 
                dataFim={dataFim} 
                movimentacoes={movimentacoes || []}
              />
            </TabsContent>

            <TabsContent value="mensal" className="space-y-4">
              <RelatorioMensal 
                dataInicio={dataInicio} 
                dataFim={dataFim}
                resumo={resumo}
                movimentacoes={movimentacoes || []}
              />
            </TabsContent>

            <TabsContent value="anual" className="space-y-4">
              <RelatorioAnual 
                ano={dateRange.from ? dateRange.from.getFullYear() : new Date().getFullYear()}
              />
            </TabsContent>

            <TabsContent value="fluxo" className="space-y-4">
              <FluxoCaixaDetalhado 
                dataInicio={dataInicio} 
                dataFim={dataFim}
                movimentacoes={movimentacoes || []}
              />
            </TabsContent>

            <TabsContent value="contas-pagar" className="space-y-4">
              <ContasPagarSection />
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Modal */}
      <NovaMovimentacaoModal
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
} 