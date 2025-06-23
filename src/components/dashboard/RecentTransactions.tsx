
import React from 'react';
import { TrendingUp, TrendingDown, Eye } from 'lucide-react';
import { useMovimentacoesDia } from '../../hooks/useFinanceiro';

export const RecentTransactions: React.FC = () => {
  const { data: movimentacoes = [], isLoading } = useMovimentacoesDia();

  // Calcular totais
  const totalEntradas = movimentacoes
    .filter(m => m.tipo === 'entrada')
    .reduce((sum, m) => sum + m.valor, 0);
  
  const totalSaidas = movimentacoes
    .filter(m => m.tipo === 'saida')
    .reduce((sum, m) => sum + m.valor, 0);
  
  const saldoDia = totalEntradas - totalSaidas;

  // Pegar apenas as 4 movimentações mais recentes
  const movimentacoesRecentes = movimentacoes.slice(0, 4);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Movimentações de Hoje</h3>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          Ver todas
        </button>
      </div>
      
      <div className="space-y-3">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                <div>
                  <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 w-24 bg-gray-200 rounded animate-pulse mt-1"></div>
                </div>
              </div>
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))
        ) : movimentacoesRecentes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Nenhuma movimentação hoje</p>
          </div>
        ) : (
          movimentacoesRecentes.map((movimentacao) => (
            <div key={movimentacao.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  movimentacao.tipo === 'entrada' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {movimentacao.tipo === 'entrada' ? (
                    <TrendingUp size={16} className="text-green-600" />
                  ) : (
                    <TrendingDown size={16} className="text-red-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{movimentacao.descricao}</p>
                  <p className="text-xs text-gray-500">
                    {movimentacao.forma_pagamento} • {formatTime(movimentacao.created_at)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className={`font-semibold ${
                  movimentacao.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {movimentacao.tipo === 'entrada' ? '+' : '-'}R$ {movimentacao.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <button className="p-1 hover:bg-gray-100 rounded">
                  <Eye size={16} className="text-gray-400" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        {isLoading ? (
          <div className="space-y-2">
            <div className="flex justify-between">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="flex justify-between">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-100">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total de entradas:</span>
              <span className="font-medium text-green-600">+R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-600">Total de saídas:</span>
              <span className="font-medium text-red-600">-R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm mt-2 pt-2 border-t border-gray-100">
              <span className="font-medium text-gray-900">Saldo do dia:</span>
              <span className={`font-bold ${saldoDia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {saldoDia >= 0 ? '+' : ''}R$ {saldoDia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
