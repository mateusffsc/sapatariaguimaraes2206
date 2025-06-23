import React, { useState, useMemo } from 'react';
import { Plus, Search, Eye, Calendar, Filter, DollarSign, CreditCard, Clock } from 'lucide-react';
import { useVendas, useVendasStats } from '../hooks/useVendas';
import { Sale, PaymentStatus, SaleWithRelations } from '../types/database';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { NovaVendaModal } from '../components/modals/NovaVendaModal';

export const VendasPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | PaymentStatus>('todos');
  const [dateFilter, setDateFilter] = useState<'todos' | 'hoje' | 'semana' | 'mes'>('todos');
  const [showNovaVendaModal, setShowNovaVendaModal] = useState(false);
  
  const { data: vendas = [], isLoading } = useVendas() as { data: SaleWithRelations[], isLoading: boolean };
  const { data: stats } = useVendasStats();

  // Filtrar vendas
  const vendasFiltradas = useMemo(() => {
    let filtered = vendas;

    // Filtro por termo de busca (cliente ou valor)
    if (searchTerm.trim()) {
      filtered = filtered.filter(venda => 
        venda.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        venda.total_price.toString().includes(searchTerm)
      );
    }

    // Filtro por status
    if (statusFilter !== 'todos') {
      filtered = filtered.filter(venda => venda.payment_status === statusFilter);
    }

    // Filtro por data
    if (dateFilter !== 'todos') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(venda => {
        const vendaDate = new Date(venda.created_at);
        
        switch (dateFilter) {
          case 'hoje':
            return vendaDate >= today;
          case 'semana':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return vendaDate >= weekAgo;
          case 'mes':
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return vendaDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [vendas, searchTerm, statusFilter, dateFilter]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: PaymentStatus, isCreditSale: boolean) => {
    if (isCreditSale && status === 'paid') {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Crediário Quitado</Badge>;
    }
    
    if (isCreditSale && status === 'pending') {
      return <Badge variant="destructive">Crediário Pendente</Badge>;
    }

    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-100 text-green-800">Pago</Badge>;
      case 'pending':
        return <Badge variant="destructive">Pendente</Badge>;
      case 'partially_paid':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Parcial</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Cancelado</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader>
        <button
          onClick={() => setShowNovaVendaModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus size={20} />
          <span>Nova Venda</span>
        </button>
      </PageHeader>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSales || 0}</div>
            <p className="text-xs text-muted-foreground">vendas realizadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</div>
            <p className="text-xs text-muted-foreground">faturamento total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas a Crédito</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.creditSales || 0}</div>
            <p className="text-xs text-muted-foreground">crediário ativo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crédito Pendente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.pendingCredit || 0)}</div>
            <p className="text-xs text-muted-foreground">a receber</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Vendas */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por cliente ou valor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="text-gray-400" size={20} />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'todos' | PaymentStatus)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="todos">Todos os status</option>
                <option value="paid">Pago</option>
                <option value="pending">Pendente</option>
                <option value="partially_paid">Parcial</option>
                <option value="cancelled">Cancelado</option>
              </select>
              
              <Calendar className="text-gray-400" size={20} />
              <select 
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as 'todos' | 'hoje' | 'semana' | 'mes')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="todos">Todas as datas</option>
                <option value="hoje">Hoje</option>
                <option value="semana">Última semana</option>
                <option value="mes">Último mês</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data da Venda
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Itens
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-3 w-24 bg-gray-200 rounded animate-pulse mt-1"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 w-28 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                  </tr>
                ))
              ) : vendasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    {searchTerm.trim() || statusFilter !== 'todos' || dateFilter !== 'todos'
                      ? 'Nenhuma venda encontrada com os filtros aplicados'
                      : 'Nenhuma venda registrada'
                    }
                  </td>
                </tr>
              ) : (
                vendasFiltradas.map((venda) => (
                  <tr key={venda.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {venda.client?.name || 'Cliente não informado'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {venda.client?.phone || 'Sem telefone'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(venda.total_price)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        venda.is_credit_sale 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {venda.is_credit_sale ? 'Crediário' : 'À Vista'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(venda.payment_status, venda.is_credit_sale)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(venda.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {venda.items?.length || 0} item(s)
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors">
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <NovaVendaModal 
        isOpen={showNovaVendaModal} 
        onClose={() => setShowNovaVendaModal(false)} 
      />
    </div>
  );
}; 