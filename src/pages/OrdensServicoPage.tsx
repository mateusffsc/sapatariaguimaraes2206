import React, { useState } from 'react';
import { Search, Eye, Package, CalendarDays, Clock, CheckCircle, TrendingUp, Activity, AlertCircle, QrCode } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  useListarOrdensServicoCompatibilidade,
  useEstatisticasOrdensServico,
  useObterOrdemServico,
  useMudarStatusOS
} from '../hooks/useServiceOrders';
import { useClientes } from '../hooks/useClientes';
import { OrdemServicoModal } from '../components/modals/OrdemServicoModal';
import { NovaOrdemServicoModal } from '../components/modals/NovaOrdemServicoModal';
import { QRCodeModal } from '../components/modals/QRCodeModal';

const statusColors = {
  'pendente': 'bg-yellow-100 text-yellow-800',
  'em_andamento': 'bg-blue-100 text-blue-800',
  'concluido': 'bg-green-100 text-green-800',
  'entregue': 'bg-gray-100 text-gray-800',
  'cancelado': 'bg-red-100 text-red-800'
};

const statusLabels = {
  'pendente': 'Orçamento',
  'em_andamento': 'Em Andamento',
  'concluido': 'Pronto',
  'entregue': 'Entregue',
  'cancelado': 'Cancelada'
};

export const OrdensServicoPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [modalAberto, setModalAberto] = useState(false);
  const [novaOrdemModalAberto, setNovaOrdemModalAberto] = useState(false);
  const [qrModalAberto, setQrModalAberto] = useState(false);
  const [ordemSelecionada, setOrdemSelecionada] = useState<number | null>(null);
  const [modoModal, setModoModal] = useState<'visualizar' | 'editar'>('visualizar');

  // Usar hooks para dados reais
  const { data: ordens, isLoading: loadingOrdens, error } = useListarOrdensServicoCompatibilidade();
  const { data: estatisticas, isLoading: loadingStats } = useEstatisticasOrdensServico();
  const { data: clientes } = useClientes();

  // Função para formatar moeda
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  // Função para filtrar ordens
  const filteredOrdens = ordens?.filter(ordem => {
    const matchesSearch = ordem.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ordem.artigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ordem.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'todos' || ordem.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  // Loading state
  if (loadingOrdens) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabela skeleton */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ordens de Serviço</h1>
            <p className="text-gray-600">Gerencie todas as ordens de serviço</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar ordens de serviço</h3>
            <p className="text-gray-600">Ocorreu um erro ao carregar os dados. Tente novamente.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <PageHeader
        title="Ordens de Serviço"
        subtitle="Gerencie todas as ordens de serviço da sapataria"
      >
        <Button onClick={() => setNovaOrdemModalAberto(true)}>
          <Package className="h-4 w-4 mr-2" />
          Nova Ordem
        </Button>
      </PageHeader>

      {/* Cards de Estatísticas */}
      {loadingStats ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-16 mb-1" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de OS</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estatisticas?.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                +2.1% desde ontem
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orçamentos</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estatisticas?.pendentes || 0}</div>
              <p className="text-xs text-muted-foreground">
                <Activity className="h-3 w-3 inline mr-1" />
                Aguardando aprovação
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estatisticas?.emAndamento || 0}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                Sendo executadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prontas</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estatisticas?.prontas || 0}</div>
              <p className="text-xs text-muted-foreground">
                <CheckCircle className="h-3 w-3 inline mr-1" />
                Para retirada
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Entregues</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estatisticas?.entregues || 0}</div>
              <p className="text-xs text-muted-foreground">
                <Activity className="h-3 w-3 inline mr-1" />
                Finalizadas
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros e Busca */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por OS, artigo ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos os status</option>
              <option value="pendente">Orçamento</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="concluido">Pronto</option>
              <option value="entregue">Entregue</option>
              <option value="cancelado">Cancelada</option>
            </select>
          </div>
        </div>

        {/* Lista de Ordens */}
        <div className="p-6">
          {filteredOrdens.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma ordem encontrada</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'todos' 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece criando uma nova ordem de serviço'
                }
              </p>
              {!searchTerm && statusFilter === 'todos' && (
                <Button onClick={() => setNovaOrdemModalAberto(true)} className="mt-4">
                  <Package className="h-4 w-4 mr-2" />
                  Criar Primeira Ordem
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrdens.map((ordem) => (
                <div key={ordem.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div>
                        <div className="font-medium text-gray-900">{ordem.numero}</div>
                        <div className="text-sm text-gray-500">
                          Cliente #{ordem.cliente_id}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{ordem.artigo || 'Não informado'}</div>
                        <div className="text-sm text-gray-500 max-w-xs truncate">{ordem.descricao}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <Badge className={statusColors[ordem.status as keyof typeof statusColors]}>
                        {statusLabels[ordem.status as keyof typeof statusLabels]}
                      </Badge>
                      
                      <div className="text-right">
                        <div className="font-medium text-gray-900">
                          {formatarMoeda(ordem.valor_total)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(ordem.data_entrada), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setOrdemSelecionada(Number(ordem.id));
                            setQrModalAberto(true);
                          }}
                          title="Gerar QR Code"
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setOrdemSelecionada(Number(ordem.id));
                            setModoModal('visualizar');
                            setModalAberto(true);
                          }}
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Nova Ordem */}
      <NovaOrdemServicoModal
        isOpen={novaOrdemModalAberto}
        onClose={() => setNovaOrdemModalAberto(false)}
      />

      {/* Modal de Visualização/Edição */}
      <OrdemServicoModal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        ordemId={ordemSelecionada}
        modo={modoModal}
      />

      {/* Modal de QR Code */}
      {ordemSelecionada && (
        <QRCodeModal
          isOpen={qrModalAberto}
          onClose={() => setQrModalAberto(false)}
          type="service_order"
          id={String(ordemSelecionada)}
          title={`OS #${filteredOrdens.find(o => Number(o.id) === ordemSelecionada)?.numero || ordemSelecionada}`}
          details={[
            { 
              label: 'Artigo', 
              value: filteredOrdens.find(o => Number(o.id) === ordemSelecionada)?.artigo || 'N/A' 
            },
            { 
              label: 'Status', 
              value: statusLabels[filteredOrdens.find(o => Number(o.id) === ordemSelecionada)?.status as keyof typeof statusLabels] || 'N/A'
            },
            { 
              label: 'Valor', 
              value: formatarMoeda(filteredOrdens.find(o => Number(o.id) === ordemSelecionada)?.valor_total || 0)
            }
          ]}
        />
      )}
    </div>
  );
};
