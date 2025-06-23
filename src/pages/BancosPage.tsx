import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Plus, 
  Search, 
  MoreHorizontal,
  Edit,
  Trash2,
  Banknote,
  Building,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

// Dados mockados - substituir por dados reais do Supabase
const mockBanks = [
  {
    id: 1,
    name: 'Conta Principal',
    bank_name: 'Banco do Brasil',
    account_number: '12345-6',
    initial_balance: 10000.00,
    current_balance: 8750.50,
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 2,
    name: 'Conta Corrente',
    bank_name: 'Caixa Econômica',
    account_number: '98765-4',
    initial_balance: 5000.00,
    current_balance: 12300.75,
    created_at: '2024-02-10T14:30:00Z'
  },
  {
    id: 3,
    name: 'Conta Poupança',
    bank_name: 'Itaú',
    account_number: '55555-1',
    initial_balance: 15000.00,
    current_balance: 18500.25,
    created_at: '2024-01-20T09:15:00Z'
  }
];

export function BancosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<any>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bankToDelete, setBankToDelete] = useState<any>(undefined);

  // Mock data - substituir por hooks reais
  const banks = mockBanks;
  const isLoading = false;

  // Filtros
  const filteredBanks = banks.filter(bank =>
    bank.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bank.bank_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bank.account_number.includes(searchTerm)
  );

  // Calcular estatísticas
  const totalBalance = banks.reduce((sum, bank) => sum + bank.current_balance, 0);
  const totalInitial = banks.reduce((sum, bank) => sum + bank.initial_balance, 0);
  const variation = totalBalance - totalInitial;
  const percentageChange = totalInitial > 0 ? (variation / totalInitial) * 100 : 0;

  const handleEdit = (bank: any) => {
    setEditingBank(bank);
    setModalOpen(true);
  };

  const handleDelete = (bank: any) => {
    setBankToDelete(bank);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (bankToDelete) {
      // Implementar exclusão
      console.log('Deletar banco:', bankToDelete.id);
      setDeleteDialogOpen(false);
      setBankToDelete(undefined);
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingBank(undefined);
  };

  const getBalanceVariation = (bank: any) => {
    const variation = bank.current_balance - bank.initial_balance;
    return {
      value: variation,
      percentage: bank.initial_balance > 0 ? (variation / bank.initial_balance) * 100 : 0,
      isPositive: variation >= 0
    };
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gerenciar Bancos"
        subtitle="Controle as contas bancárias e movimentações financeiras"
      />

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Contas</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{banks.length}</div>
            <p className="text-xs text-muted-foreground">
              contas cadastradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
            <p className="text-xs text-muted-foreground">
              em todas as contas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Variação Total</CardTitle>
            {variation >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${variation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(Math.abs(variation))}
            </div>
            <p className="text-xs text-muted-foreground">
              {variation >= 0 ? '+' : '-'}{Math.abs(percentageChange).toFixed(1)}% do inicial
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Inicial</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalInitial)}</div>
            <p className="text-xs text-muted-foreground">
              capital inicial
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e busca */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar bancos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full sm:w-80"
          />
        </div>

        <Button onClick={() => setModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Conta
        </Button>
      </div>

      {/* Tabela de bancos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Contas Bancárias
            <Badge variant="secondary">
              {filteredBanks.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Conta</TableHead>
                <TableHead>Banco</TableHead>
                <TableHead>Número da Conta</TableHead>
                <TableHead>Saldo Inicial</TableHead>
                <TableHead>Saldo Atual</TableHead>
                <TableHead>Variação</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBanks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 
                      `Nenhuma conta encontrada para "${searchTerm}"` :
                      'Nenhuma conta bancária cadastrada'
                    }
                  </TableCell>
                </TableRow>
              ) : (
                filteredBanks.map((bank) => {
                  const variation = getBalanceVariation(bank);
                  
                  return (
                    <TableRow key={bank.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{bank.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Criada em {new Date(bank.created_at).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-gray-500" />
                          {bank.bank_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                          {bank.account_number}
                        </code>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono">
                          {formatCurrency(bank.initial_balance)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono font-medium">
                          {formatCurrency(bank.current_balance)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {variation.isPositive ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                          <span className={`font-mono text-sm ${
                            variation.isPositive ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {variation.isPositive ? '+' : ''}{formatCurrency(variation.value)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({variation.isPositive ? '+' : ''}{variation.percentage.toFixed(1)}%)
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(bank)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(bank)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de banco */}
      {/* TODO: Implementar BancoModal */}

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Conta Bancária</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a conta "{bankToDelete?.name}"?
              Esta ação não pode ser desfeita e pode afetar o histórico financeiro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 