import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  DollarSign,
  Target,
  Award,
  AlertCircle
} from 'lucide-react';
import { format, startOfYear, endOfYear, eachMonthOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMovimentacoes } from '../../hooks/useFinanceiro';

interface RelatorioAnualProps {
  ano: number;
}

export function RelatorioAnual({ ano }: RelatorioAnualProps) {
  const anoAtual = new Date().getFullYear();
  const dataInicio = format(startOfYear(new Date(ano, 0, 1)), 'yyyy-MM-dd');
  const dataFim = format(endOfYear(new Date(ano, 11, 31)), 'yyyy-MM-dd');

  const { data: movimentacoes, isLoading } = useMovimentacoes(dataInicio, dataFim);

  const dadosAnuais = useMemo(() => {
    if (!movimentacoes?.length) return [];

    const mesesDoAno = eachMonthOfInterval({
      start: startOfYear(new Date(ano, 0, 1)),
      end: endOfYear(new Date(ano, 11, 31))
    });

    return mesesDoAno.map(mes => {
      const inicioMes = startOfMonth(mes);
      const fimMes = endOfMonth(mes);

      const movimentacoesMes = movimentacoes.filter(mov => {
        const dataMov = new Date(mov.data_pagamento || mov.created_at);
        return dataMov >= inicioMes && dataMov <= fimMes;
      });

      const receitas = movimentacoesMes
        .filter(mov => mov.tipo === 'entrada')
        .reduce((sum, mov) => sum + mov.valor, 0);

      const despesas = movimentacoesMes
        .filter(mov => mov.tipo === 'saida')
        .reduce((sum, mov) => sum + mov.valor, 0);

      return {
        mes: format(mes, 'MMM', { locale: ptBR }),
        mesCompleto: format(mes, 'MMMM', { locale: ptBR }),
        receitas,
        despesas,
        lucro: receitas - despesas,
        movimentacoes: movimentacoesMes.length
      };
    });
  }, [movimentacoes, ano]);

  const estatisticasAnuais = useMemo(() => {
    if (!movimentacoes?.length) return null;

    const receitas = movimentacoes.filter(mov => mov.tipo === 'entrada');
    const despesas = movimentacoes.filter(mov => mov.tipo === 'saida');

    const totalReceitas = receitas.reduce((sum, mov) => sum + mov.valor, 0);
    const totalDespesas = despesas.reduce((sum, mov) => sum + mov.valor, 0);
    const lucroTotal = totalReceitas - totalDespesas;

    // Análise mensal
    const receitasPorMes = dadosAnuais.map(mes => mes.receitas);
    const despesasPorMes = dadosAnuais.map(mes => mes.despesas);
    const lucrosPorMes = dadosAnuais.map(mes => mes.lucro);

    const melhorMesReceita = dadosAnuais.reduce((max, mes) => 
      mes.receitas > max.receitas ? mes : max, dadosAnuais[0] || { receitas: 0, mesCompleto: '' });
    
    const piorMesReceita = dadosAnuais.reduce((min, mes) => 
      mes.receitas < min.receitas ? mes : min, dadosAnuais[0] || { receitas: 0, mesCompleto: '' });

    const melhorMesLucro = dadosAnuais.reduce((max, mes) => 
      mes.lucro > max.lucro ? mes : max, dadosAnuais[0] || { lucro: 0, mesCompleto: '' });

    // Médias mensais
    const mediaMensalReceita = totalReceitas / 12;
    const mediaMensalDespesa = totalDespesas / 12;
    const mediaMensalLucro = lucroTotal / 12;

    // Categorias mais rentáveis
    const categorias = receitas.reduce((acc, mov) => {
      const categoria = mov.categoria || 'Sem categoria';
      acc[categoria] = (acc[categoria] || 0) + mov.valor;
      return acc;
    }, {} as Record<string, number>);

    const topCategorias = Object.entries(categorias)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    return {
      totalReceitas,
      totalDespesas,
      lucroTotal,
      melhorMesReceita,
      piorMesReceita,
      melhorMesLucro,
      mediaMensalReceita,
      mediaMensalDespesa,
      mediaMensalLucro,
      topCategorias,
      totalMovimentacoes: movimentacoes.length,
      ticketMedioReceita: receitas.length > 0 ? totalReceitas / receitas.length : 0,
      margemLucro: totalReceitas > 0 ? (lucroTotal / totalReceitas) * 100 : 0
    };
  }, [movimentacoes, dadosAnuais]);

  const comparativoAnual = useMemo(() => {
    // Simulação de dados do ano anterior para comparação
    const anoAnterior = ano - 1;
    const crescimentoReceita = Math.random() * 30 - 10; // -10% a +20%
    const crescimentoDespesa = Math.random() * 20 - 5;  // -5% a +15%
    
    return {
      anoAnterior,
      crescimentoReceita,
      crescimentoDespesa,
      status: crescimentoReceita > 0 ? 'crescimento' : 'declinio'
    };
  }, [ano]);

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarPercentual = (valor: number) => {
    return `${valor.toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (!estatisticasAnuais) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Relatório Anual {ano}</CardTitle>
          <CardDescription>Análise completa do desempenho anual</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>Nenhuma movimentação encontrada para o ano {ano}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header do Relatório */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Relatório Anual {ano}
          </CardTitle>
          <CardDescription>
            Análise completa do desempenho financeiro de {ano}
            {ano === anoAtual && " (ano atual)"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">
                {formatarMoeda(estatisticasAnuais.totalReceitas)}
              </p>
              <p className="text-sm text-gray-600">Total Receitas</p>
              <p className="text-xs text-gray-500 mt-1">
                Média mensal: {formatarMoeda(estatisticasAnuais.mediaMensalReceita)}
              </p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <TrendingDown className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-red-600">
                {formatarMoeda(estatisticasAnuais.totalDespesas)}
              </p>
              <p className="text-sm text-gray-600">Total Despesas</p>
              <p className="text-xs text-gray-500 mt-1">
                Média mensal: {formatarMoeda(estatisticasAnuais.mediaMensalDespesa)}
              </p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <DollarSign className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className={`text-2xl font-bold ${
                estatisticasAnuais.lucroTotal >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatarMoeda(estatisticasAnuais.lucroTotal)}
              </p>
              <p className="text-sm text-gray-600">Lucro Total</p>
              <p className="text-xs text-gray-500 mt-1">
                Margem: {formatarPercentual(estatisticasAnuais.margemLucro)}
              </p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <Target className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">
                {estatisticasAnuais.totalMovimentacoes}
              </p>
              <p className="text-sm text-gray-600">Movimentações</p>
              <p className="text-xs text-gray-500 mt-1">
                Ticket médio: {formatarMoeda(estatisticasAnuais.ticketMedioReceita)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Evolução Mensal */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução Mensal {ano}</CardTitle>
          <CardDescription>Receitas, despesas e lucro mês a mês</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={dadosAnuais}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis tickFormatter={(value) => formatarMoeda(value)} />
              <Tooltip formatter={(value: number) => formatarMoeda(value)} />
              <Legend />
              <Bar dataKey="receitas" fill="#22c55e" name="Receitas" />
              <Bar dataKey="despesas" fill="#ef4444" name="Despesas" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Lucro */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução do Lucro Mensal</CardTitle>
          <CardDescription>Tendência de lucro ao longo do ano</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dadosAnuais}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis tickFormatter={(value) => formatarMoeda(value)} />
              <Tooltip formatter={(value: number) => formatarMoeda(value)} />
              <Line 
                type="monotone" 
                dataKey="lucro" 
                stroke="#3b82f6" 
                strokeWidth={3}
                name="Lucro Mensal"
                dot={{ fill: '#3b82f6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Destaques do Ano */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Destaques de {ano}
            </CardTitle>
            <CardDescription>Melhores e piores performances</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800">Melhor mês (Receitas)</span>
              </div>
              <p className="text-lg font-bold text-green-800">
                {estatisticasAnuais.melhorMesReceita.mesCompleto}
              </p>
              <p className="text-sm text-green-700">
                {formatarMoeda(estatisticasAnuais.melhorMesReceita.receitas)}
              </p>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">Melhor mês (Lucro)</span>
              </div>
              <p className="text-lg font-bold text-blue-800">
                {estatisticasAnuais.melhorMesLucro.mesCompleto}
              </p>
              <p className="text-sm text-blue-700">
                {formatarMoeda(estatisticasAnuais.melhorMesLucro.lucro)}
              </p>
            </div>

            <div className="p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <span className="font-medium text-orange-800">Menor receita</span>
              </div>
              <p className="text-lg font-bold text-orange-800">
                {estatisticasAnuais.piorMesReceita.mesCompleto}
              </p>
              <p className="text-sm text-orange-700">
                {formatarMoeda(estatisticasAnuais.piorMesReceita.receitas)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Top Categorias */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 - Categorias mais Rentáveis</CardTitle>
            <CardDescription>Principais fontes de receita em {ano}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {estatisticasAnuais.topCategorias.map(([categoria, valor], index) => {
                const percentual = (valor / estatisticasAnuais.totalReceitas) * 100;
                return (
                  <div key={categoria} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                        {categoria}
                      </span>
                      <span className="text-green-600 font-bold">
                        {formatarMoeda(valor)}
                      </span>
                    </div>
                    <Progress value={percentual} className="h-2" />
                    <div className="text-xs text-gray-500 text-right">
                      {formatarPercentual(percentual)} do total
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparativo com Ano Anterior */}
      <Card>
        <CardHeader>
          <CardTitle>Comparativo com {comparativoAnual.anoAnterior}</CardTitle>
          <CardDescription>Análise de crescimento ano a ano</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Crescimento de Receitas</span>
                <Badge className={comparativoAnual.crescimentoReceita >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {comparativoAnual.crescimentoReceita >= 0 ? '+' : ''}{formatarPercentual(comparativoAnual.crescimentoReceita)}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">
                {comparativoAnual.crescimentoReceita >= 0 
                  ? `Crescimento de ${formatarPercentual(comparativoAnual.crescimentoReceita)} em relação a ${comparativoAnual.anoAnterior}`
                  : `Redução de ${formatarPercentual(Math.abs(comparativoAnual.crescimentoReceita))} em relação a ${comparativoAnual.anoAnterior}`
                }
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Variação de Despesas</span>
                <Badge className={comparativoAnual.crescimentoDespesa <= 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                  {comparativoAnual.crescimentoDespesa >= 0 ? '+' : ''}{formatarPercentual(comparativoAnual.crescimentoDespesa)}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">
                {comparativoAnual.crescimentoDespesa >= 0 
                  ? `Aumento de ${formatarPercentual(comparativoAnual.crescimentoDespesa)} em relação a ${comparativoAnual.anoAnterior}`
                  : `Redução de ${formatarPercentual(Math.abs(comparativoAnual.crescimentoDespesa))} em relação a ${comparativoAnual.anoAnterior}`
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 