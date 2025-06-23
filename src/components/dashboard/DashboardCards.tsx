import React from 'react';
import { Link } from 'react-router-dom';
import { Users, FileText, ShoppingCart, CreditCard, TrendingUp, Package } from 'lucide-react';
import { useContarClientesAtivos } from '../../hooks/useClientes';
import { useContarOrdensPorStatus, useTicketMedio } from '../../hooks/useOrdensServico';
import { useEstatisticasMes } from '../../hooks/useFinanceiro';
import { useContarProdutos, useResumoEstoque } from '../../hooks/useProdutos';

export const DashboardCards: React.FC = () => {
  const hoje = new Date();
  const mesAtual = hoje.getMonth() + 1;
  const anoAtual = hoje.getFullYear();

  // Queries para dados reais
  const { data: clientesAtivos = 0, isLoading: loadingClientes } = useContarClientesAtivos();
  const { data: ordensPorStatus = {}, isLoading: loadingOrdens } = useContarOrdensPorStatus();
  const { data: ticketMedio = 0, isLoading: loadingTicket } = useTicketMedio();
  const { data: estatisticasMes, isLoading: loadingEstatisticas } = useEstatisticasMes(anoAtual, mesAtual);
  const { data: totalProdutos = 0, isLoading: loadingProdutos } = useContarProdutos();
  const { data: resumoEstoque, isLoading: loadingEstoque } = useResumoEstoque();

  // Calcular OS abertas (em-andamento + pronto)
  const osAbertas = (ordensPorStatus['em-andamento'] || 0) + (ordensPorStatus['pronto'] || 0);

  const stats = [
    {
      title: 'Clientes Ativos',
      value: loadingClientes ? '...' : clientesAtivos.toLocaleString('pt-BR'),
      change: '+12%',
      changeType: 'positive' as const,
      icon: Users,
      color: 'bg-blue-500',
      isLoading: loadingClientes,
      link: '/clientes'
    },
    {
      title: 'OS Abertas',
      value: loadingOrdens ? '...' : osAbertas.toString(),
      change: '+5',
      changeType: 'positive' as const,
      icon: FileText,
      color: 'bg-orange-500',
      isLoading: loadingOrdens,
      link: '/ordens-servico'
    },
    {
      title: 'Receitas do Mês',
      value: loadingEstatisticas ? '...' : `R$ ${(estatisticasMes?.receitas || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      change: '+8%',
      changeType: 'positive' as const,
      icon: ShoppingCart,
      color: 'bg-green-500',
      isLoading: loadingEstatisticas,
      link: '/financeiro'
    },
    {
      title: 'Ticket Médio',
      value: loadingTicket ? '...' : `R$ ${ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      change: '+2%',
      changeType: 'positive' as const,
      icon: TrendingUp,
      color: 'bg-purple-500',
      isLoading: loadingTicket,
      link: '/financeiro'
    },
    {
      title: 'Ordens Entregues',
      value: loadingEstatisticas ? '...' : (estatisticasMes?.ordensEntregues || 0).toString(),
      change: `${ordensPorStatus['entregue'] || 0}`,
      changeType: 'positive' as const,
      icon: CreditCard,
      color: 'bg-green-600',
      isLoading: loadingEstatisticas,
      link: '/ordens-servico'
    },
    {
      title: 'Produtos Cadastrados',
      value: loadingProdutos ? '...' : totalProdutos.toString(),
      change: loadingEstoque ? '...' : `${resumoEstoque?.produtos_sem_estoque || 0} sem estoque`,
      changeType: (resumoEstoque?.produtos_sem_estoque || 0) > 0 ? 'negative' as const : 'positive' as const,
      icon: Package,
      color: 'bg-indigo-500',
      isLoading: loadingProdutos || loadingEstoque,
      link: '/estoque'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Link 
            key={index} 
            to={stat.link}
            className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-102 cursor-pointer block border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center`}>
                    <Icon size={20} className="text-white" />
                  </div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                </div>
                {stat.isLoading ? (
                  <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mt-3"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900 mt-3">{stat.value}</p>
                )}
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
            </div>
          </Link>
        );
      })}
    </div>
  );
};
