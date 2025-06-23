import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { MovimentacaoFinanceira } from '../../lib/supabase';

interface GraficoReceitaDespesaProps {
  dataInicio: string;
  dataFim: string;
  movimentacoes: MovimentacaoFinanceira[];
}

export function GraficoReceitaDespesa({ dataInicio, dataFim, movimentacoes }: GraficoReceitaDespesaProps) {
  const dadosGrafico = useMemo(() => {
    if (!dataInicio || !dataFim || !movimentacoes.length) return [];

    const inicio = parseISO(dataInicio);
    const fim = parseISO(dataFim);
    
    // Determinar se mostrar por dias ou meses baseado no período
    const diasDiferenca = Math.ceil((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
    const porMeses = diasDiferenca > 62; // Mais de 2 meses, agrupar por mês

    let intervalos: Date[] = [];
    
    if (porMeses) {
      intervalos = eachMonthOfInterval({ start: inicio, end: fim });
    } else {
      intervalos = eachDayOfInterval({ start: inicio, end: fim });
    }

    return intervalos.map(intervalo => {
      const chave = porMeses 
        ? format(intervalo, 'yyyy-MM', { locale: ptBR })
        : format(intervalo, 'yyyy-MM-dd', { locale: ptBR });
      
      const movimentacoesPeriodo = movimentacoes.filter(mov => {
        const dataMov = mov.data_pagamento || mov.created_at;
        const dataMovFormat = porMeses 
          ? format(parseISO(dataMov), 'yyyy-MM', { locale: ptBR })
          : format(parseISO(dataMov), 'yyyy-MM-dd', { locale: ptBR });
        
        return dataMovFormat === chave;
      });

      const receitas = movimentacoesPeriodo
        .filter(mov => mov.tipo === 'entrada')
        .reduce((sum, mov) => sum + mov.valor, 0);

      const despesas = movimentacoesPeriodo
        .filter(mov => mov.tipo === 'saida')
        .reduce((sum, mov) => sum + mov.valor, 0);

      return {
        periodo: porMeses 
          ? format(intervalo, 'MMM/yyyy', { locale: ptBR })
          : format(intervalo, 'dd/MM', { locale: ptBR }),
        receitas: receitas,
        despesas: despesas,
        lucro: receitas - despesas
      };
    });
  }, [dataInicio, dataFim, movimentacoes]);

  const dadosPizza = useMemo(() => {
    const totalReceitas = movimentacoes
      .filter(mov => mov.tipo === 'entrada')
      .reduce((sum, mov) => sum + mov.valor, 0);

    const totalDespesas = movimentacoes
      .filter(mov => mov.tipo === 'saida')
      .reduce((sum, mov) => sum + mov.valor, 0);

    return [
      { name: 'Receitas', value: totalReceitas, color: '#22c55e' },
      { name: 'Despesas', value: totalDespesas, color: '#ef4444' }
    ];
  }, [movimentacoes]);

  const categoriasReceitas = useMemo(() => {
    const receitas = movimentacoes.filter(mov => mov.tipo === 'entrada');
    const categorias = receitas.reduce((acc, mov) => {
      const categoria = mov.categoria || 'Sem categoria';
      acc[categoria] = (acc[categoria] || 0) + mov.valor;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categorias)
      .map(([categoria, valor]) => ({ categoria, valor }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5); // Top 5
  }, [movimentacoes]);

  const categoriasDespesas = useMemo(() => {
    const despesas = movimentacoes.filter(mov => mov.tipo === 'saida');
    const categorias = despesas.reduce((acc, mov) => {
      const categoria = mov.categoria || 'Sem categoria';
      acc[categoria] = (acc[categoria] || 0) + mov.valor;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categorias)
      .map(([categoria, valor]) => ({ categoria, valor }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5); // Top 5
  }, [movimentacoes]);

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const COLORS = ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  if (!movimentacoes.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gráficos Financeiros</CardTitle>
          <CardDescription>Análise visual das receitas e despesas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>Nenhuma movimentação encontrada para o período selecionado</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Gráfico de Barras - Receitas vs Despesas */}
      <Card>
        <CardHeader>
          <CardTitle>Receitas vs Despesas por Período</CardTitle>
          <CardDescription>Comparação temporal de receitas e despesas</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={dadosGrafico}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="periodo" />
              <YAxis tickFormatter={(value) => formatarMoeda(value)} />
              <Tooltip formatter={(value: number) => formatarMoeda(value)} />
              <Legend />
              <Bar dataKey="receitas" fill="#22c55e" name="Receitas" />
              <Bar dataKey="despesas" fill="#ef4444" name="Despesas" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Linha - Lucro */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução do Lucro</CardTitle>
          <CardDescription>Tendência do lucro (receitas - despesas) ao longo do tempo</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dadosGrafico}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="periodo" />
              <YAxis tickFormatter={(value) => formatarMoeda(value)} />
              <Tooltip formatter={(value: number) => formatarMoeda(value)} />
              <Line 
                type="monotone" 
                dataKey="lucro" 
                stroke="#3b82f6" 
                strokeWidth={3}
                name="Lucro"
                dot={{ fill: '#3b82f6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Pizza - Receitas vs Despesas */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição Receitas vs Despesas</CardTitle>
            <CardDescription>Proporção entre receitas e despesas totais</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dadosPizza}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dadosPizza.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatarMoeda(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Categorias de Receitas */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 - Categorias de Receitas</CardTitle>
            <CardDescription>Principais fontes de receita</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoriasReceitas} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(value) => formatarMoeda(value)} />
                <YAxis dataKey="categoria" type="category" width={100} />
                <Tooltip formatter={(value: number) => formatarMoeda(value)} />
                <Bar dataKey="valor" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Categorias de Despesas */}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 - Categorias de Despesas</CardTitle>
          <CardDescription>Principais gastos por categoria</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoriasDespesas}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="categoria" />
              <YAxis tickFormatter={(value) => formatarMoeda(value)} />
              <Tooltip formatter={(value: number) => formatarMoeda(value)} />
              <Bar dataKey="valor" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
} 