import React, { useState } from 'react';
import { Plus, Building2, Search, Filter, MoreHorizontal, Eye, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PageHeader } from '@/components/layout/PageHeader';
import { FornecedorModal } from '@/components/modals/FornecedorModal';
import { 
  useFornecedores, 
  useEstatisticasFornecedores, 
  useExcluirFornecedor, 
  useAlternarStatusFornecedor,
  useBuscarFornecedores 
} from '@/hooks/useFornecedores';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Supplier } from '@/types/database';

type ModalMode = 'create' | 'edit' | 'view';

export function FornecedoresPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [selectedFornecedorId, setSelectedFornecedorId] = useState<string>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fornecedorToDelete, setFornecedorToDelete] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Hooks
  const { data: fornecedores, isLoading, error } = useFornecedores();
  const { data: buscarResultados } = useBuscarFornecedores(searchTerm);
  const { data: estatisticas } = useEstatisticasFornecedores();
  const excluirFornecedor = useExcluirFornecedor();
  const alternarStatus = useAlternarStatusFornecedor();

  // Dados para exibição
  const dadosParaExibir = searchTerm.length > 2 ? (buscarResultados || []) : (fornecedores || []);

  // Handlers
  const handleOpenModal = (mode: ModalMode, fornecedorId?: string) => {
    setModalMode(mode);
    setSelectedFornecedorId(fornecedorId);
    setModalOpen(true);
  };

  const handleDeleteClick = (fornecedor: Supplier) => {
    setFornecedorToDelete(fornecedor);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (fornecedorToDelete) {
      await excluirFornecedor.mutateAsync(fornecedorToDelete.id.toString());
      setDeleteDialogOpen(false);
      setFornecedorToDelete(null);
    }
  };

  const handleToggleStatus = async (fornecedor: Supplier) => {
    await alternarStatus.mutateAsync(fornecedor.id.toString());
  };

  const parseContactInfo = (contactInfo: string | null) => {
    if (!contactInfo) return { phone: '', email: '', address: '' };
    
    try {
      return JSON.parse(contactInfo);
    } catch {
      return { phone: contactInfo, email: '', address: '' };
    }
  };

  const renderStatCards = () => {
    if (!estatisticas) {
      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Fornecedores</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.totalSuppliers}</div>
            <p className="text-xs text-muted-foreground">
              {estatisticas.activeSuppliers} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contas a Pagar</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.totalAccountsPayable}</div>
            <p className="text-xs text-muted-foreground">contas registradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendente</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(estatisticas.pendingAmount)}</div>
            <p className="text-xs text-muted-foreground">em aberto</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Atraso</CardTitle>
            <Building2 className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(estatisticas.overdueAmount)}
            </div>
            <p className="text-xs text-muted-foreground">vencido</p>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderTableContent = () => {
    if (isLoading) {
      return (
        <TableBody>
          {[...Array(5)].map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-8 w-8" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      );
    }

    if (error) {
      return (
        <TableBody>
          <TableRow>
            <TableCell colSpan={5} className="text-center py-8">
              <p className="text-muted-foreground">Erro ao carregar fornecedores</p>
            </TableCell>
          </TableRow>
        </TableBody>
      );
    }

    if (dadosParaExibir.length === 0) {
      return (
        <TableBody>
          <TableRow>
            <TableCell colSpan={5} className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm ? 'Nenhum fornecedor encontrado' : 'Nenhum fornecedor cadastrado'}
              </p>
            </TableCell>
          </TableRow>
        </TableBody>
      );
    }

    return (
      <TableBody>
        {dadosParaExibir.map((fornecedor) => {
          const contact = parseContactInfo(fornecedor.contact_info);
          
          return (
            <TableRow key={fornecedor.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{fornecedor.name}</p>
                  {contact.phone && (
                    <p className="text-sm text-muted-foreground">{contact.phone}</p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {contact.email || contact.address ? (
                  <div className="text-sm">
                    {contact.email && <p>{contact.email}</p>}
                    {contact.address && <p className="text-muted-foreground">{contact.address}</p>}
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={(fornecedor.active ?? true) ? "default" : "secondary"}>
                  {(fornecedor.active ?? true) ? 'Ativo' : 'Inativo'}
                </Badge>
              </TableCell>
              <TableCell>
                <p className="text-sm">{formatDate(fornecedor.created_at)}</p>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleOpenModal('view', fornecedor.id.toString())}>
                      <Eye className="mr-2 h-4 w-4" />
                      Visualizar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleOpenModal('edit', fornecedor.id.toString())}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleToggleStatus(fornecedor)}>
                      {(fornecedor.active ?? true) ? (
                        <>
                          <ToggleLeft className="mr-2 h-4 w-4" />
                          Desativar
                        </>
                      ) : (
                        <>
                          <ToggleRight className="mr-2 h-4 w-4" />
                          Ativar
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleDeleteClick(fornecedor)}
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
        })}
      </TableBody>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fornecedores"
        subtitle="Gerencie seus fornecedores e controle de compras"
      />

      {renderStatCards()}

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <CardTitle>Lista de Fornecedores</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar fornecedores..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 min-w-[200px]"
                />
              </div>
              <Button onClick={() => handleOpenModal('create')}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Fornecedor
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cadastrado em</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            {renderTableContent()}
          </Table>
        </CardContent>
      </Card>

      <FornecedorModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        fornecedorId={selectedFornecedorId}
        mode={modalMode}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o fornecedor "{fornecedorToDelete?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
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