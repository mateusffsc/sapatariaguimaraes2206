import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TechnicianService, TECHNICIAN_SPECIALTIES } from '@/services/technicianService';
import { Technician, CreateTechnician, UpdateTechnician } from '@/types/database';
import { toast } from 'sonner';

// Hook para listar todos os técnicos
export function useTechnicians() {
  return useQuery({
    queryKey: ['technicians'],
    queryFn: TechnicianService.getAllTechnicians,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

// Hook para técnicos ativos
export function useActiveTechnicians() {
  return useQuery({
    queryKey: ['technicians', 'active'],
    queryFn: TechnicianService.getActiveTechnicians,
    staleTime: 1000 * 60 * 5,
  });
}

// Hook para buscar técnico específico
export function useTechnician(id: string) {
  return useQuery({
    queryKey: ['technicians', id],
    queryFn: () => TechnicianService.getTechnicianById(id),
    enabled: !!id,
  });
}

// Hook para estatísticas de um técnico específico
export function useTechnicianStats(id: string) {
  return useQuery({
    queryKey: ['technicians', id, 'stats'],
    queryFn: () => TechnicianService.getTechnicianStats(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
}

// Hook para estatísticas gerais dos técnicos
export function useTechniciansOverallStats() {
  return useQuery({
    queryKey: ['technicians', 'overall-stats'],
    queryFn: TechnicianService.getTechniciansOverallStats,
    staleTime: 1000 * 60 * 10,
  });
}

// Hook para carga de trabalho dos técnicos
export function useTechnicianWorkload() {
  return useQuery({
    queryKey: ['technicians', 'workload'],
    queryFn: TechnicianService.getTechnicianWorkload,
    staleTime: 1000 * 60 * 5,
  });
}

// Hook para especialidades com contadores
export function useTechnicianSpecialties() {
  return useQuery({
    queryKey: ['technicians', 'specialties'],
    queryFn: TechnicianService.getSpecialtiesWithCounts,
    staleTime: 1000 * 60 * 5,
  });
}

// Hook para criar técnico
export function useCreateTechnician() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (technicianData: CreateTechnician) => TechnicianService.createTechnician(technicianData),
    onSuccess: (newTechnician) => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      toast.success('Técnico cadastrado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao cadastrar técnico: ${error.message || 'Erro desconhecido'}`);
    },
  });
}

// Hook para atualizar técnico
export function useUpdateTechnician() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateTechnician }) => 
      TechnicianService.updateTechnician(id, updates),
    onSuccess: (updatedTechnician) => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      queryClient.setQueryData(['technicians', updatedTechnician.id.toString()], updatedTechnician);
      toast.success('Técnico atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar técnico: ${error.message || 'Erro desconhecido'}`);
    },
  });
}

// Hook para deletar técnico
export function useDeleteTechnician() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => TechnicianService.deleteTechnician(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      toast.success('Técnico removido com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover técnico: ${error.message || 'Erro desconhecido'}`);
    },
  });
}

// Hook para alternar status do técnico
export function useToggleTechnicianStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => TechnicianService.toggleTechnicianStatus(id),
    onSuccess: (updatedTechnician) => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      queryClient.setQueryData(['technicians', updatedTechnician.id.toString()], updatedTechnician);
      const status = updatedTechnician.active ? 'ativado' : 'desativado';
      toast.success(`Técnico ${status} com sucesso!`);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao alterar status: ${error.message || 'Erro desconhecido'}`);
    },
  });
}

// Hook para atualizar avaliação do técnico
export function useUpdateTechnicianRating() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, rating }: { id: string; rating: number }) => 
      TechnicianService.updateTechnicianRating(id, rating),
    onSuccess: (updatedTechnician) => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      queryClient.setQueryData(['technicians', updatedTechnician.id.toString()], updatedTechnician);
      toast.success('Avaliação atualizada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar avaliação: ${error.message || 'Erro desconhecido'}`);
    },
  });
}

// Hook para busca de técnicos
export function useSearchTechnicians() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');

  // Debounce do termo de busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const searchQuery = useQuery({
    queryKey: ['technicians', 'search', debouncedTerm],
    queryFn: () => TechnicianService.searchTechnicians(debouncedTerm),
    enabled: debouncedTerm.length > 0,
  });

  return {
    searchTerm,
    setSearchTerm,
    searchResults: searchQuery.data || [],
    isSearching: searchQuery.isFetching,
    hasResults: debouncedTerm.length > 0,
  };
}

