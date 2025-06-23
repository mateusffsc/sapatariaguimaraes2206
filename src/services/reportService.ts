import { supabase } from '@/lib/supabase';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths } from 'date-fns';
import { pt } from 'date-fns/locale';

export interface DailyCashReport {
  date: string;
  opening_balance: number;
  total_receipts: number;
  service_orders_revenue: number;
  sales_revenue: number;
  cash_payments: number;
  card_payments: number;
  credit_payments: number;
  total_expenses: number;
  closing_balance: number;
  transactions_count: number;
  summary: {
    top_services: Array<{ name: string; count: number; revenue: number }>;
    payment_methods_breakdown: Array<{ method: string; amount: number; percentage: number }>;
  };
}

export interface WeeklyServiceOrdersReport {
  week_start: string;
  week_end: string;
  total_orders: number;
  completed_orders: number;
  pending_orders: number;
  cancelled_orders: number;
  completion_rate: number;
  average_completion_time: number;
  total_revenue: number;
  average_order_value: number;
  technician_performance: Array<{
    technician_name: string;
    orders_completed: number;
    efficiency_score: number;
  }>;
  service_breakdown: Array<{
    service_name: string;
    count: number;
    revenue: number;
  }>;
}

export interface MonthlyBalanceReport {
  month: string;
  year: number;
  revenue: {
    service_orders: number;
    sales: number;
    total: number;
  };
  expenses: {
    purchases: number;
    operational: number;
    total: number;
  };
  profit: {
    gross: number;
    net: number;
    margin_percentage: number;
  };
  customers: {
    total: number;
    new: number;
    returning: number;
    retention_rate: number;
  };
  inventory: {
    value: number;
    turnover: number;
    low_stock_items: number;
  };
  kpis: {
    average_ticket: number;
    orders_per_day: number;
    customer_satisfaction: number;
  };
}

export interface ReportTemplate {
  id: string;
  name: string;
  type: 'daily' | 'weekly' | 'monthly';
  frequency: 'manual' | 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  format: 'pdf' | 'excel' | 'json';
  is_active: boolean;
  last_generated: string | null;
  next_generation: string | null;
}

