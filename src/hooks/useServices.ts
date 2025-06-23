import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ServiceTypeService, SERVICE_CATEGORIES } from '@/services/serviceTypeService';
import { Service, CreateService, UpdateService } from '@/types/database';
import { toast } from 'sonner';

// Hook para listar todos os serviços
export function useServices() {
  return useQuery({
    queryKey: ['services'],
    queryFn: ServiceTypeService.getAllServices,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

// Hook para serviços ativos
export function useActiveServices() {
  return useQuery({
    queryKey: ['services', 'active'],
    queryFn: ServiceTypeService.getActiveServices,
    staleTime: 1000 * 60 * 5,
  });
}

// Hook para buscar serviço específico
export function useService(id: string) {
  return useQuery({
    queryKey: ['services', id],
    queryFn: () => ServiceTypeService.getServiceById(id),
    enabled: !!id,
  });
}

// Hook para estatísticas de serviços
export function useServiceStats() {
  return useQuery({
    queryKey: ['services', 'stats'],
    queryFn: ServiceTypeService.getServiceStats,
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
}

// Hook para categorias com contadores
export function useServiceCategories() {
  return useQuery({
    queryKey: ['services', 'categories'],
    queryFn: ServiceTypeService.getCategoriesWithCounts,
    staleTime: 1000 * 60 * 5,
  });
}

// Hook para criar serviço
export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (serviceData: CreateService) => ServiceTypeService.createService(serviceData),
    onSuccess: (newService) => {
      // Invalidar cache
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Serviço criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar serviço: ${error.message || 'Erro desconhecido'}`);
    },
  });
}

// Hook para atualizar serviço
export function useUpdateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateService }) => 
      ServiceTypeService.updateService(id, updates),
    onSuccess: (updatedService) => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.setQueryData(['services', updatedService.id.toString()], updatedService);
      toast.success('Serviço atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar serviço: ${error.message || 'Erro desconhecido'}`);
    },
  });
}

// Hook para deletar serviço
export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ServiceTypeService.deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Serviço removido com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover serviço: ${error.message || 'Erro desconhecido'}`);
    },
  });
}

// Hook para alternar status do serviço
export function useToggleServiceStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ServiceTypeService.toggleServiceStatus(id),
    onSuccess: (updatedService) => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.setQueryData(['services', updatedService.id.toString()], updatedService);
      const status = updatedService.active ? 'ativado' : 'desativado';
      toast.success(`Serviço ${status} com sucesso!`);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao alterar status: ${error.message || 'Erro desconhecido'}`);
    },
  });
}

// Hook para duplicar serviço
export function useDuplicateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ServiceTypeService.duplicateService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Serviço duplicado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao duplicar serviço: ${error.message || 'Erro desconhecido'}`);
    },
  });
}

// Hook para busca de serviços
export function useSearchServices() {
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
    queryKey: ['services', 'search', debouncedTerm],
    queryFn: () => ServiceTypeService.searchServices(debouncedTerm),
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

// Hook para filtros de serviços
export function useServiceFilters() {
  const [filters, setFilters] = useState({
    category: '',
    active: 'all' as 'all' | 'active' | 'inactive',
    priceRange: { min: 0, max: 1000 } as { min: number; max: number },
  });

  const { data: allServices = [] } = useServices();

  const filteredServices = allServices.filter(service => {
    // Filtro por categoria
          if (filters.category && filters.category !== 'todas' && service.category !== filters.category) {
      return false;
    }

    // Filtro por status
    if (filters.active === 'active' && !service.active) {
      return false;
    }
    if (filters.active === 'inactive' && service.active) {
      return false;
    }

    // Filtro por faixa de preço
    if (service.price < filters.priceRange.min || service.price > filters.priceRange.max) {
      return false;
    }

    return true;
  });

  return {
    filters,
    setFilters,
    filteredServices,
    categories: SERVICE_CATEGORIES,
  };
}

// Hook para relatório de uso de serviços
export function useServiceUsageReport(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['services', 'usage-report', startDate, endDate],
    queryFn: () => ServiceTypeService.getServiceUsageReport(startDate, endDate),
    enabled: !!startDate && !!endDate,
    staleTime: 1000 * 60 * 15, // 15 minutos
  });
}

// Hook para componentes de custo de um serviço
export function useServiceCostComponents(serviceId: string) {
  return useQuery({
    queryKey: ['services', serviceId, 'cost-components'],
    queryFn: () => ServiceTypeService.getServiceCostComponents(serviceId),
    enabled: !!serviceId,
  });
}

// Hook composto para dashboard de serviços
export function useServicesDashboard() {
  const servicesQuery = useServices();
  const statsQuery = useServiceStats();
  const categoriesQuery = useServiceCategories();

  return {
    services: servicesQuery.data || [],
    stats: statsQuery.data,
    categories: categoriesQuery.data || [],
    isLoading: servicesQuery.isLoading || statsQuery.isLoading || categoriesQuery.isLoading,
    error: servicesQuery.error || statsQuery.error || categoriesQuery.error,
  };
}

// Hook para validação de dados de serviço
export function useServiceValidation() {
  const validateService = (serviceData: CreateService | UpdateService) => {
    return ServiceTypeService.validateServiceData(serviceData);
  };

  const formatPrice = (price: number) => {
    return ServiceTypeService.formatPrice(price);
  };

  const formatTime = (minutes?: number) => {
    return ServiceTypeService.formatEstimatedTime(minutes);
  };

  return {
    validateService,
    formatPrice,
    formatTime,
    categories: SERVICE_CATEGORIES,
  };
} 