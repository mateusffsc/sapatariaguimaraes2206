
import React from 'react';
import { TrendingUp, TrendingDown, Eye } from 'lucide-react';

const transactions = [
  {
    id: 1,
    type: 'entrada',
    description: 'OS #1234 - João Silva',
    value: 85.50,
    paymentMethod: 'Dinheiro',
    time: '10:30',
    status: 'completed'
  },
  {
    id: 2,
    type: 'entrada',
    description: 'Venda - Creme para couro',
    value: 25.00,
    paymentMethod: 'Cartão',
    time: '11:15',
    status: 'completed'
  },
  {
    id: 3,
    type: 'saida',
    description: 'Compra de material',
    value: 120.00,
    paymentMethod: 'Transferência',
    time: '09:45',
    status: 'completed'
  },
  {
    id: 4,
    type: 'entrada',
    description: 'OS #1230 - Ana Costa (Entrada)',
    value: 40.00,
    paymentMethod: 'PIX',
    time: '08:20',
    status: 'completed'
  }
];

export const RecentTransactions: React.FC = () => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Movimentações de Hoje</h3>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          Ver todas
        </button>
      </div>
      
      <div className="space-y-3">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                transaction.type === 'entrada' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {transaction.type === 'entrada' ? (
                  <TrendingUp size={16} className="text-green-600" />
                ) : (
                  <TrendingDown size={16} className="text-red-600" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                <p className="text-xs text-gray-500">{transaction.paymentMethod} • {transaction.time}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className={`font-semibold ${
                transaction.type === 'entrada' ? 'text-green-600' : 'text-red-600'
              }`}>
                {transaction.type === 'entrada' ? '+' : '-'}R$ {transaction.value.toFixed(2)}
              </span>
              <button className="p-1 hover:bg-gray-100 rounded">
                <Eye size={16} className="text-gray-400" />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total de entradas:</span>
          <span className="font-medium text-green-600">+R$ 150,50</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-gray-600">Total de saídas:</span>
          <span className="font-medium text-red-600">-R$ 120,00</span>
        </div>
        <div className="flex justify-between text-sm mt-2 pt-2 border-t border-gray-100">
          <span className="font-medium text-gray-900">Saldo do dia:</span>
          <span className="font-bold text-green-600">+R$ 30,50</span>
        </div>
      </div>
    </div>
  );
};