// Hook para filtros de técnicos
export function useTechnicianFilters() {
  const [filters, setFilters] = useState({
    specialty: '',
    active: 'all' as 'all' | 'active' | 'inactive',
    ratingRange: { min: 0, max: 5 } as { min: number; max: number },
  });

  const { data: allTechnicians = [] } = useTechnicians();

  const filteredTechnicians = allTechnicians.filter(technician => {
    // Filtro por especialidade
          if (filters.specialty && filters.specialty !== 'todas' && !technician.specialties?.includes(filters.specialty)) {
      return false;
    }

    // Filtro por status
    if (filters.active === 'active' && !technician.active) {
      return false;
    }
    if (filters.active === 'inactive' && technician.active) {
      return false;
    }

    // Filtro por faixa de avaliação
    const rating = technician.rating || 0;
    if (rating < filters.ratingRange.min || rating > filters.ratingRange.max) {
      return false;
    }

    return true;
  });

  return {
    filters,
    setFilters,
    filteredTechnicians,
    specialties: TECHNICIAN_SPECIALTIES,
  };
}

// Hook para técnicos por especialidade
export function useTechniciansBySpecialty(specialty: string) {
  return useQuery({
    queryKey: ['technicians', 'specialty', specialty],
    queryFn: () => TechnicianService.getTechniciansBySpecialty(specialty),
    enabled: !!specialty,
    staleTime: 1000 * 60 * 5,
  });
}

// Hook para relatório de performance
export function useTechnicianPerformanceReport(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['technicians', 'performance-report', startDate, endDate],
    queryFn: () => TechnicianService.getTechnicianPerformanceReport(startDate, endDate),
    enabled: !!startDate && !!endDate,
    staleTime: 1000 * 60 * 15, // 15 minutos
  });
}

// Hook composto para dashboard de técnicos
export function useTechniciansDashboard() {
  const techniciansQuery = useTechnicians();
  const overallStatsQuery = useTechniciansOverallStats();
  const workloadQuery = useTechnicianWorkload();
  const specialtiesQuery = useTechnicianSpecialties();

  return {
    technicians: techniciansQuery.data || [],
    overallStats: overallStatsQuery.data,
    workload: workloadQuery.data || [],
    specialties: specialtiesQuery.data || [],
    isLoading: techniciansQuery.isLoading || overallStatsQuery.isLoading || workloadQuery.isLoading,
    error: techniciansQuery.error || overallStatsQuery.error || workloadQuery.error,
  };
}

// Hook para validação de dados de técnico
export function useTechnicianValidation() {
  const validateTechnician = (technicianData: CreateTechnician | UpdateTechnician) => {
    return TechnicianService.validateTechnicianData(technicianData);
  };

  const formatHourlyRate = (rate?: number) => {
    return TechnicianService.formatHourlyRate(rate);
  };

  const formatRating = (rating?: number) => {
    return TechnicianService.formatRating(rating);
  };

  const calculateExperience = (hireDate?: string) => {
    return TechnicianService.calculateExperienceYears(hireDate);
  };

  return {
    validateTechnician,
    formatHourlyRate,
    formatRating,
    calculateExperience,
    specialties: TECHNICIAN_SPECIALTIES,
  };
}

// Hook para técnicos com menos carga de trabalho (para otimização de distribuição)
export function useAvailableTechnicians() {
  const { data: workload = [] } = useTechnicianWorkload();
  
  // Ordenar por menor carga de trabalho
  const availableTechnicians = workload
    .filter(item => item.technician.active)
    .sort((a, b) => a.totalWorkload - b.totalWorkload)
    .slice(0, 5); // Top 5 mais disponíveis

  return {
    availableTechnicians,
    isLoading: !workload.length,
  };
}

// Hook para técnicos especialistas em um serviço específico
export function useSpecialistTechnicians(serviceCategory: string) {
  const { data: allTechnicians = [] } = useActiveTechnicians();
  
  // Mapear categorias de serviço para especialidades de técnico
  const specialtyMapping: Record<string, string[]> = {
    'Reparo de Calçados': ['Reparo de Solado', 'Troca de Salto', 'Conserto de Zíper', 'Reparo de Couro'],
    'Confecção de Calçados': ['Confecção sob Medida', 'Ortopedia'],
    'Limpeza e Conservação': ['Limpeza Profunda', 'Tingimento'],
    'Customização': ['Customização', 'Bordado/Decoração'],
    'Consultoria': ['Ortopedia'],
    'Outros': ['Outros']
  };

  const relevantSpecialties = specialtyMapping[serviceCategory] || [];
  
  const specialists = allTechnicians.filter(technician => 
    technician.specialties?.some(specialty => 
      relevantSpecialties.includes(specialty)
    )
  );

  return {
    specialists,
    hasSpecialists: specialists.length > 0,
  };
} 