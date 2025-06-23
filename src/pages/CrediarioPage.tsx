import React, { useState, useMemo } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CreditCard, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle2, 
  User, 
  Phone, 
  Calendar,
  Search,
  MessageCircle
} from 'lucide-react';
import { useCrediario, useCrediarioVencido, usePagarCrediario } from '@/hooks/useVendas';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CreditSaleStatus, CreditSaleWithRelations } from '@/types/database';
import { toast } from 'sonner';

export const CrediarioPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [vencimentoFilter, setVencimentoFilter] = useState<string>('todos');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedCrediario, setSelectedCrediario] = useState<CreditSaleWithRelations | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');

  const { data: crediarios, isLoading } = useCrediario();
  const { data: vencidos } = useCrediarioVencido();
  const makePayment = usePagarCrediario();

  // Calcular estatísticas
  const stats = useMemo(() => {
    if (!crediarios) return { totalDevedores: 0, totalPendente: 0, totalVencido: 0, totalPago: 0 };

    const devedoresPendentes = crediarios.filter(c => c.status === 'open');
    const totalPendente = devedoresPendentes.reduce((sum, c) => sum + c.balance_due, 0);
    const totalVencido = vencidos ? vencidos.reduce((sum, c) => sum + c.balance_due, 0) : 0;
    const totalPago = crediarios.reduce((sum, c) => sum + c.amount_paid, 0);

    return {
      totalDevedores: devedoresPendentes.length,
      totalPendente,
      totalVencido,
      totalPago
    };
  }, [crediarios, vencidos]);

  // Filtros
  const crediariosFiltrados = useMemo(() => {
    if (!crediarios) return [];

    return crediarios.filter(crediario => {
      // Filtro de busca (nome do cliente)
      const matchesSearch = searchTerm === '' || 
        crediario.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        crediario.client?.phone?.includes(searchTerm);

      // Filtro de status
      const matchesStatus = statusFilter === 'todos' || crediario.status === statusFilter;

      // Filtro de vencimento
      let matchesVencimento = true;
      if (vencimentoFilter !== 'todos') {
        const today = new Date();
        const dueDate = new Date(crediario.due_date);
        
        switch (vencimentoFilter) {
          case 'vencido':
            matchesVencimento = dueDate < today && crediario.status === 'open';
            break;
          case 'vencendo':
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            matchesVencimento = dueDate <= nextWeek && dueDate >= today && crediario.status === 'open';
            break;
          case 'futuro':
            const oneWeekFromNow = new Date();
            oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
            matchesVencimento = dueDate > oneWeekFromNow && crediario.status === 'open';
            break;
        }
      }

      return matchesSearch && matchesStatus && matchesVencimento;
    });
  }, [crediarios, searchTerm, statusFilter, vencimentoFilter]);

  const getStatusBadge = (status: CreditSaleStatus, dueDate: string) => {
    const today = new Date();
    const dueDateObj = new Date(dueDate);
    const isOverdue = dueDateObj < today && status === 'open';

    if (status === 'paid') {
      return <Badge variant="default" className="bg-green-100 text-green-800">Quitado</Badge>;
    }

    if (isOverdue) {
      return <Badge variant="destructive">Vencido</Badge>;
    }

    if (status === 'open') {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
    }

    return <Badge variant="outline">Desconhecido</Badge>;
  };

  const handlePayment = (crediario: any, type: 'full' | 'partial') => {
    setSelectedCrediario(crediario);
    if (type === 'full') {
      setPaymentAmount(crediario.balance_due.toString());
    } else {
      setPaymentAmount('');
    }
    setPaymentModalOpen(true);
  };

  const processPayment = async () => {
    if (!selectedCrediario || !paymentAmount) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Valor inválido');
      return;
    }

    if (amount > selectedCrediario.balance_due) {
      toast.error('Valor não pode ser maior que o saldo devedor');
      return;
    }

    try {
      await makePayment.mutateAsync({
        creditSaleId: selectedCrediario.id.toString(),
        paymentAmount: amount
      });
      
      setPaymentModalOpen(false);
      setSelectedCrediario(null);
      setPaymentAmount('');
      toast.success('Pagamento registrado com sucesso!');
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
    }
  };

  const getDaysOverdue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <PageHeader
          title="Crediário"
          subtitle="Controle de vendas a prazo e cobranças"
        />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Crediário"
        subtitle="Controle de vendas a prazo e cobranças"
      />

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Devedores Ativos</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDevedores}</div>
            <p className="text-xs text-muted-foreground">clientes devendo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendente</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalPendente)}</div>
            <p className="text-xs text-muted-foreground">a receber</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencido</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalVencido)}</div>
            <p className="text-xs text-muted-foreground">em atraso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalPago)}</div>
            <p className="text-xs text-muted-foreground">já recebido</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Buscar cliente</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Nome ou telefone do cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="w-full lg:w-48">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Quitado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full lg:w-48">
              <Label>Vencimento</Label>
              <Select value={vencimentoFilter} onValueChange={setVencimentoFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="vencido">Vencidos</SelectItem>
                  <SelectItem value="vencendo">Vencendo (7 dias)</SelectItem>
                  <SelectItem value="futuro">Em dia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Crediários */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Lista de Devedores
            {crediariosFiltrados.length > 0 && (
              <Badge variant="secondary">{crediariosFiltrados.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {crediariosFiltrados.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  {searchTerm.trim() || statusFilter !== 'todos' || vencimentoFilter !== 'todos'
                    ? 'Nenhum registro encontrado com os filtros aplicados'
                    : 'Nenhum crediário registrado'
                  }
                </p>
              </div>
            ) : (
              crediariosFiltrados.map((crediario) => {
                const daysOverdue = getDaysOverdue(crediario.due_date);
                const isOverdue = daysOverdue > 0 && crediario.status === 'open';

                return (
                  <Card key={crediario.id} className={`${isOverdue ? 'border-red-200 bg-red-50' : ''}`}>
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Informações do Cliente */}
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="font-medium text-lg">
                              {crediario.client?.name || 'Cliente não informado'}
                            </span>
                            {getStatusBadge(crediario.status, crediario.due_date)}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            {crediario.client?.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                <span>{crediario.client.phone}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>Venc: {formatDate(crediario.due_date)}</span>
                              {isOverdue && (
                                <span className="text-red-600 font-medium">
                                  ({daysOverdue} dias em atraso)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Valores */}
                        <div className="lg:text-right space-y-1">
                          <div className="text-sm text-gray-600">
                            Total: <span className="font-medium">{formatCurrency(crediario.total_amount_due)}</span>
                          </div>
                          <div className="text-sm text-green-600">
                            Pago: <span className="font-medium">{formatCurrency(crediario.amount_paid)}</span>
                          </div>
                          <div className="text-lg font-bold text-red-600">
                            Restante: {formatCurrency(crediario.balance_due)}
                          </div>
                        </div>

                        {/* Ações */}
                        {crediario.status === 'open' && (
                          <div className="flex flex-col lg:flex-row gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePayment(crediario, 'partial')}
                              disabled={makePayment.isPending}
                            >
                              <DollarSign className="h-4 w-4 mr-1" />
                              Pagamento
                            </Button>
                            
                            <Button
                              size="sm"
                              onClick={() => handlePayment(crediario, 'full')}
                              disabled={makePayment.isPending}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Quitar
                            </Button>

                            {crediario.client?.phone && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const message = `Olá ${crediario.client?.name}, você tem um valor pendente de ${formatCurrency(crediario.balance_due)} com vencimento em ${formatDate(crediario.due_date)}. Entre em contato para acertar o pagamento.`;
                                  const whatsappUrl = `https://wa.me/55${crediario.client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
                                  window.open(whatsappUrl, '_blank');
                                }}
                              >
                                <MessageCircle className="h-4 w-4 mr-1" />
                                WhatsApp
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Pagamento */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
            <DialogDescription>
              Cliente: {selectedCrediario?.client?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-gray-600">Valor Total</Label>
                <div className="font-medium">{formatCurrency(selectedCrediario?.total_amount_due || 0)}</div>
              </div>
              <div>
                <Label className="text-gray-600">Já Pago</Label>
                <div className="font-medium text-green-600">{formatCurrency(selectedCrediario?.amount_paid || 0)}</div>
              </div>
              <div>
                <Label className="text-gray-600">Saldo Devedor</Label>
                <div className="font-medium text-red-600">{formatCurrency(selectedCrediario?.balance_due || 0)}</div>
              </div>
              <div>
                <Label className="text-gray-600">Vencimento</Label>
                <div className="font-medium">{formatDate(selectedCrediario?.due_date || '')}</div>
              </div>
            </div>

            <Separator />

            <div>
              <Label htmlFor="payment-amount">Valor do Pagamento *</Label>
              <Input
                id="payment-amount"
                type="number"
                step="0.01"
                min="0.01"
                max={selectedCrediario?.balance_due || 0}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0,00"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={processPayment}
              disabled={!paymentAmount || parseFloat(paymentAmount) <= 0 || makePayment.isPending}
            >
              {makePayment.isPending ? 'Processando...' : 'Registrar Pagamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 