import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowRightLeft, 
  Calendar, 
  DollarSign,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, getDaysInMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { MovimentacaoFinanceira } from '../../lib/supabase';

interface RelatorioMensalProps {
  dataInicio: string;
  dataFim: string;
  resumo?: {
    totalEntradas: number;
    totalSaidas: number;
    saldoPeriodo: number;
    movimentacoes: MovimentacaoFinanceira[];
  };
  movimentacoes: MovimentacaoFinanceira[];
}

export function RelatorioMensal({ dataInicio, dataFim, resumo, movimentacoes }: RelatorioMensalProps) {
  const analiseDetalhada = useMemo(() => {
    if (!movimentacoes.length) return null;

    const receitas = movimentacoes.filter(mov => mov.tipo === 'entrada');
    const despesas = movimentacoes.filter(mov => mov.tipo === 'saida');

    // Análise por categorias
    const categoriasReceitas = receitas.reduce((acc, mov) => {
      const categoria = mov.categoria || 'Sem categoria';
      acc[categoria] = (acc[categoria] || 0) + mov.valor;
      return acc;
    }, {} as Record<string, number>);

    const categoriasDespesas = despesas.reduce((acc, mov) => {
      const categoria = mov.categoria || 'Sem categoria';
      acc[categoria] = (acc[categoria] || 0) + mov.valor;
      return acc;
    }, {} as Record<string, number>);

    // Análise por forma de pagamento
    const formasPagamento = movimentacoes.reduce((acc, mov) => {
      const forma = mov.forma_pagamento || 'Não especificado';
      if (!acc[forma]) {
        acc[forma] = { receitas: 0, despesas: 0, total: 0 };
      }
      if (mov.tipo === 'entrada') {
        acc[forma].receitas += mov.valor;
      } else {
        acc[forma].despesas += mov.valor;
      }
      acc[forma].total += mov.valor;
      return acc;
    }, {} as Record<string, { receitas: number; despesas: number; total: number }>);

    // Estatísticas
    const totalReceitas = receitas.reduce((sum, mov) => sum + mov.valor, 0);
    const totalDespesas = despesas.reduce((sum, mov) => sum + mov.valor, 0);
    const ticketMedioReceita = receitas.length > 0 ? totalReceitas / receitas.length : 0;
    const ticketMedioDespesa = despesas.length > 0 ? totalDespesas / despesas.length : 0;

    // Maior receita e despesa
    const maiorReceita = receitas.reduce((max, mov) => mov.valor > max.valor ? mov : max, receitas[0] || { valor: 0 });
    const maiorDespesa = despesas.reduce((max, mov) => mov.valor > max.valor ? mov : max, despesas[0] || { valor: 0 });

    return {
      categoriasReceitas,
      categoriasDespesas,
      formasPagamento,
      estatisticas: {
        totalReceitas,
        totalDespesas,
        ticketMedioReceita,
        ticketMedioDespesa,
        maiorReceita,
        maiorDespesa,
        totalMovimentacoes: movimentacoes.length,
        diasComMovimentacao: new Set(movimentacoes.map(mov => 
          format(parseISO(mov.data_pagamento || mov.created_at), 'yyyy-MM-dd')
        )).size
      }
    };
  }, [movimentacoes]);

  const metasSimuladas = useMemo(() => {
    // Simulação de metas (em um sistema real, viria do banco de dados)
    const metaReceita = 15000; // Meta de R$ 15.000 em receitas
    const metaDespesa = 8000;  // Meta de max R$ 8.000 em despesas
    
    const receitaAlcancada = resumo?.totalEntradas || 0;
    const despesaRealizada = resumo?.totalSaidas || 0;
    
    return {
      receita: {
        meta: metaReceita,
        alcancado: receitaAlcancada,
        percentual: (receitaAlcancada / metaReceita) * 100,
        status: receitaAlcancada >= metaReceita ? 'alcancada' : 
                receitaAlcancada >= metaReceita * 0.8 ? 'proximo' : 'distante'
      },
      despesa: {
        meta: metaDespesa,
        realizado: despesaRealizada,
        percentual: (despesaRealizada / metaDespesa) * 100,
        status: despesaRealizada <= metaDespesa ? 'dentro' : 
                despesaRealizada <= metaDespesa * 1.2 ? 'atencao' : 'excedido'
      }
    };
  }, [resumo]);

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarPercentual = (valor: number) => {
    return `${valor.toFixed(1)}%`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'alcancada':
      case 'dentro':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'proximo':
      case 'atencao':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'distante':
      case 'excedido':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'alcancada':
      case 'dentro':
        return 'bg-green-100 text-green-800';
      case 'proximo':
      case 'atencao':
        return 'bg-yellow-100 text-yellow-800';
      case 'distante':
      case 'excedido':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!analiseDetalhada) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Relatório Mensal</CardTitle>
          <CardDescription>Análise detalhada do período selecionado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>Nenhuma movimentação encontrada para análise</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo Executivo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Resumo Executivo - {format(parseISO(dataInicio), 'MMMM yyyy', { locale: ptBR })}
          </CardTitle>
          <CardDescription>
            Período: {format(parseISO(dataInicio), 'dd/MM/yyyy', { locale: ptBR })} a {format(parseISO(dataFim), 'dd/MM/yyyy', { locale: ptBR })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">
                {formatarMoeda(analiseDetalhada.estatisticas.totalReceitas)}
              </p>
              <p className="text-sm text-gray-600">Total Receitas</p>
              <p className="text-xs text-gray-500 mt-1">
                Ticket médio: {formatarMoeda(analiseDetalhada.estatisticas.ticketMedioReceita)}
              </p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <TrendingDown className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-red-600">
                {formatarMoeda(analiseDetalhada.estatisticas.totalDespesas)}
              </p>
              <p className="text-sm text-gray-600">Total Despesas</p>
              <p className="text-xs text-gray-500 mt-1">
                Ticket médio: {formatarMoeda(analiseDetalhada.estatisticas.ticketMedioDespesa)}
              </p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <ArrowRightLeft className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className={`text-2xl font-bold ${
                (resumo?.saldoPeriodo || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatarMoeda(resumo?.saldoPeriodo || 0)}
              </p>
              <p className="text-sm text-gray-600">Saldo Líquido</p>
              <p className="text-xs text-gray-500 mt-1">
                Receitas - Despesas
              </p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <DollarSign className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">
                {analiseDetalhada.estatisticas.totalMovimentacoes}
              </p>
              <p className="text-sm text-gray-600">Movimentações</p>
              <p className="text-xs text-gray-500 mt-1">
                {analiseDetalhada.estatisticas.diasComMovimentacao} dias ativos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metas e Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Metas de Receita
            </CardTitle>
            <CardDescription>Acompanhamento das metas mensais</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(metasSimuladas.receita.status)}
                <span className="font-medium">Meta de Receita</span>
              </div>
              <Badge className={getStatusColor(metasSimuladas.receita.status)}>
                {metasSimuladas.receita.status === 'alcancada' ? 'Alcançada' :
                 metasSimuladas.receita.status === 'proximo' ? 'Próximo' : 'Distante'}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso</span>
                <span>{formatarPercentual(metasSimuladas.receita.percentual)}</span>
              </div>
              <Progress value={Math.min(metasSimuladas.receita.percentual, 100)} className="h-2" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{formatarMoeda(metasSimuladas.receita.alcancado)}</span>
                <span>{formatarMoeda(metasSimuladas.receita.meta)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Controle de Despesas
            </CardTitle>
            <CardDescription>Limite de gastos mensais</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(metasSimuladas.despesa.status)}
                <span className="font-medium">Limite de Despesas</span>
              </div>
              <Badge className={getStatusColor(metasSimuladas.despesa.status)}>
                {metasSimuladas.despesa.status === 'dentro' ? 'Dentro do limite' :
                 metasSimuladas.despesa.status === 'atencao' ? 'Atenção' : 'Excedido'}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Utilizado</span>
                <span>{formatarPercentual(metasSimuladas.despesa.percentual)}</span>
              </div>
              <Progress 
                value={Math.min(metasSimuladas.despesa.percentual, 100)} 
                className={`h-2 ${metasSimuladas.despesa.percentual > 100 ? 'bg-red-100' : ''}`}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{formatarMoeda(metasSimuladas.despesa.realizado)}</span>
                <span>{formatarMoeda(metasSimuladas.despesa.meta)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Análise por Categorias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Receitas por Categoria</CardTitle>
            <CardDescription>Distribuição das receitas por categoria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analiseDetalhada.categoriasReceitas)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 8)
                .map(([categoria, valor]) => {
                  const percentual = (valor / analiseDetalhada.estatisticas.totalReceitas) * 100;
                  return (
                    <div key={categoria} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{categoria}</span>
                        <span className="text-green-600">{formatarMoeda(valor)}</span>
                      </div>
                      <Progress value={percentual} className="h-1" />
                      <div className="text-xs text-gray-500 text-right">
                        {formatarPercentual(percentual)}
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Despesas por Categoria</CardTitle>
            <CardDescription>Distribuição das despesas por categoria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analiseDetalhada.categoriasDespesas)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 8)
                .map(([categoria, valor]) => {
                  const percentual = (valor / analiseDetalhada.estatisticas.totalDespesas) * 100;
                  return (
                    <div key={categoria} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{categoria}</span>
                        <span className="text-red-600">{formatarMoeda(valor)}</span>
                      </div>
                      <Progress value={percentual} className="h-1 bg-red-100" />
                      <div className="text-xs text-gray-500 text-right">
                        {formatarPercentual(percentual)}
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Análise por Forma de Pagamento */}
      <Card>
        <CardHeader>
          <CardTitle>Análise por Forma de Pagamento</CardTitle>
          <CardDescription>Distribuição das movimentações por método de pagamento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(analiseDetalhada.formasPagamento)
              .sort(([,a], [,b]) => b.total - a.total)
              .map(([forma, dados]) => (
                <div key={forma} className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3">{forma}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-600">Receitas</span>
                      <span className="font-medium">{formatarMoeda(dados.receitas)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-600">Despesas</span>
                      <span className="font-medium">{formatarMoeda(dados.despesas)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-medium">Total</span>
                      <span className="font-bold">{formatarMoeda(dados.total)}</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Destaques do Período */}
      <Card>
        <CardHeader>
          <CardTitle>Destaques do Período</CardTitle>
          <CardDescription>Principais movimentações e insights</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-green-600">✨ Maior Receita</h4>
              {analiseDetalhada.estatisticas.maiorReceita.valor > 0 ? (
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="font-bold text-green-800">
                    {formatarMoeda(analiseDetalhada.estatisticas.maiorReceita.valor)}
                  </p>
                  <p className="text-sm text-green-700">
                    {analiseDetalhada.estatisticas.maiorReceita.descricao}
                  </p>
                  <p className="text-xs text-green-600">
                    {analiseDetalhada.estatisticas.maiorReceita.categoria} • {
                      format(parseISO(analiseDetalhada.estatisticas.maiorReceita.data_pagamento || 
                        analiseDetalhada.estatisticas.maiorReceita.created_at), 'dd/MM/yyyy', { locale: ptBR })
                    }
                  </p>
                </div>
              ) : (
                <p className="text-gray-500">Nenhuma receita no período</p>
              )}
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-red-600">💸 Maior Despesa</h4>
              {analiseDetalhada.estatisticas.maiorDespesa.valor > 0 ? (
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="font-bold text-red-800">
                    {formatarMoeda(analiseDetalhada.estatisticas.maiorDespesa.valor)}
                  </p>
                  <p className="text-sm text-red-700">
                    {analiseDetalhada.estatisticas.maiorDespesa.descricao}
                  </p>
                  <p className="text-xs text-red-600">
                    {analiseDetalhada.estatisticas.maiorDespesa.categoria} • {
                      format(parseISO(analiseDetalhada.estatisticas.maiorDespesa.data_pagamento || 
                        analiseDetalhada.estatisticas.maiorDespesa.created_at), 'dd/MM/yyyy', { locale: ptBR })
                    }
                  </p>
                </div>
              ) : (
                <p className="text-gray-500">Nenhuma despesa no período</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 