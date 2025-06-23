import { supabase } from '@/lib/supabase';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, format } from 'date-fns';

export interface TechnicianPerformance {
  technician_id: string;
  technician_name: string;
  total_orders: number;
  completed_orders: number;
  pending_orders: number;
  cancelled_orders: number;
  completion_rate: number;
  average_completion_time: number; // em dias
  total_revenue: number;
  average_order_value: number;
  efficiency_score: number; // 0-100
}

export interface PeriodAnalysis {
  period: string;
  total_orders: number;
  completed_orders: number;
  completion_rate: number;
  average_completion_time: number;
  total_revenue: number;
  average_order_value: number;
}

export interface ServiceAnalysis {
  service_id: string;
  service_name: string;
  total_orders: number;
  completion_rate: number;
  average_price: number;
  total_revenue: number;
  average_completion_time: number;
  demand_score: number; // 0-100
}

export interface RevenueAnalysis {
  date: string;
  service_orders_revenue: number;
  sales_revenue: number;
  total_revenue: number;
  orders_count: number;
  sales_count: number;
  average_ticket: number;
}

export interface CustomerAnalysis {
  customer_id: string;
  customer_name: string;
  total_orders: number;
  total_spent: number;
  average_order_value: number;
  last_order_date: string;
  customer_lifetime_value: number;
  loyalty_score: number; // 0-100
  preferred_services: string[];
}

export interface BusinessMetrics {
  // Métricas gerais
  total_customers: number;
  active_customers: number; // com pedidos nos últimos 30 dias
  new_customers_this_month: number;
  customer_retention_rate: number;
  
  // Métricas de ordens de serviço
  total_service_orders: number;
  pending_service_orders: number;
  overdue_service_orders: number;
  completion_rate: number;
  average_completion_time: number;
  
  // Métricas financeiras
  monthly_revenue: number;
  monthly_growth: number; // percentual vs mês anterior
  average_ticket: number;
  total_receivables: number; // a receber
  
  // Métricas de estoque
  total_products: number;
  low_stock_products: number;
  out_of_stock_products: number;
  inventory_value: number;
}

