
import React, { useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Plus } from 'lucide-react';
import { useSaldoCaixa, useResumoHoje } from '../../hooks/useFinanceiro';

export const CashRegister: React.FC = () => {
  const [cashOpen, setCashOpen] = useState(false);
  
  // Dados reais do Supabase
  const { data: saldoCaixa = 0, isLoading: loadingSaldo } = useSaldoCaixa();
  const { data: resumoHoje, isLoading: loadingResumo } = useResumoHoje();

  const entradaHoje = resumoHoje?.totalEntradas || 0;
  const saidaHoje = resumoHoje?.totalSaidas || 0;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">Controle de Caixa</h2>
          <p className="text-blue-100">Status: {cashOpen ? 'Aberto' : 'Fechado'}</p>
        </div>
        <button
          onClick={() => setCashOpen(!cashOpen)}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            cashOpen 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          {cashOpen ? 'Fechar Caixa' : 'Abrir Caixa'}
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <DollarSign size={24} />
            {loadingSaldo ? (
              <div className="h-8 w-20 bg-white/20 rounded animate-pulse"></div>
            ) : (
              <span className="text-2xl font-bold">R$ {saldoCaixa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            )}
          </div>
          <p className="text-sm text-blue-100 mt-1">Saldo Atual</p>
        </div>
        
        <div className="bg-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <TrendingUp size={24} className="text-green-300" />
            {loadingResumo ? (
              <div className="h-8 w-20 bg-white/20 rounded animate-pulse"></div>
            ) : (
              <span className="text-2xl font-bold">R$ {entradaHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            )}
          </div>
          <p className="text-sm text-blue-100 mt-1">Entradas Hoje</p>
        </div>
        
        <div className="bg-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <TrendingDown size={24} className="text-red-300" />
            {loadingResumo ? (
              <div className="h-8 w-20 bg-white/20 rounded animate-pulse"></div>
            ) : (
              <span className="text-2xl font-bold">R$ {saidaHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            )}
          </div>
          <p className="text-sm text-blue-100 mt-1">Saídas Hoje</p>
        </div>
        
        <div className="bg-white/10 rounded-lg p-4">
          <button className="flex items-center justify-center w-full h-full space-x-2 hover:bg-white/20 rounded-lg transition-colors">
            <Plus size={20} />
            <span>Nova Transação</span>
          </button>
        </div>
      </div>
    </div>
  );
};
