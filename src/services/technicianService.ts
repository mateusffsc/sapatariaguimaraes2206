import { supabase } from '@/lib/supabase';
import { Technician, CreateTechnician, UpdateTechnician } from '@/types/database';

// Especialidades predefinidas para técnicos de sapataria
export const TECHNICIAN_SPECIALTIES = [
  'Reparo de Solado',
  'Troca de Salto',
  'Conserto de Zíper',
  'Limpeza Profunda',
  'Tingimento',
  'Customização',
  'Confecção sob Medida',
  'Reparo de Couro',
  'Bordado/Decoração',
  'Ortopedia',
  'Outros'
] as const;

export type TechnicianSpecialty = typeof TECHNICIAN_SPECIALTIES[number];

export class TechnicianService {
  // ==================== CRUD BÁSICO ====================
  static async createTechnician(technicianData: CreateTechnician): Promise<Technician> {
    try {
      const { data, error } = await supabase
        .from('technicians')
        .insert([{
          ...technicianData,
          active: technicianData.active ?? true,
          specialties: technicianData.specialties || []
        }])
        .select('*')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao criar técnico:', error);
      throw new Error(`Falha ao criar técnico: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async getAllTechnicians(): Promise<Technician[]> {
    try {
      const { data, error } = await supabase
        .from('technicians')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar técnicos:', error);
      throw new Error(`Falha ao buscar técnicos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async getActiveTechnicians(): Promise<Technician[]> {
    try {
      const { data, error } = await supabase
        .from('technicians')
        .select('*')
        .eq('active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar técnicos ativos:', error);
      throw new Error(`Falha ao buscar técnicos ativos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async getTechnicianById(id: string): Promise<Technician | null> {
    try {
      const { data, error } = await supabase
        .from('technicians')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar técnico:', error);
      throw new Error(`Falha ao buscar técnico: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async updateTechnician(id: string, updates: UpdateTechnician): Promise<Technician> {
    try {
      const { data, error } = await supabase
        .from('technicians')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar técnico:', error);
      throw new Error(`Falha ao atualizar técnico: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async deleteTechnician(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('technicians')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao deletar técnico:', error);
      throw new Error(`Falha ao deletar técnico: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // ==================== AÇÕES ESPECÍFICAS ====================
  static async toggleTechnicianStatus(id: string): Promise<Technician> {
    try {
      // Buscar status atual
      const { data: current } = await supabase
        .from('technicians')
        .select('active')
        .eq('id', id)
        .single();

      if (!current) {
        throw new Error('Técnico não encontrado');
      }

      // Alternar status
      const { data, error } = await supabase
        .from('technicians')
        .update({ active: !current.active })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao alterar status do técnico:', error);
      throw new Error(`Falha ao alterar status: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async updateTechnicianRating(id: string, newRating: number): Promise<Technician> {
    try {
      if (newRating < 0 || newRating > 5) {
        throw new Error('Avaliação deve estar entre 0 e 5');
      }

      const { data, error } = await supabase
        .from('technicians')
        .update({ rating: newRating })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar avaliação do técnico:', error);
      throw new Error(`Falha ao atualizar avaliação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // ==================== ESTATÍSTICAS E PERFORMANCE ====================
  static async getTechnicianStats(technicianId: string): Promise<{
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
    inProgressOrders: number;
    averageCompletionTime: number;
    totalRevenue: number;
    averageOrderValue: number;
    completionRate: number;
  }> {
    try {
      const { data: orders, error } = await supabase
        .from('service_orders')
        .select('status, total_price, created_at, updated_at')
        .eq('technician_id', technicianId);

      if (error) throw error;

      const totalOrders = orders?.length || 0;
      const completedOrders = orders?.filter(order => order.status === 'completed').length || 0;
      const pendingOrders = orders?.filter(order => order.status === 'pending').length || 0;
      const inProgressOrders = orders?.filter(order => order.status === 'in_progress').length || 0;

      // Calcular tempo médio de conclusão (em dias)
      const completedOrdersWithTime = orders?.filter(order => 
        order.status === 'completed' && order.created_at && order.updated_at
      ) || [];

      const averageCompletionTime = completedOrdersWithTime.length > 0
        ? completedOrdersWithTime.reduce((sum, order) => {
            const created = new Date(order.created_at);
            const completed = new Date(order.updated_at);
            const days = Math.ceil((completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
            return sum + days;
          }, 0) / completedOrdersWithTime.length
        : 0;

      // Calcular receita total
      const totalRevenue = orders?.reduce((sum, order) => sum + (order.total_price || 0), 0) || 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

      return {
        totalOrders,
        completedOrders,
        pendingOrders,
        inProgressOrders,
        averageCompletionTime: Math.round(averageCompletionTime * 10) / 10,
        totalRevenue,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
        completionRate: Math.round(completionRate * 10) / 10
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas do técnico:', error);
      throw new Error(`Falha ao buscar estatísticas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async getTechniciansOverallStats(): Promise<{
    totalTechnicians: number;
    activeTechnicians: number;
    averageRating: number;
    topPerformer: Technician | null;
    totalWorkload: number;
  }> {
    try {
      const [technicians, orders] = await Promise.all([
        supabase.from('technicians').select('*'),
        supabase
          .from('service_orders')
          .select('technician_id, status, total_price')
          .in('status', ['pending', 'in_progress', 'completed'])
      ]);

      if (technicians.error) throw technicians.error;
      if (orders.error) throw orders.error;

      const totalTechnicians = technicians.data?.length || 0;
      const activeTechnicians = technicians.data?.filter(tech => tech.active).length || 0;

      // Calcular avaliação média
      const ratingsCount = technicians.data?.filter(tech => tech.rating).length || 0;
      const totalRating = technicians.data?.reduce((sum, tech) => sum + (tech.rating || 0), 0) || 0;
      const averageRating = ratingsCount > 0 ? totalRating / ratingsCount : 0;

      // Encontrar melhor performer (por receita gerada)
      const technicianRevenue = new Map();
      orders.data?.forEach(order => {
        if (order.technician_id && order.status === 'completed') {
          const current = technicianRevenue.get(order.technician_id) || 0;
          technicianRevenue.set(order.technician_id, current + (order.total_price || 0));
        }
      });

      let topPerformer = null;
      if (technicianRevenue.size > 0) {
        const topTechId = Array.from(technicianRevenue.entries())
          .sort(([,a], [,b]) => b - a)[0][0];
        
        topPerformer = technicians.data?.find(tech => tech.id === topTechId) || null;
      }

      // Carga de trabalho total (ordens pendentes + em progresso)
      const totalWorkload = orders.data?.filter(order => 
        ['pending', 'in_progress'].includes(order.status)
      ).length || 0;

      return {
        totalTechnicians,
        activeTechnicians,
        averageRating: Math.round(averageRating * 10) / 10,
        topPerformer,
        totalWorkload
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas gerais:', error);
      throw new Error(`Falha ao buscar estatísticas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async getTechnicianWorkload(): Promise<Array<{
    technician: Technician;
    activeOrders: number;
    pendingOrders: number;
    totalWorkload: number;
    estimatedWorkTime: number;
  }>> {
    try {
      const [technicians, orders] = await Promise.all([
        supabase
          .from('technicians')
          .select('*')
          .eq('active', true),
        supabase
          .from('service_orders')
          .select(`
            technician_id, 
            status,
            items:service_order_items(
              service_id,
              services(estimated_time_minutes)
            )
          `)
          .in('status', ['pending', 'in_progress'])
      ]);

      if (technicians.error) throw technicians.error;
      if (orders.error) throw orders.error;

      return (technicians.data || []).map(technician => {
        const technicianOrders = orders.data?.filter(order => order.technician_id === technician.id) || [];
        
        const activeOrders = technicianOrders.filter(order => order.status === 'in_progress').length;
        const pendingOrders = technicianOrders.filter(order => order.status === 'pending').length;
        const totalWorkload = activeOrders + pendingOrders;

        // Calcular tempo estimado de trabalho
        const estimatedWorkTime = technicianOrders.reduce((total, order) => {
          const orderTime = (order.items || []).reduce((sum: number, item: any) => {
            return sum + (item.services?.estimated_time_minutes || 0);
          }, 0);
          return total + orderTime;
        }, 0);

        return {
          technician,
          activeOrders,
          pendingOrders,
          totalWorkload,
          estimatedWorkTime
        };
      });
    } catch (error) {
      console.error('Erro ao buscar carga de trabalho dos técnicos:', error);
      throw new Error(`Falha ao buscar carga de trabalho: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // ==================== BUSCA E FILTROS ====================
  static async searchTechnicians(searchTerm: string): Promise<Technician[]> {
    try {
      const { data, error } = await supabase
        .from('technicians')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar técnicos:', error);
      throw new Error(`Falha ao buscar técnicos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async getTechniciansBySpecialty(specialty: string): Promise<Technician[]> {
    try {
      const { data, error } = await supabase
        .from('technicians')
        .select('*')
        .contains('specialties', [specialty])
        .eq('active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar técnicos por especialidade:', error);
      throw new Error(`Falha ao buscar técnicos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async getSpecialtiesWithCounts(): Promise<Array<{
    specialty: string;
    technician_count: number;
    active_technicians: number;
  }>> {
    try {
      const { data, error } = await supabase
        .from('technicians')
        .select('specialties, active');

      if (error) throw error;

      const specialtyMap = new Map();

      data?.forEach(technician => {
        technician.specialties?.forEach((specialty: string) => {
          if (!specialtyMap.has(specialty)) {
            specialtyMap.set(specialty, { technician_count: 0, active_technicians: 0 });
          }
          
          const counts = specialtyMap.get(specialty);
          counts.technician_count++;
          if (technician.active) {
            counts.active_technicians++;
          }
        });
      });

      return Array.from(specialtyMap.entries()).map(([specialty, counts]) => ({
        specialty,
        ...counts
      }));
    } catch (error) {
      console.error('Erro ao buscar especialidades:', error);
      throw new Error(`Falha ao buscar especialidades: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // ==================== RELATÓRIOS ====================
  static async getTechnicianPerformanceReport(
    startDate: string,
    endDate: string
  ): Promise<Array<{
    technician: Technician;
    ordersCompleted: number;
    totalRevenue: number;
    averageOrderValue: number;
    averageCompletionTime: number;
    customerSatisfaction: number;
  }>> {
    try {
      const { data: orders, error } = await supabase
        .from('service_orders')
        .select(`
          technician_id,
          total_price,
          created_at,
          updated_at,
          rating,
          technicians (
            id,
            name,
            phone,
            email,
            specialties,
            active,
            rating
          )
        `)
        .eq('status', 'completed')
        .gte('updated_at', startDate)
        .lte('updated_at', endDate)
        .not('technician_id', 'is', null);

      if (error) throw error;

      // Agrupar por técnico
      const technicianMap = new Map();

      orders?.forEach(order => {
        if (!order.technician_id || !order.technicians) return;

        const techId = order.technician_id;
        if (!technicianMap.has(techId)) {
          technicianMap.set(techId, {
            technician: order.technicians,
            orders: []
          });
        }

        technicianMap.get(techId).orders.push(order);
      });

      // Calcular métricas
      return Array.from(technicianMap.values()).map(({ technician, orders }) => {
        const ordersCompleted = orders.length;
        const totalRevenue = orders.reduce((sum: number, o: any) => sum + (o.total_price || 0), 0);
        const averageOrderValue = ordersCompleted > 0 ? totalRevenue / ordersCompleted : 0;

        // Tempo médio de conclusão
        const completionTimes = orders
          .filter((o: any) => o.created_at && o.updated_at)
          .map((o: any) => {
            const created = new Date(o.created_at);
            const completed = new Date(o.updated_at);
            return Math.ceil((completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
          });

        const averageCompletionTime = completionTimes.length > 0
          ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
          : 0;

        // Satisfação do cliente (baseada nas avaliações)
        const ratings = orders.filter((o: any) => o.rating).map((o: any) => o.rating);
        const customerSatisfaction = ratings.length > 0
          ? ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length
          : 0;

        return {
          technician,
          ordersCompleted,
          totalRevenue,
          averageOrderValue: Math.round(averageOrderValue * 100) / 100,
          averageCompletionTime: Math.round(averageCompletionTime * 10) / 10,
          customerSatisfaction: Math.round(customerSatisfaction * 10) / 10
        };
      });
    } catch (error) {
      console.error('Erro ao buscar relatório de performance:', error);
      throw new Error(`Falha ao buscar relatório: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // ==================== UTILITÁRIOS ====================
  static getTechnicianSpecialties(): readonly string[] {
    return TECHNICIAN_SPECIALTIES;
  }

  static formatHourlyRate(rate?: number): string {
    if (!rate) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(rate) + '/h';
  }

  static formatRating(rating?: number): string {
    if (!rating) return 'N/A';
    return `${rating.toFixed(1)}/5.0`;
  }

  static calculateExperienceYears(hireDate?: string): number {
    if (!hireDate) return 0;
    
    const hire = new Date(hireDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - hire.getTime());
    const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
    
    return diffYears;
  }

  static validateTechnicianData(technicianData: CreateTechnician | UpdateTechnician): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if ('name' in technicianData && (!technicianData.name || technicianData.name.trim().length < 2)) {
      errors.push('Nome do técnico deve ter pelo menos 2 caracteres');
    }

    if ('email' in technicianData && technicianData.email && !technicianData.email.includes('@')) {
      errors.push('Email deve ter um formato válido');
    }

    if ('phone' in technicianData && technicianData.phone && technicianData.phone.length < 10) {
      errors.push('Telefone deve ter pelo menos 10 dígitos');
    }

    if ('hourly_rate' in technicianData && technicianData.hourly_rate !== undefined && technicianData.hourly_rate < 0) {
      errors.push('Valor por hora deve ser maior ou igual a zero');
    }

    if ('rating' in technicianData && technicianData.rating !== undefined && (technicianData.rating < 0 || technicianData.rating > 5)) {
      errors.push('Avaliação deve estar entre 0 e 5');
    }

    if ('specialties' in technicianData && (!technicianData.specialties || technicianData.specialties.length === 0)) {
      errors.push('Técnico deve ter pelo menos uma especialidade');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
} 