class ReportService {
  // Relatório diário de caixa
  async generateDailyCashReport(date: Date = new Date()): Promise<{ data: DailyCashReport | null; error?: string }> {
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const startDate = format(startOfDay(date), 'yyyy-MM-dd HH:mm:ss');
      const endDate = format(endOfDay(date), 'yyyy-MM-dd HH:mm:ss');

      // Buscar ordens de serviço do dia
      const { data: serviceOrders, error: soError } = await supabase
        .from('service_orders')
        .select(`
          *,
          service_order_items(
            *,
            services(name)
          )
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (soError) {
        return { data: null, error: soError.message };
      }

      // Buscar vendas do dia
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (salesError) {
        return { data: null, error: salesError.message };
      }

      // Calcular métricas
      const serviceOrdersRevenue = serviceOrders?.reduce((sum, so) => sum + parseFloat(so.total_price || 0), 0) || 0;
      const salesRevenue = sales?.reduce((sum, s) => sum + parseFloat(s.total_price || 0), 0) || 0;
      const totalReceipts = serviceOrdersRevenue + salesRevenue;

      // Análise por forma de pagamento
      const allTransactions = [
        ...(serviceOrders?.map(so => ({ payment_method: so.payment_method, amount: parseFloat(so.total_price || 0) })) || []),
        ...(sales?.map(s => ({ payment_method: s.payment_method, amount: parseFloat(s.total_price || 0) })) || [])
      ];

      const paymentBreakdown = allTransactions.reduce((acc, t) => {
        const method = t.payment_method || 'cash';
        acc[method] = (acc[method] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

      const totalTransactionValue = Object.values(paymentBreakdown).reduce((sum, val) => sum + val, 0);

      const paymentMethodsBreakdown = Object.entries(paymentBreakdown).map(([method, amount]) => ({
        method,
        amount,
        percentage: totalTransactionValue > 0 ? (amount / totalTransactionValue) * 100 : 0
      }));

      // Top serviços
      const serviceStats = serviceOrders?.flatMap(so => 
        so.service_order_items?.map(item => ({
          name: item.services?.name || 'Serviço Desconhecido',
          revenue: parseFloat(item.unit_price || 0) * parseInt(item.quantity || 1)
        })) || []
      ) || [];

      const topServices = serviceStats.reduce((acc, service) => {
        const existing = acc.find(s => s.name === service.name);
        if (existing) {
          existing.count += 1;
          existing.revenue += service.revenue;
        } else {
          acc.push({ name: service.name, count: 1, revenue: service.revenue });
        }
        return acc;
      }, [] as Array<{ name: string; count: number; revenue: number }>)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

      const report: DailyCashReport = {
        date: dateStr,
        opening_balance: 0, // Implementar busca do saldo anterior
        total_receipts: totalReceipts,
        service_orders_revenue: serviceOrdersRevenue,
        sales_revenue: salesRevenue,
        cash_payments: paymentBreakdown.cash || 0,
        card_payments: paymentBreakdown.card || 0,
        credit_payments: paymentBreakdown.credit || 0,
        total_expenses: 0, // Implementar busca de despesas
        closing_balance: totalReceipts,
        transactions_count: allTransactions.length,
        summary: {
          top_services: topServices,
          payment_methods_breakdown: paymentMethodsBreakdown
        }
      };

      return { data: report };
    } catch (error) {
      console.error('Erro ao gerar relatório diário de caixa:', error);
      return { data: null, error: 'Erro interno do servidor' };
    }
  }

  // Resumo semanal de ordens de serviço
  async generateWeeklyServiceOrdersReport(date: Date = new Date()): Promise<{ data: WeeklyServiceOrdersReport | null; error?: string }> {
    try {
      const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Segunda-feira
      const weekEnd = endOfWeek(date, { weekStartsOn: 1 }); // Domingo
      
      const startDate = format(weekStart, 'yyyy-MM-dd HH:mm:ss');
      const endDate = format(weekEnd, 'yyyy-MM-dd HH:mm:ss');

      // Buscar ordens de serviço da semana
      const { data: serviceOrders, error: soError } = await supabase
        .from('service_orders')
        .select(`
          *,
          technicians(name),
          service_order_items(
            *,
            services(name)
          )
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (soError) {
        return { data: null, error: soError.message };
      }

      const orders = serviceOrders || [];
      const totalOrders = orders.length;
      const completedOrders = orders.filter(o => o.status === 'completed').length;
      const pendingOrders = orders.filter(o => o.status === 'pending').length;
      const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
      
      const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
      const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Tempo médio de conclusão
      const completedOrdersWithDates = orders.filter(o => 
        o.status === 'completed' && o.completed_at && o.created_at
      );
      
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

      // Performance por técnico
      const technicianStats = orders.reduce((acc, order) => {
        const techName = order.technicians?.name || 'Não atribuído';
        if (!acc[techName]) {
          acc[techName] = { completed: 0, total: 0 };
        }
        acc[techName].total += 1;
        if (order.status === 'completed') {
          acc[techName].completed += 1;
        }
        return acc;
      }, {} as Record<string, { completed: number; total: number }>);

      const technicianPerformance = Object.entries(technicianStats).map(([name, stats]) => ({
        technician_name: name,
        orders_completed: (stats as any).completed,
        efficiency_score: (stats as any).total > 0 ? Math.round(((stats as any).completed / (stats as any).total) * 100) : 0
      })).sort((a, b) => b.efficiency_score - a.efficiency_score);

      // Breakdown por serviço
      const serviceStats = orders.flatMap(so => 
        so.service_order_items?.map(item => ({
          name: item.services?.name || 'Serviço Desconhecido',
          revenue: parseFloat(item.unit_price || 0) * parseInt(item.quantity || 1)
        })) || []
      );

      const serviceBreakdown = serviceStats.reduce((acc, service) => {
        const existing = acc.find(s => s.service_name === service.name);
        if (existing) {
          existing.count += 1;
          existing.revenue += service.revenue;
        } else {
          acc.push({ service_name: service.name, count: 1, revenue: service.revenue });
        }
        return acc;
      }, [] as Array<{ service_name: string; count: number; revenue: number }>)
      .sort((a, b) => b.revenue - a.revenue);

      const report: WeeklyServiceOrdersReport = {
        week_start: format(weekStart, 'yyyy-MM-dd'),
        week_end: format(weekEnd, 'yyyy-MM-dd'),
        total_orders: totalOrders,
        completed_orders: completedOrders,
        pending_orders: pendingOrders,
        cancelled_orders: cancelledOrders,
        completion_rate: completionRate,
        average_completion_time: averageCompletionTime,
        total_revenue: totalRevenue,
        average_order_value: averageOrderValue,
        technician_performance: technicianPerformance,
        service_breakdown: serviceBreakdown
      };

      return { data: report };
    } catch (error) {
      console.error('Erro ao gerar relatório semanal de OS:', error);
      return { data: null, error: 'Erro interno do servidor' };
    }
  }

