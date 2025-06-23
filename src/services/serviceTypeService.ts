import { supabase } from '@/lib/supabase';
import { Service, CreateService, UpdateService } from '@/types/database';

// Categorias predefinidas de serviços
export const SERVICE_CATEGORIES = [
  'Reparo de Calçados',
  'Confecção de Calçados',
  'Limpeza e Conservação',
  'Customização',
  'Consultoria',
  'Outros'
] as const;

export type ServiceCategory = typeof SERVICE_CATEGORIES[number];

export class ServiceTypeService {
  // ==================== CRUD BÁSICO ====================
  static async createService(serviceData: CreateService): Promise<Service> {
    try {
      const { data, error } = await supabase
        .from('services')
        .insert([{
          ...serviceData,
          active: serviceData.active ?? true
        }])
        .select('*')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao criar serviço:', error);
      throw new Error(`Falha ao criar serviço: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async getAllServices(): Promise<Service[]> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
      throw new Error(`Falha ao buscar serviços: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async getActiveServices(): Promise<Service[]> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar serviços ativos:', error);
      throw new Error(`Falha ao buscar serviços ativos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async getServiceById(id: string): Promise<Service | null> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar serviço:', error);
      throw new Error(`Falha ao buscar serviço: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async updateService(id: string, updates: UpdateService): Promise<Service> {
    try {
      const { data, error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar serviço:', error);
      throw new Error(`Falha ao atualizar serviço: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async deleteService(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao deletar serviço:', error);
      throw new Error(`Falha ao deletar serviço: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // ==================== AÇÕES ESPECÍFICAS ====================
  static async toggleServiceStatus(id: string): Promise<Service> {
    try {
      // Buscar status atual
      const { data: current } = await supabase
        .from('services')
        .select('active')
        .eq('id', id)
        .single();

      if (!current) {
        throw new Error('Serviço não encontrado');
      }

      // Alternar status
      const { data, error } = await supabase
        .from('services')
        .update({ active: !current.active })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao alterar status do serviço:', error);
      throw new Error(`Falha ao alterar status: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async duplicateService(id: string): Promise<Service> {
    try {
      const original = await this.getServiceById(id);
      if (!original) {
        throw new Error('Serviço não encontrado');
      }

      const { data, error } = await supabase
        .from('services')
        .insert([{
          name: `${original.name} (Cópia)`,
          description: original.description,
          category: original.category,
          price: original.price,
          estimated_time_minutes: original.estimated_time_minutes,
          active: true
        }])
        .select('*')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao duplicar serviço:', error);
      throw new Error(`Falha ao duplicar serviço: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // ==================== BUSCA E FILTROS ====================
  static async searchServices(searchTerm: string): Promise<Service[]> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
      throw new Error(`Falha ao buscar serviços: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async getServicesByCategory(category: string): Promise<Service[]> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('category', category)
        .eq('active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar serviços por categoria:', error);
      throw new Error(`Falha ao buscar serviços: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async getServicesByPriceRange(minPrice: number, maxPrice: number): Promise<Service[]> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .gte('price', minPrice)
        .lte('price', maxPrice)
        .eq('active', true)
        .order('price', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar serviços por faixa de preço:', error);
      throw new Error(`Falha ao buscar serviços: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async getCategoriesWithCounts(): Promise<Array<{
    category: string;
    total_services: number;
    active_services: number;
  }>> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('category, active')
        .order('category');

      if (error) throw error;

      const categoryCounts = new Map();
      
      data?.forEach(service => {
        const category = service.category;
        if (!categoryCounts.has(category)) {
          categoryCounts.set(category, { total_services: 0, active_services: 0 });
        }
        
        const counts = categoryCounts.get(category);
        counts.total_services++;
        if (service.active) {
          counts.active_services++;
        }
      });

      return Array.from(categoryCounts.entries()).map(([category, counts]) => ({
        category,
        ...counts
      }));
    } catch (error) {
      console.error('Erro ao buscar categorias com contadores:', error);
      throw new Error(`Falha ao buscar categorias: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // ==================== ESTATÍSTICAS ====================
  static async getServiceStats(): Promise<{
    totalServices: number;
    activeServices: number;
    totalCategories: number;
    averagePrice: number;
    averageTime: number;
    mostUsedService: Service | null;
    mostProfitableCategory: string | null;
  }> {
    try {
      const [services, orders] = await Promise.all([
        supabase
          .from('services')
          .select('*'),
        supabase
          .from('service_order_items')
          .select('service_id, quantity, unit_price')
          .not('service_id', 'is', null)
      ]);

      if (services.error) throw services.error;
      if (orders.error) throw orders.error;

      const totalServices = services.data?.length || 0;
      const activeServices = services.data?.filter(service => service.active).length || 0;
      
      const categories = new Set(services.data?.map(service => service.category) || []);
      const totalCategories = categories.size;
      
      const activeServicesList = services.data?.filter(service => service.active) || [];
      const averagePrice = activeServicesList.length > 0
        ? activeServicesList.reduce((sum, service) => sum + (service.price || 0), 0) / activeServicesList.length
        : 0;

      const averageTime = activeServicesList.length > 0
        ? activeServicesList
            .filter(service => service.estimated_time_minutes)
            .reduce((sum, service) => sum + (service.estimated_time_minutes || 0), 0) / 
          activeServicesList.filter(service => service.estimated_time_minutes).length
        : 0;

      // Encontrar serviço mais usado
      const serviceUsage = new Map();
      orders.data?.forEach(order => {
        if (order.service_id) {
          serviceUsage.set(order.service_id, (serviceUsage.get(order.service_id) || 0) + (order.quantity || 1));
        }
      });

      let mostUsedService = null;
      if (serviceUsage.size > 0) {
        const mostUsedId = Array.from(serviceUsage.entries())
          .sort(([,a], [,b]) => b - a)[0][0];
        
        mostUsedService = services.data?.find(service => service.id === mostUsedId) || null;
      }

      // Categoria mais lucrativa
      const categoryRevenue = new Map();
      orders.data?.forEach(order => {
        if (order.service_id) {
          const service = services.data?.find(s => s.id === order.service_id);
          if (service?.category) {
            const revenue = (order.quantity || 1) * (order.unit_price || 0);
            categoryRevenue.set(service.category, (categoryRevenue.get(service.category) || 0) + revenue);
          }
        }
      });

      const mostProfitableCategory = categoryRevenue.size > 0
        ? Array.from(categoryRevenue.entries())
            .sort(([,a], [,b]) => b - a)[0][0]
        : null;

      return {
        totalServices,
        activeServices,
        totalCategories,
        averagePrice: Math.round(averagePrice * 100) / 100,
        averageTime: Math.round(averageTime),
        mostUsedService,
        mostProfitableCategory
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas de serviços:', error);
      throw new Error(`Falha ao buscar estatísticas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async getServiceUsageReport(
    startDate: string,
    endDate: string
  ): Promise<Array<{
    service: Service;
    usage_count: number;
    total_revenue: number;
    average_price: number;
  }>> {
    try {
      const { data: orderItems, error } = await supabase
        .from('service_order_items')
        .select(`
          service_id,
          quantity,
          unit_price,
          services (
            id,
            name,
            description,
            category,
            price,
            estimated_time_minutes,
            active
          ),
          service_orders (
            created_at
          )
        `)
        .not('service_id', 'is', null)
        .gte('service_orders.created_at', startDate)
        .lte('service_orders.created_at', endDate);

      if (error) throw error;

      // Agrupar por serviço
      const serviceMap = new Map();

      orderItems?.forEach(item => {
        if (!item.service_id || !item.services) return;

        const serviceId = item.service_id;
        if (!serviceMap.has(serviceId)) {
          serviceMap.set(serviceId, {
            service: item.services,
            usage_count: 0,
            total_revenue: 0,
            prices: []
          });
        }

        const serviceData = serviceMap.get(serviceId);
        serviceData.usage_count += item.quantity || 1;
        serviceData.total_revenue += (item.quantity || 1) * (item.unit_price || 0);
        serviceData.prices.push(item.unit_price || 0);
      });

      return Array.from(serviceMap.values())
        .map(data => ({
          service: data.service,
          usage_count: data.usage_count,
          total_revenue: data.total_revenue,
          average_price: data.prices.length > 0 
            ? data.prices.reduce((sum: number, price: number) => sum + price, 0) / data.prices.length
            : 0
        }))
        .sort((a, b) => b.usage_count - a.usage_count);
    } catch (error) {
      console.error('Erro ao buscar relatório de uso de serviços:', error);
      throw new Error(`Falha ao buscar relatório: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // ==================== COMPONENTES DE CUSTO ====================
  static async getServiceCostComponents(serviceId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('cost_components')
        .select(`
          *,
          products (
            id,
            name,
            price
          )
        `)
        .eq('service_id', serviceId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar componentes de custo:', error);
      throw new Error(`Falha ao buscar componentes: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // ==================== UTILITÁRIOS ====================
  static getServiceCategories(): readonly string[] {
    return SERVICE_CATEGORIES;
  }

  static formatEstimatedTime(minutes?: number): string {
    if (!minutes) return 'N/A';
    
    if (minutes < 60) {
      return `${minutes}min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    
    return `${hours}h ${remainingMinutes}min`;
  }

  static formatPrice(price: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  }

  static validateServiceData(serviceData: CreateService | UpdateService): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if ('name' in serviceData && (!serviceData.name || serviceData.name.trim().length < 2)) {
      errors.push('Nome do serviço deve ter pelo menos 2 caracteres');
    }

    if ('category' in serviceData && (!serviceData.category || serviceData.category.trim().length === 0)) {
      errors.push('Categoria é obrigatória');
    }

    if ('price' in serviceData && (serviceData.price === undefined || serviceData.price < 0)) {
      errors.push('Preço deve ser maior ou igual a zero');
    }

    if ('estimated_time_minutes' in serviceData && serviceData.estimated_time_minutes !== undefined && serviceData.estimated_time_minutes < 0) {
      errors.push('Tempo estimado deve ser maior ou igual a zero');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
} 