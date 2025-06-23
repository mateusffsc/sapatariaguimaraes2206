import React, { useState } from 'react';
import { 
  useTechniciansDashboard,
  useSearchTechnicians,
  useTechnicianFilters,
  useDeleteTechnician,
  useToggleTechnicianStatus,
  useTechnicianValidation
} from '@/hooks/useTechnicians';
import { TecnicoModal } from '@/components/modals/TecnicoModal';
import { Technician } from '@/types/database';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Power,
  User,
  Users,
  Star,
  Briefcase,
  Clock,
  TrendingUp,
  Award,
  Activity
} from 'lucide-react';

export function TecnicosPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTechnician, setEditingTechnician] = useState<Technician | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [technicianToDelete, setTechnicianToDelete] = useState<Technician | undefined>();

  const { 
    technicians, 
    overallStats, 
    workload, 
    specialties, 
    isLoading 
  } = useTechniciansDashboard();

  const { 
    searchTerm, 
    setSearchTerm, 
    searchResults, 
    isSearching, 
    hasResults 
  } = useSearchTechnicians();

  const { 
    filters, 
    setFilters, 
    filteredTechnicians, 
    specialties: availableSpecialties 
  } = useTechnicianFilters();

  const { formatHourlyRate, formatRating, calculateExperience } = useTechnicianValidation();

  const deleteTechnician = useDeleteTechnician();
  const toggleStatus = useToggleTechnicianStatus();

  // Determinar quais técnicos mostrar
  const displayTechnicians = hasResults ? searchResults : filteredTechnicians;

  const handleEdit = (technician: Technician) => {
    setEditingTechnician(technician);
    setModalOpen(true);
  };

  const handleDelete = (technician: Technician) => {
    setTechnicianToDelete(technician);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (technicianToDelete) {
      await deleteTechnician.mutateAsync(technicianToDelete.id.toString());
      setDeleteDialogOpen(false);
      setTechnicianToDelete(undefined);
    }
  };

  const handleToggleStatus = async (technician: Technician) => {
    await toggleStatus.mutateAsync(technician.id.toString());
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingTechnician(undefined);
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
        title="Gerenciar Técnicos"
        subtitle="Cadastre e gerencie a equipe de técnicos da sua sapataria"
      />

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Técnicos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats?.totalTechnicians || 0}</div>
            <p className="text-xs text-muted-foreground">
              {overallStats?.activeTechnicians || 0} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Melhor Performer</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">
              {overallStats?.topPerformer?.name || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {overallStats?.topPerformer ? 
                formatRating(overallStats.topPerformer.rating) : 
                'Sem avaliação'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avaliação Média</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatRating(overallStats?.averageRating)}
            </div>
            <p className="text-xs text-muted-foreference">
              Satisfação geral
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Carga de Trabalho</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats?.totalWorkload || 0}</div>
            <p className="text-xs text-muted-foreference">
              Ordens pendentes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Carga de trabalho por técnico */}
      {workload.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Distribuição de Carga de Trabalho
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workload.slice(0, 5).map((item) => (
                <div key={item.technician.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.technician.name}</span>
                      <Badge variant={item.technician.active ? "default" : "secondary"}>
                        {item.technician.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{item.totalWorkload} ordens</span>
                      <span>{Math.round(item.estimatedWorkTime / 60)}h estimadas</span>
                    </div>
                  </div>
                  <Progress 
                    value={Math.min((item.totalWorkload / Math.max(...workload.map(w => w.totalWorkload))) * 100, 100)} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Barra de ações */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Busca */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar técnicos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtros */}
          <div className="flex gap-2">
            <Select
              value={filters.specialty}
              onValueChange={(value) => setFilters(prev => ({ ...prev, specialty: value }))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Especialidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as especialidades</SelectItem>
                {availableSpecialties.map((specialty) => (
                  <SelectItem key={specialty} value={specialty}>
                    {specialty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.active}
              onValueChange={(value) => setFilters(prev => ({ 
                ...prev, 
                active: value as 'all' | 'active' | 'inactive' 
              }))}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={() => setModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Técnico
        </Button>
      </div>

      {/* Tabela de técnicos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Técnicos 
            <Badge variant="secondary">
              {displayTechnicians.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Especialidades</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Avaliação</TableHead>
                <TableHead>Experiência</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayTechnicians.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {hasResults && searchTerm ? 
                      `Nenhum técnico encontrado para "${searchTerm}"` :
                      'Nenhum técnico cadastrado'
                    }
                  </TableCell>
                </TableRow>
              ) : (
                displayTechnicians.map((technician) => (
                  <TableRow key={technician.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{technician.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {technician.phone || technician.email || 'Sem contato'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {technician.specialties?.slice(0, 2).map((specialty) => (
                          <Badge key={specialty} variant="outline" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                        {(technician.specialties?.length || 0) > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{(technician.specialties?.length || 0) - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {technician.phone && <div>{technician.phone}</div>}
                        {technician.email && <div className="text-muted-foreground">{technician.email}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span>{formatRating(technician.rating)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {technician.hire_date ? (
                        <div className="text-sm">
                          {calculateExperience(technician.hire_date)} anos
                        </div>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={technician.active ? "default" : "secondary"}>
                        {technician.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(technician)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(technician)}>
                            <Power className="mr-2 h-4 w-4" />
                            {technician.active ? 'Desativar' : 'Ativar'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(technician)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de técnico */}
      <TecnicoModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        tecnico={editingTechnician}
        mode={editingTechnician ? 'edit' : 'create'}
      />

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Técnico</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o técnico "{technicianToDelete?.name}"?
              Esta ação não pode ser desfeita e pode afetar ordens de serviço existentes.
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