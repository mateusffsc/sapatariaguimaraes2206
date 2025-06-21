
import React from 'react';
import { Plus, FileText, ShoppingCart, Users, CreditCard } from 'lucide-react';

const actions = [
  {
    title: 'Nova OS',
    description: 'Criar nova ordem de serviço',
    icon: FileText,
    color: 'bg-blue-500 hover:bg-blue-600',
    path: '/ordens-servico/nova'
  },
  {
    title: 'Nova Venda',
    description: 'Registrar venda de produto',
    icon: ShoppingCart,
    color: 'bg-green-500 hover:bg-green-600',
    path: '/vendas/nova'
  },
  {
    title: 'Novo Cliente',
    description: 'Cadastrar novo cliente',
    icon: Users,
    color: 'bg-purple-500 hover:bg-purple-600',
    path: '/clientes/novo'
  },
  {
    title: 'Receber Cobrança',
    description: 'Quitar valor em crediário',
    icon: CreditCard,
    color: 'bg-orange-500 hover:bg-orange-600',
    path: '/crediario'
  }
];

export const QuickActions: React.FC = () => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center space-x-2 mb-4">
        <Plus size={20} className="text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Ações Rápidas</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={index}
              className={`${action.color} text-white p-4 rounded-lg transition-colors group`}
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <Icon size={24} className="group-hover:scale-110 transition-transform" />
                <div>
                  <p className="font-medium text-sm">{action.title}</p>
                  <p className="text-xs opacity-90">{action.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