class AnalyticsService {
  // Análise de performance por técnico
  async getTechnicianPerformance(
    startDate?: string,
    endDate?: string
  ): Promise<{ data: TechnicianPerformance[]; error?: string }> {
    try {
      const start = startDate || format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const end = endDate || format(endOfMonth(new Date()), 'yyyy-MM-dd');

      const { data: rawData, error } = await supabase
        .from('service_orders')
        .select(`
          *,
          technicians!inner(id, name)
        `)
        .gte('created_at', start)
        .lte('created_at', end);

      if (error) {
        return { data: [], error: error.message };
      }

      // Agrupar por técnico e calcular métricas
      const technicianMap = new Map<string, any>();

      rawData?.forEach((order) => {
        const techId = order.technician_id;
        const techName = order.technicians?.name || 'Técnico Desconhecido';

        if (!technicianMap.has(techId)) {
          technicianMap.set(techId, {
            technician_id: techId,
            technician_name: techName,
            orders: [],
            total_revenue: 0
          });
        }

        const tech = technicianMap.get(techId);
        tech.orders.push(order);
        tech.total_revenue += parseFloat(order.total_price || 0);
      });

      const performance: TechnicianPerformance[] = Array.from(technicianMap.values()).map(tech => {
        const orders = tech.orders;
        const totalOrders = orders.length;
        const completedOrders = orders.filter((o: any) => o.status === 'completed').length;
        const pendingOrders = orders.filter((o: any) => o.status === 'pending').length;
        const cancelledOrders = orders.filter((o: any) => o.status === 'cancelled').length;
        
        const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
        
        // Calcular tempo médio de conclusão
        const completedOrdersWithDates = orders.filter((o: any) => 
          o.status === 'completed' && o.completed_at && o.created_at
        );
        
        let averageCompletionTime = 0;
        if (completedOrdersWithDates.length > 0) {
          const totalDays = completedOrdersWithDates.reduce((sum: number, order: any) => {
            const created = new Date(order.created_at);
            const completed = new Date(order.completed_at);
            const days = Math.ceil((completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
            return sum + days;
          }, 0);
          averageCompletionTime = totalDays / completedOrdersWithDates.length;
        }

        const averageOrderValue = totalOrders > 0 ? tech.total_revenue / totalOrders : 0;
        
        // Score de eficiência baseado em conclusão e tempo
        const efficiencyScore = Math.min(100, Math.max(0, 
          (completionRate * 0.7) + 
          (Math.max(0, 100 - (averageCompletionTime * 5)) * 0.3)
        ));

        return {
          technician_id: tech.technician_id,
          technician_name: tech.technician_name,
          total_orders: totalOrders,
          completed_orders: completedOrders,
          pending_orders: pendingOrders,
          cancelled_orders: cancelledOrders,
          completion_rate: completionRate,
          average_completion_time: averageCompletionTime,
          total_revenue: tech.total_revenue,
          average_order_value: averageOrderValue,
          efficiency_score: Math.round(efficiencyScore)
        };
      });

      return { data: performance.sort((a, b) => b.efficiency_score - a.efficiency_score) };
    } catch (error) {
      console.error('Erro ao buscar performance dos técnicos:', error);
      return { data: [], error: 'Erro interno do servidor' };
    }
  }

  // Análise por período
  async getPeriodAnalysis(
    period: 'daily' | 'weekly' | 'monthly' = 'monthly',
    months: number = 12
  ): Promise<{ data: PeriodAnalysis[]; error?: string }> {
    try {
      const periods: PeriodAnalysis[] = [];
      
      for (let i = months - 1; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const start = format(startOfMonth(date), 'yyyy-MM-dd');
        const end = format(endOfMonth(date), 'yyyy-MM-dd');
        const periodLabel = format(date, 'MMM/yyyy');

        const { data: orders, error } = await supabase
          .from('service_orders')
          .select('*')
          .gte('created_at', start)
          .lte('created_at', end);

        if (error) {
          return { data: [], error: error.message };
        }

        const totalOrders = orders?.length || 0;
        const completedOrders = orders?.filter(o => o.status === 'completed').length || 0;
        const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
        const totalRevenue = orders?.reduce((sum, order) => sum + parseFloat(order.total_price || 0), 0) || 0;
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // Calcular tempo médio de conclusão
        const completedOrdersWithDates = orders?.filter(o => 
          o.status === 'completed' && o.completed_at && o.created_at
        ) || [];
        
        let averageCompletionTime = 0;
        if (completedOrdersWithDates.length > 0) {
          const totalDays = completedOrdersWithDates.reduce((sum, order) => {
            const created = new Date(order.created_at);
            const completed = new Date(order.completed_at);
            const days = Math.ceil((completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
            return sum + days;
          }, 0);
          averageCompletionTime = totalDays / completedOrdersWithDates.length;
        }

        periods.push({
          period: periodLabel,
          total_orders: totalOrders,
          completed_orders: completedOrders,
          completion_rate: completionRate,
          average_completion_time: averageCompletionTime,
          total_revenue: totalRevenue,
          average_order_value: averageOrderValue
        });
      }

      return { data: periods };
    } catch (error) {
      console.error('Erro ao buscar análise por período:', error);
      return { data: [], error: 'Erro interno do servidor' };
    }
  }

  // Análise de serviços
  async getServiceAnalysis(
    startDate?: string,
    endDate?: string
  ): Promise<{ data: ServiceAnalysis[]; error?: string }> {
    try {
      const start = startDate || format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const end = endDate || format(endOfMonth(new Date()), 'yyyy-MM-dd');

      const { data: orderItems, error } = await supabase
        .from('service_order_items')
        .select(`
          *,
          service_orders!inner(status, created_at, completed_at),
          services!inner(id, name)
        `)
        .gte('service_orders.created_at', start)
        .lte('service_orders.created_at', end)
        .eq('item_type', 'service');

      if (error) {
        return { data: [], error: error.message };
      }

      // Agrupar por serviço
      const serviceMap = new Map<string, any>();

      orderItems?.forEach((item) => {
        const serviceId = item.service_id;
        const serviceName = item.services?.name || 'Serviço Desconhecido';

        if (!serviceMap.has(serviceId)) {
          serviceMap.set(serviceId, {
            service_id: serviceId,
            service_name: serviceName,
            orders: [],
            total_revenue: 0
          });
        }

        const service = serviceMap.get(serviceId);
        service.orders.push(item);
        service.total_revenue += parseFloat(item.unit_price || 0) * parseInt(item.quantity || 1);
      });

      const analysis: ServiceAnalysis[] = Array.from(serviceMap.values()).map(service => {
        const orders = service.orders;
        const totalOrders = orders.length;
        const completedOrders = orders.filter((o: any) => o.service_orders?.status === 'completed').length;
        const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
        const averagePrice = totalOrders > 0 ? service.total_revenue / totalOrders : 0;

        // Calcular tempo médio de conclusão
        const completedOrdersWithDates = orders.filter((o: any) => 
          o.service_orders?.status === 'completed' && 
          o.service_orders?.completed_at && 
          o.service_orders?.created_at
        );
        
        let averageCompletionTime = 0;
        if (completedOrdersWithDates.length > 0) {
          const totalDays = completedOrdersWithDates.reduce((sum: number, order: any) => {
            const created = new Date(order.service_orders.created_at);
            const completed = new Date(order.service_orders.completed_at);
            const days = Math.ceil((completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
            return sum + days;
          }, 0);
          averageCompletionTime = totalDays / completedOrdersWithDates.length;
        }

        // Score de demanda baseado na quantidade de pedidos
        const maxOrders = Math.max(...Array.from(serviceMap.values()).map((s: any) => s.orders.length));
        const demandScore = maxOrders > 0 ? (totalOrders / maxOrders) * 100 : 0;

        return {
          service_id: service.service_id,
          service_name: service.service_name,
          total_orders: totalOrders,
          completion_rate: completionRate,
          average_price: averagePrice,
          total_revenue: service.total_revenue,
          average_completion_time: averageCompletionTime,
          demand_score: Math.round(demandScore)
        };
      });

      return { data: analysis.sort((a, b) => b.demand_score - a.demand_score) };
    } catch (error) {
      console.error('Erro ao buscar análise de serviços:', error);
      return { data: [], error: 'Erro interno do servidor' };
    }
  }

  // Análise de receita
  async getRevenueAnalysis(
    period: 'daily' | 'weekly' | 'monthly' = 'daily',
    days: number = 30
  ): Promise<{ data: RevenueAnalysis[]; error?: string }> {
    try {
      const revenueData: RevenueAnalysis[] = [];
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = format(date, 'yyyy-MM-dd');
        
        // Buscar receita de ordens de serviço
        const { data: serviceOrders } = await supabase
          .from('service_orders')
          .select('total_price')
          .gte('created_at', `${dateStr} 00:00:00`)
          .lte('created_at', `${dateStr} 23:59:59`)
          .eq('status', 'completed');

        // Buscar receita de vendas
        const { data: sales } = await supabase
          .from('sales')
          .select('total_price')
          .gte('created_at', `${dateStr} 00:00:00`)
          .lte('created_at', `${dateStr} 23:59:59`);

        const serviceOrdersRevenue = serviceOrders?.reduce((sum, order) => 
          sum + parseFloat(order.total_price || 0), 0) || 0;
        
        const salesRevenue = sales?.reduce((sum, sale) => 
          sum + parseFloat(sale.total_price || 0), 0) || 0;

        const totalRevenue = serviceOrdersRevenue + salesRevenue;
        const ordersCount = serviceOrders?.length || 0;
        const salesCount = sales?.length || 0;
        const totalTransactions = ordersCount + salesCount;
        const averageTicket = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

        revenueData.push({
          date: dateStr,
          service_orders_revenue: serviceOrdersRevenue,
          sales_revenue: salesRevenue,
          total_revenue: totalRevenue,
          orders_count: ordersCount,
          sales_count: salesCount,
          average_ticket: averageTicket
        });
      }

      return { data: revenueData };
    } catch (error) {
      console.error('Erro ao buscar análise de receita:', error);
      return { data: [], error: 'Erro interno do servidor' };
    }
  }

  // Análise de clientes
  async getCustomerAnalysis(
    limit: number = 50
  ): Promise<{ data: CustomerAnalysis[]; error?: string }> {
    try {
      const { data: customers, error } = await supabase
        .from('clients')
        .select(`
          *,
          service_orders(id, total_price, created_at, service_order_items(services(name))),
          sales(id, total_price, created_at)
        `);

      if (error) {
        return { data: [], error: error.message };
      }

      const analysis: CustomerAnalysis[] = customers?.map((customer) => {
        const serviceOrders = customer.service_orders || [];
        const sales = customer.sales || [];
        
        const totalOrders = serviceOrders.length + sales.length;
        const totalSpent = [
          ...serviceOrders.map((o: any) => parseFloat(o.total_price || 0)),
          ...sales.map((s: any) => parseFloat(s.total_price || 0))
        ].reduce((sum, value) => sum + value, 0);

        const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
        
        // Última compra
        const allTransactions = [
          ...serviceOrders.map((o: any) => ({ date: o.created_at, type: 'service' })),
          ...sales.map((s: any) => ({ date: s.created_at, type: 'sale' }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const lastOrderDate = allTransactions.length > 0 ? allTransactions[0].date : '';

        // CLV simplificado (valor médio * frequência * período estimado)
        const monthsSinceFirst = allTransactions.length > 0 ? 
          Math.max(1, Math.ceil((new Date().getTime() - new Date(allTransactions[allTransactions.length - 1].date).getTime()) / (1000 * 60 * 60 * 24 * 30))) : 1;
        const frequency = totalOrders / monthsSinceFirst;
        const customerLifetimeValue = averageOrderValue * frequency * 12; // projeção anual

        // Score de lealdade baseado em frequência e recência
        const daysSinceLastOrder = lastOrderDate ? 
          Math.ceil((new Date().getTime() - new Date(lastOrderDate).getTime()) / (1000 * 60 * 60 * 24)) : 999;
        const loyaltyScore = Math.min(100, Math.max(0, 
          (Math.min(totalOrders, 10) * 10) - (daysSinceLastOrder * 0.1)
        ));

        // Serviços preferidos
        const serviceNames = serviceOrders.flatMap((o: any) => 
          o.service_order_items?.map((item: any) => item.services?.name).filter(Boolean) || []
        );
        const serviceCount = serviceNames.reduce((acc: any, name: string) => {
          acc[name] = (acc[name] || 0) + 1;
          return acc;
        }, {});
        const preferredServices = Object.entries(serviceCount)
          .sort(([,a], [,b]) => (b as number) - (a as number))
          .slice(0, 3)
          .map(([name]) => name);

        return {
          customer_id: customer.id,
          customer_name: customer.name,
          total_orders: totalOrders,
          total_spent: totalSpent,
          average_order_value: averageOrderValue,
          last_order_date: lastOrderDate,
          customer_lifetime_value: customerLifetimeValue,
          loyalty_score: Math.round(loyaltyScore),
          preferred_services: preferredServices
        };
      }) || [];

      return { 
        data: analysis
          .sort((a, b) => b.total_spent - a.total_spent)
          .slice(0, limit)
      };
    } catch (error) {
      console.error('Erro ao buscar análise de clientes:', error);
      return { data: [], error: 'Erro interno do servidor' };
    }
  }

  // Métricas gerais do negócio
  async getBusinessMetrics(): Promise<{ data: BusinessMetrics | null; error?: string }> {
    try {
      const today = new Date();
      const thisMonth = startOfMonth(today);
      const lastMonth = startOfMonth(subMonths(today, 1));
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Clientes
      const { data: allCustomers } = await supabase.from('clients').select('id, created_at');
      const totalCustomers = allCustomers?.length || 0;

      // Buscar clientes ativos (com pedidos/vendas nos últimos 30 dias)
      const { data: recentOrders } = await supabase
        .from('service_orders')
        .select('client_id')
        .gte('created_at', format(thirtyDaysAgo, 'yyyy-MM-dd'));

      const { data: recentSales } = await supabase
        .from('sales')
        .select('client_id')
        .gte('created_at', format(thirtyDaysAgo, 'yyyy-MM-dd'));

      const activeClientIds = new Set([
        ...(recentOrders?.map(o => o.client_id) || []),
        ...(recentSales?.map(s => s.client_id) || [])
      ]);
      const activeCustomersCount = activeClientIds.size;

      const newCustomersThisMonth = allCustomers?.filter(c => 
        new Date(c.created_at) >= thisMonth
      ).length || 0;

      // Ordens de serviço
      const { data: allServiceOrders } = await supabase.from('service_orders').select('*');
      const { data: thisMonthOrders } = await supabase
        .from('service_orders')
        .select('*')
        .gte('created_at', format(thisMonth, 'yyyy-MM-dd'));
      const { data: lastMonthOrders } = await supabase
        .from('service_orders')
        .select('*')
        .gte('created_at', format(lastMonth, 'yyyy-MM-dd'))
        .lt('created_at', format(thisMonth, 'yyyy-MM-dd'));

      const totalServiceOrders = allServiceOrders?.length || 0;
      const pendingServiceOrders = allServiceOrders?.filter(o => o.status === 'pending').length || 0;
      const completedOrders = allServiceOrders?.filter(o => o.status === 'completed').length || 0;
      const completionRate = totalServiceOrders > 0 ? (completedOrders / totalServiceOrders) * 100 : 0;

      // Ordens em atraso (mais de 7 dias pending)
      const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const overdueServiceOrders = allServiceOrders?.filter(o => 
        o.status === 'pending' && new Date(o.created_at) < sevenDaysAgo
      ).length || 0;

      // Tempo médio de conclusão
      const completedOrdersWithDates = allServiceOrders?.filter(o => 
        o.status === 'completed' && o.completed_at && o.created_at
      ) || [];
      
      let averageCompletionTime = 0;
      if (completedOrdersWithDates.length > 0) {
        const totalDays = completedOrdersWithDates.reduce((sum, order) => {
          const created = new Date(order.created_at);
          const completed = new Date(order.completed_at);
          const days = Math.ceil((completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
          return sum + days;
        }, 0);
        averageCompletionTime = totalDays / completedOrdersWithDates.length;
      }

      // Receita mensal
      const thisMonthRevenue = (thisMonthOrders?.reduce((sum, order) => 
        sum + parseFloat(order.total_price || 0), 0) || 0);

      const lastMonthRevenue = (lastMonthOrders?.reduce((sum, order) => 
        sum + parseFloat(order.total_price || 0), 0) || 0);

      const monthlyGrowth = lastMonthRevenue > 0 ? 
        ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

      // Ticket médio
      const allRevenue = allServiceOrders?.reduce((sum, order) => 
        sum + parseFloat(order.total_price || 0), 0) || 0;
      const averageTicket = totalServiceOrders > 0 ? allRevenue / totalServiceOrders : 0;

      // Produtos em estoque
      const { data: products } = await supabase.from('products').select('*');
      const totalProducts = products?.length || 0;
      const lowStockProducts = products?.filter(p => 
        parseInt(p.stock_quantity || 0) <= 5
      ).length || 0;
      const outOfStockProducts = products?.filter(p => 
        parseInt(p.stock_quantity || 0) === 0
      ).length || 0;
      const inventoryValue = products?.reduce((sum, product) => 
        sum + (parseFloat(product.price || 0) * parseInt(product.stock_quantity || 0)), 0) || 0;

      // Contas a receber (crediário pendente)
      const { data: creditSales } = await supabase
        .from('credit_sales')
        .select('balance_due')
        .neq('status', 'paid');
      const totalReceivables = creditSales?.reduce((sum, credit) => 
        sum + parseFloat(credit.balance_due || 0), 0) || 0;

      const metrics: BusinessMetrics = {
        total_customers: totalCustomers,
        active_customers: activeCustomersCount,
        new_customers_this_month: newCustomersThisMonth,
        customer_retention_rate: totalCustomers > 0 ? (activeCustomersCount / totalCustomers) * 100 : 0,
        
        total_service_orders: totalServiceOrders,
        pending_service_orders: pendingServiceOrders,
        overdue_service_orders: overdueServiceOrders,
        completion_rate: completionRate,
        average_completion_time: averageCompletionTime,
        
        monthly_revenue: thisMonthRevenue,
        monthly_growth: monthlyGrowth,
        average_ticket: averageTicket,
        total_receivables: totalReceivables,
        
        total_products: totalProducts,
        low_stock_products: lowStockProducts,
        out_of_stock_products: outOfStockProducts,
        inventory_value: inventoryValue
      };

      return { data: metrics };
    } catch (error) {
      console.error('Erro ao buscar métricas do negócio:', error);
      return { data: null, error: 'Erro interno do servidor' };
    }
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService; 