  // Balanço mensal
  async generateMonthlyBalanceReport(date: Date = new Date()): Promise<{ data: MonthlyBalanceReport | null; error?: string }> {
    try {
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      const startDate = format(monthStart, 'yyyy-MM-dd HH:mm:ss');
      const endDate = format(monthEnd, 'yyyy-MM-dd HH:mm:ss');

      // Buscar dados do mês
      const [
        { data: serviceOrders },
        { data: sales },
        { data: clients },
        { data: products }
      ] = await Promise.all([
        supabase.from('service_orders').select('*').gte('created_at', startDate).lte('created_at', endDate),
        supabase.from('sales').select('*').gte('created_at', startDate).lte('created_at', endDate),
        supabase.from('clients').select('id, created_at'),
        supabase.from('products').select('*')
      ]);

      // Receitas
      const serviceOrdersRevenue = serviceOrders?.reduce((sum, so) => sum + parseFloat(so.total_price || 0), 0) || 0;
      const salesRevenue = sales?.reduce((sum, s) => sum + parseFloat(s.total_price || 0), 0) || 0;
      const totalRevenue = serviceOrdersRevenue + salesRevenue;

      // Despesas (mock por enquanto)
      const purchasesExpenses = 0;
      const operationalExpenses = 0;
      const totalExpenses = purchasesExpenses + operationalExpenses;

      // Lucro
      const grossProfit = totalRevenue - purchasesExpenses;
      const netProfit = totalRevenue - totalExpenses;
      const marginPercentage = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      // Clientes
      const totalClients = clients?.length || 0;
      const newClients = clients?.filter(c => 
        new Date(c.created_at) >= monthStart && new Date(c.created_at) <= monthEnd
      ).length || 0;
      
      // Clientes que retornaram (fizeram mais de uma transação no mês)
      const clientTransactions = [
        ...(serviceOrders?.map(so => so.client_id) || []),
        ...(sales?.map(s => s.client_id) || [])
      ];
      const clientFrequency = clientTransactions.reduce((acc, id) => {
        acc[id] = (acc[id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const returningClients = Object.values(clientFrequency).filter((freq: number) => freq > 1).length;
      const retentionRate = totalClients > 0 ? (returningClients / totalClients) * 100 : 0;

      // Estoque
      const inventoryValue = products?.reduce((sum, p) => 
        sum + (parseFloat(p.price || 0) * parseInt(p.stock_quantity || 0)), 0) || 0;
      const lowStockItems = products?.filter(p => parseInt(p.stock_quantity || 0) <= 5).length || 0;

      // KPIs
      const totalTransactions = (serviceOrders?.length || 0) + (sales?.length || 0);
      const averageTicket = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
      const daysInMonth = Math.ceil((monthEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24));
      const ordersPerDay = daysInMonth > 0 ? (serviceOrders?.length || 0) / daysInMonth : 0;

      const report: MonthlyBalanceReport = {
        month: format(date, 'MMMM', { locale: pt }),
        year: date.getFullYear(),
        revenue: {
          service_orders: serviceOrdersRevenue,
          sales: salesRevenue,
          total: totalRevenue
        },
        expenses: {
          purchases: purchasesExpenses,
          operational: operationalExpenses,
          total: totalExpenses
        },
        profit: {
          gross: grossProfit,
          net: netProfit,
          margin_percentage: marginPercentage
        },
        customers: {
          total: totalClients,
          new: newClients,
          returning: returningClients,
          retention_rate: retentionRate
        },
        inventory: {
          value: inventoryValue,
          turnover: 0, // Implementar cálculo de giro de estoque
          low_stock_items: lowStockItems
        },
        kpis: {
          average_ticket: averageTicket,
          orders_per_day: ordersPerDay,
          customer_satisfaction: 85 // Mock - implementar pesquisa de satisfação
        }
      };

      return { data: report };
    } catch (error) {
      console.error('Erro ao gerar balanço mensal:', error);
      return { data: null, error: 'Erro interno do servidor' };
    }
  }

  // Gerar múltiplos relatórios
  async generateAllReports(date: Date = new Date()) {
    const [dailyReport, weeklyReport, monthlyReport] = await Promise.all([
      this.generateDailyCashReport(date),
      this.generateWeeklyServiceOrdersReport(date),
      this.generateMonthlyBalanceReport(date)
    ]);

    return {
      daily: dailyReport,
      weekly: weeklyReport,
      monthly: monthlyReport
    };
  }

  // Histórico de relatórios
  async getReportsHistory(type: 'daily' | 'weekly' | 'monthly', limit: number = 10) {
    // Implementar busca no banco de dados de relatórios salvos
    // Por enquanto, retornar array vazio
    return { data: [], error: null };
  }
}

export const reportService = new ReportService();
export default reportService; 