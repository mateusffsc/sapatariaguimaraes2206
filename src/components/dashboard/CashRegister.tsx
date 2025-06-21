
import React, { useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Plus } from 'lucide-react';

export const CashRegister: React.FC = () => {
  const [cashOpen, setCashOpen] = useState(false);
  const [cashBalance] = useState(2450.50);

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
            <span className="text-2xl font-bold">R$ {cashBalance.toFixed(2)}</span>
          </div>
          <p className="text-sm text-blue-100 mt-1">Saldo Atual</p>
        </div>
        
        <div className="bg-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <TrendingUp size={24} className="text-green-300" />
            <span className="text-2xl font-bold">R$ 1.240,00</span>
          </div>
          <p className="text-sm text-blue-100 mt-1">Entradas Hoje</p>
        </div>
        
        <div className="bg-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <TrendingDown size={24} className="text-red-300" />
            <span className="text-2xl font-bold">R$ 380,00</span>
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
