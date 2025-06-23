import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Plus, TrendingUp, TrendingDown, ArrowRightLeft, Calendar, Filter } from 'lucide-react';
import { NovaMovimentacaoModal } from '../modals/NovaMovimentacaoModal';
import { useListarMovimentacoes, useResumoFinanceiro } from '../../hooks/usePayments';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function FinanceiroSection() {
  const [modalOpen, setModalOpen] = useState(false);
  
  // Dados dos últimos 30 dias
  const dataInicio = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const dataFim = new Date().toISOString();
  
  const { data: movimentacoes, isLoading: loadingMovimentacoes } = useListarMovimentacoes(dataInicio, dataFim);
  const { data: resumo, isLoading: loadingResumo } = useResumoFinanceiro(dataInicio, dataFim);

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
      case 'transferencia':
        return <ArrowRightLeft className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'entrada':
        return <Badge className="bg-green-100 text-green-800">Receita</Badge>;
      case 'saida':
        return <Badge className="bg-red-100 text-red-800">Despesa</Badge>;
      case 'transferencia':
        return <Badge className="bg-blue-100 text-blue-800">Transferência</Badge>;
      default:
        return null;
    }
  };

  if (loadingResumo || loadingMovimentacoes) {
    return (
      <div className="space-y-6">
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Receitas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatarMoeda(resumo?.totalReceitas || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Últimos 30 dias
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
              {formatarMoeda(resumo?.totalDespesas || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Últimos 30 dias
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
      </div>

      {/* Movimentações Recentes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Movimentações Recentes</CardTitle>
              <CardDescription>
                Últimas movimentações financeiras registradas
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtrar
              </Button>
              <Button onClick={() => setModalOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nova Movimentação
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!movimentacoes || movimentacoes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhuma movimentação encontrada</p>
              <p className="text-sm">Comece criando uma nova movimentação</p>
            </div>
          ) : (
            <div className="space-y-4">
              {movimentacoes.slice(0, 10).map((mov) => (
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
                        {getTipoBadge(mov.tipo)}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{mov.categoria}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(mov.data_pagamento || mov.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                        <span>{mov.forma_pagamento}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      mov.tipo === 'entrada' 
                        ? 'text-green-600' 
                        : mov.tipo === 'saida' 
                        ? 'text-red-600' 
                        : 'text-blue-600'
                    }`}>
                      {mov.tipo === 'entrada' ? '+' : mov.tipo === 'saida' ? '-' : ''}
                      {formatarMoeda(mov.valor)}
                    </div>
                  </div>
                </div>
              ))}
              
              {movimentacoes.length > 10 && (
                <div className="text-center pt-4">
                  <Button variant="outline" size="sm">
                    Ver todas as movimentações
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Nova Movimentação */}
      <NovaMovimentacaoModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
} 