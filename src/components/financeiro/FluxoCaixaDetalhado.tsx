import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowRightLeft, 
  Calendar, 
  Filter,
  Eye,
  Download,
  CreditCard,
  Wallet,
  PiggyBank,
  AlertTriangle
} from 'lucide-react';
import { format, parseISO, startOfDay, endOfDay, isToday, isYesterday, isTomorrow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { MovimentacaoFinanceira } from '../../lib/supabase';

interface FluxoCaixaDetalhadoProps {
  dataInicio: string;
  dataFim: string;
  movimentacoes: MovimentacaoFinanceira[];
}

export function FluxoCaixaDetalhado({ dataInicio, dataFim, movimentacoes }: FluxoCaixaDetalhadoProps) {
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'entrada' | 'saida'>('todos');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');
  const [filtroFormaPagamento, setFiltroFormaPagamento] = useState<string>('todas');
  const [visualizacao, setVisualizacao] = useState<'cronologica' | 'agrupada'>('cronologica');

  const movimentacoesFiltradas = useMemo(() => {
    return movimentacoes.filter(mov => {
      if (filtroTipo !== 'todos' && mov.tipo !== filtroTipo) return false;
      if (filtroCategoria !== 'todas' && mov.categoria !== filtroCategoria) return false;
      if (filtroFormaPagamento !== 'todas' && mov.forma_pagamento !== filtroFormaPagamento) return false;
      return true;
    });
  }, [movimentacoes, filtroTipo, filtroCategoria, filtroFormaPagamento]);

  const dadosFluxo = useMemo(() => {
    if (!movimentacoesFiltradas.length) return [];

    // Ordenar por data
    const movimentacoesOrdenadas = [...movimentacoesFiltradas].sort((a, b) => {
      const dataA = new Date(a.data_pagamento || a.created_at);
      const dataB = new Date(b.data_pagamento || b.created_at);
      return dataA.getTime() - dataB.getTime();
    });

    let saldoAcumulado = 0;
    
    return movimentacoesOrdenadas.map(mov => {
      const valor = mov.tipo === 'entrada' ? mov.valor : -mov.valor;
      saldoAcumulado += valor;
      
      return {
        ...mov,
        saldoAcumulado,
        valorComSinal: valor
      };
    });
  }, [movimentacoesFiltradas]);

  const dadosAgrupados = useMemo(() => {
    if (!movimentacoesFiltradas.length) return [];

    const grupos = movimentacoesFiltradas.reduce((acc, mov) => {
      const data = format(parseISO(mov.data_pagamento || mov.created_at), 'yyyy-MM-dd');
      
      if (!acc[data]) {
        acc[data] = {
          data,
          dataFormatada: format(parseISO(mov.data_pagamento || mov.created_at), 'dd/MM/yyyy', { locale: ptBR }),
          movimentacoes: [],
          totalEntradas: 0,
          totalSaidas: 0,
          saldoDia: 0
        };
      }
      
      acc[data].movimentacoes.push(mov);
      
      if (mov.tipo === 'entrada') {
        acc[data].totalEntradas += mov.valor;
      } else {
        acc[data].totalSaidas += mov.valor;
      }
      
      acc[data].saldoDia = acc[data].totalEntradas - acc[data].totalSaidas;
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grupos).sort((a: any, b: any) => 
      new Date(a.data).getTime() - new Date(b.data).getTime()
    );
  }, [movimentacoesFiltradas]);

  const resumoFluxo = useMemo(() => {
    const totalEntradas = movimentacoesFiltradas
      .filter(mov => mov.tipo === 'entrada')
      .reduce((sum, mov) => sum + mov.valor, 0);

    const totalSaidas = movimentacoesFiltradas
      .filter(mov => mov.tipo === 'saida')
      .reduce((sum, mov) => sum + mov.valor, 0);

    const saldoFinal = totalEntradas - totalSaidas;

    // Análise por categoria
    const categorias = [...new Set(movimentacoesFiltradas.map(mov => mov.categoria))].filter(Boolean);
    const formasPagamento = [...new Set(movimentacoesFiltradas.map(mov => mov.forma_pagamento))].filter(Boolean);

    // Maior entrada e saída
    const entradas = movimentacoesFiltradas.filter(mov => mov.tipo === 'entrada');
    const saidas = movimentacoesFiltradas.filter(mov => mov.tipo === 'saida');

    const maiorEntrada = entradas.reduce((max, mov) => mov.valor > max.valor ? mov : max, entradas[0] || { valor: 0 });
    const maiorSaida = saidas.reduce((max, mov) => mov.valor > max.valor ? mov : max, saidas[0] || { valor: 0 });

    return {
      totalEntradas,
      totalSaidas,
      saldoFinal,
      totalMovimentacoes: movimentacoesFiltradas.length,
      categorias,
      formasPagamento,
      maiorEntrada,
      maiorSaida,
      mediaEntrada: entradas.length > 0 ? totalEntradas / entradas.length : 0,
      mediaSaida: saidas.length > 0 ? totalSaidas / saidas.length : 0
    };
  }, [movimentacoesFiltradas]);

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'entrada':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'saida':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <ArrowRightLeft className="h-4 w-4 text-blue-600" />;
    }
  };

  const getFormaPagamentoIcon = (forma: string) => {
    const formaLower = forma?.toLowerCase() || '';
    if (formaLower.includes('cartão') || formaLower.includes('cartao')) {
      return <CreditCard className="h-4 w-4" />;
    }
    if (formaLower.includes('dinheiro') || formaLower.includes('espécie')) {
      return <Wallet className="h-4 w-4" />;
    }
    if (formaLower.includes('pix') || formaLower.includes('transferência')) {
      return <PiggyBank className="h-4 w-4" />;
    }
    return <ArrowRightLeft className="h-4 w-4" />;
  };

  const getDataLabel = (data: string) => {
    const date = parseISO(data);
    if (isToday(date)) return 'Hoje';
    if (isYesterday(date)) return 'Ontem';
    if (isTomorrow(date)) return 'Amanhã';
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  };

  if (!movimentacoes.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fluxo de Caixa Detalhado</CardTitle>
          <CardDescription>Análise detalhada do fluxo de caixa</CardDescription>
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
      {/* Resumo do Fluxo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Resumo do Fluxo de Caixa
          </CardTitle>
          <CardDescription>
            Período: {format(parseISO(dataInicio), 'dd/MM/yyyy', { locale: ptBR })} a {format(parseISO(dataFim), 'dd/MM/yyyy', { locale: ptBR })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg bg-green-50">
              <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">
                {formatarMoeda(resumoFluxo.totalEntradas)}
              </p>
              <p className="text-sm text-gray-600">Total Entradas</p>
              <p className="text-xs text-gray-500 mt-1">
                Média: {formatarMoeda(resumoFluxo.mediaEntrada)}
              </p>
            </div>

            <div className="text-center p-4 border rounded-lg bg-red-50">
              <TrendingDown className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-red-600">
                {formatarMoeda(resumoFluxo.totalSaidas)}
              </p>
              <p className="text-sm text-gray-600">Total Saídas</p>
              <p className="text-xs text-gray-500 mt-1">
                Média: {formatarMoeda(resumoFluxo.mediaSaida)}
              </p>
            </div>

            <div className="text-center p-4 border rounded-lg bg-blue-50">
              <ArrowRightLeft className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className={`text-2xl font-bold ${
                resumoFluxo.saldoFinal >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatarMoeda(resumoFluxo.saldoFinal)}
              </p>
              <p className="text-sm text-gray-600">Saldo Final</p>
              <p className="text-xs text-gray-500 mt-1">
                {resumoFluxo.saldoFinal >= 0 ? 'Positivo' : 'Negativo'}
              </p>
            </div>

            <div className="text-center p-4 border rounded-lg bg-purple-50">
              <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">
                {resumoFluxo.totalMovimentacoes}
              </p>
              <p className="text-sm text-gray-600">Movimentações</p>
              <p className="text-xs text-gray-500 mt-1">
                Total do período
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros e Visualização
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Select value={filtroTipo} onValueChange={(value: any) => setFiltroTipo(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="entrada">Apenas entradas</SelectItem>
                <SelectItem value="saida">Apenas saídas</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas categorias</SelectItem>
                {resumoFluxo.categorias.map(categoria => (
                  <SelectItem key={categoria} value={categoria}>
                    {categoria}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filtroFormaPagamento} onValueChange={setFiltroFormaPagamento}>
              <SelectTrigger>
                <SelectValue placeholder="Forma de pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as formas</SelectItem>
                {resumoFluxo.formasPagamento.map(forma => (
                  <SelectItem key={forma} value={forma}>
                    {forma}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={visualizacao} onValueChange={(value: any) => setVisualizacao(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Visualização" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cronologica">Cronológica</SelectItem>
                <SelectItem value="agrupada">Agrupada por dia</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Movimentações */}
      <Card>
        <CardHeader>
          <CardTitle>
            {visualizacao === 'cronologica' ? 'Fluxo Cronológico' : 'Fluxo Agrupado por Dia'}
          </CardTitle>
          <CardDescription>
            {movimentacoesFiltradas.length} movimentações encontradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {visualizacao === 'cronologica' ? (
            <div className="space-y-3">
              {dadosFluxo.map((mov, index) => (
                <div
                  key={mov.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {getTipoIcon(mov.tipo)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium truncate">
                          {mov.descricao}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {mov.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{mov.categoria}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {getDataLabel(mov.data_pagamento || mov.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          {getFormaPagamentoIcon(mov.forma_pagamento)}
                          {mov.forma_pagamento}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      mov.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {mov.tipo === 'entrada' ? '+' : '-'}
                      {formatarMoeda(mov.valor)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Saldo: {formatarMoeda(mov.saldoAcumulado)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {dadosAgrupados.map((grupo: any) => (
                <div key={grupo.data} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <h3 className="font-medium text-lg">
                        {getDataLabel(grupo.data)}
                      </h3>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-green-600">
                        +{formatarMoeda(grupo.totalEntradas)}
                      </span>
                      <span className="text-sm text-red-600">
                        -{formatarMoeda(grupo.totalSaidas)}
                      </span>
                      <span className={`text-sm font-medium ${
                        grupo.saldoDia >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        = {formatarMoeda(grupo.saldoDia)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {grupo.movimentacoes.map((mov: any) => (
                      <div key={mov.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div className="flex items-center gap-3">
                          {getTipoIcon(mov.tipo)}
                          <div>
                            <p className="text-sm font-medium">{mov.descricao}</p>
                            <p className="text-xs text-gray-500">
                              {mov.categoria} • {mov.forma_pagamento}
                            </p>
                          </div>
                        </div>
                        <div className={`text-sm font-medium ${
                          mov.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {mov.tipo === 'entrada' ? '+' : '-'}
                          {formatarMoeda(mov.valor)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alertas e Insights */}
      {(resumoFluxo.saldoFinal < 0 || resumoFluxo.totalSaidas > resumoFluxo.totalEntradas * 0.8) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Alertas do Fluxo de Caixa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-orange-700">
              {resumoFluxo.saldoFinal < 0 && (
                <p>⚠️ Saldo final negativo: {formatarMoeda(resumoFluxo.saldoFinal)}</p>
              )}
              {resumoFluxo.totalSaidas > resumoFluxo.totalEntradas * 0.8 && (
                <p>⚠️ Despesas representam mais de 80% das receitas</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 