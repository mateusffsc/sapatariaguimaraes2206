import React, { useState } from 'react';
import { Plus, Package, Search, MoreHorizontal, Eye, Truck, CheckCircle, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/layout/PageHeader';
import { PedidoCompraModal } from '@/components/modals/PedidoCompraModal';
import { 
  usePurchaseOrders, 
  usePurchaseOrderStats,
  useUpdatePurchaseOrderStatus
} from '@/hooks/usePurchaseOrders';
import { formatDate, formatCurrency } from '@/lib/utils';

export function ComprasPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Hooks
  const { data: orders = [], isLoading, error } = usePurchaseOrders();
  const { data: stats } = usePurchaseOrderStats();
  const updateStatus = useUpdatePurchaseOrderStatus();

  // Filtrar pedidos
  const filteredOrders = orders.filter(order => {
    const matchesSearch = !searchTerm || 
      order.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Handlers
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    await updateStatus.mutateAsync({ id: orderId, status: newStatus });
  };

  // Status badge
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Rascunho', variant: 'secondary' as const },
      sent: { label: 'Enviado', variant: 'default' as const },
      approved: { label: 'Aprovado', variant: 'default' as const },
      received: { label: 'Recebido', variant: 'default' as const },
      cancelled: { label: 'Cancelado', variant: 'destructive' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">Erro ao carregar pedidos: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <PageHeader
        title="Gestão de Compras"
      />

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Pedidos</p>
                <p className="text-2xl font-bold">
                  {stats?.totalOrders || 0}
                </p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold">
                  {stats?.pendingOrders || 0}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recebidos</p>
                <p className="text-2xl font-bold">
                  {stats?.receivedOrders || 0}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valor Total</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats?.totalAmount || 0)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Ações */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Pedidos de Compra</CardTitle>
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Pedido
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por fornecedor ou observações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="sent">Enviado</SelectItem>
                <SelectItem value="approved">Aprovado</SelectItem>
                <SelectItem value="received">Recebido</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabela */}
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Data do Pedido</TableHead>
                  <TableHead>Data Prevista</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Package className="h-8 w-8 text-gray-400" />
                        <p className="text-gray-500">
                          {searchTerm || statusFilter !== 'all' 
                            ? 'Nenhum pedido encontrado com os filtros aplicados' 
                            : 'Nenhum pedido de compra encontrado'
                          }
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        #{order.id}
                      </TableCell>
                      <TableCell>
                        {order.supplier?.name || 'Fornecedor não informado'}
                      </TableCell>
                      <TableCell>
                        {formatDate(order.order_date)}
                      </TableCell>
                      <TableCell>
                        {order.expected_delivery_date 
                          ? formatDate(order.expected_delivery_date)
                          : 'Não informada'
                        }
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(order.status)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(order.total_amount)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            
                            {order.status === 'draft' && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(order.id.toString(), 'sent')}>
                                <Truck className="mr-2 h-4 w-4" />
                                Enviar Pedido
                              </DropdownMenuItem>
                            )}
                            
                            {order.status === 'sent' && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(order.id.toString(), 'approved')}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Marcar como Aprovado
                              </DropdownMenuItem>
                            )}
                            
                            {['sent', 'approved'].includes(order.status) && (
                              <DropdownMenuItem>
                                <Package className="mr-2 h-4 w-4" />
                                Receber Mercadorias
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuSeparator />
                            
                            {order.status !== 'received' && order.status !== 'cancelled' && (
                              <DropdownMenuItem 
                                onClick={() => handleUpdateStatus(order.id.toString(), 'cancelled')}
                                className="text-red-600"
                              >
                                Cancelar Pedido
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <PedidoCompraModal
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
} 