
import React from 'react';
import { Users, FileText, ShoppingCart, CreditCard, TrendingUp, Package } from 'lucide-react';

const stats = [
  {
    title: 'Clientes Ativos',
    value: '1,234',
    change: '+12%',
    changeType: 'positive' as const,
    icon: Users,
    color: 'bg-blue-500'
  },
  {
    title: 'OS Abertas',
    value: '23',
    change: '+5',
    changeType: 'positive' as const,
    icon: FileText,
    color: 'bg-orange-500'
  },
  {
    title: 'Vendas do Mês',
    value: 'R$ 12.450',
    change: '+8%',
    changeType: 'positive' as const,
    icon: ShoppingCart,
    color: 'bg-green-500'
  },
  {
    title: 'Ticket Médio',
    value: 'R$ 85,50',
    change: '+2%',
    changeType: 'positive' as const,
    icon: TrendingUp,
    color: 'bg-purple-500'
  },
  {
    title: 'Crediário',
    value: 'R$ 3.240',
    change: '-5%',
    changeType: 'negative' as const,
    icon: CreditCard,
    color: 'bg-red-500'
  },
  {
    title: 'Produtos em Estoque',
    value: '156',
    change: '0',
    changeType: 'neutral' as const,
    icon: Package,
    color: 'bg-gray-500'
  }
];

export const DashboardCards: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                <div className="flex items-center mt-2">
                  <span className={`text-sm font-medium ${
                    stat.changeType === 'positive' ? 'text-green-600' : 
                    stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-500 ml-2">este mês</span>
                </div>
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                <Icon size={24} className="text-white" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
