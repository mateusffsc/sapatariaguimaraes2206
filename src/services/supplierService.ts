import { supabase } from '@/lib/supabase';
import { Supplier, SupplierWithRelations, AccountsPayable, CreateSupplier, UpdateSupplier, CreateAccountsPayable, UpdateAccountsPayable } from '@/types/database';

export class SupplierService {
  // ==================== CRUD FORNECEDORES ====================
  static async createSupplier(supplierData: CreateSupplier): Promise<Supplier> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert([supplierData])
        .select('*')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao criar fornecedor:', error);
      throw new Error(`Falha ao criar fornecedor: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async getAllSuppliers(): Promise<Supplier[]> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar fornecedores:', error);
      throw new Error(`Falha ao buscar fornecedores: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async getActiveSuppliers(): Promise<Supplier[]> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar fornecedores ativos:', error);
      throw new Error(`Falha ao buscar fornecedores ativos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async getSupplierById(id: string): Promise<SupplierWithRelations | null> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select(`
          *,
          accounts_payable (
            id,
            description,
            total_amount_due,
            balance_due,
            due_date,
            status
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar fornecedor:', error);
      throw new Error(`Falha ao buscar fornecedor: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async updateSupplier(id: string, updates: UpdateSupplier): Promise<Supplier> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar fornecedor:', error);
      throw new Error(`Falha ao atualizar fornecedor: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async deleteSupplier(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao deletar fornecedor:', error);
      throw new Error(`Falha ao deletar fornecedor: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async toggleSupplierStatus(id: string): Promise<Supplier> {
    try {
      // Buscar status atual
      const { data: current } = await supabase
        .from('suppliers')
        .select('active')
        .eq('id', id)
        .single();

      if (!current) {
        throw new Error('Fornecedor não encontrado');
      }

      // Alternar status
      const { data, error } = await supabase
        .from('suppliers')
        .update({ active: !current.active })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao alterar status do fornecedor:', error);
      throw new Error(`Falha ao alterar status: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // ==================== CONTAS A PAGAR ====================
  static async createAccountsPayable(accountData: CreateAccountsPayable): Promise<AccountsPayable> {
    try {
      const { data, error } = await supabase
        .from('accounts_payable')
        .insert([{
          ...accountData,
          balance_due: accountData.total_amount_due // Inicialmente, o saldo devido é igual ao valor total
        }])
        .select(`
          *,
          suppliers (
            id,
            name,
            contact_info
          )
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao criar conta a pagar:', error);
      throw new Error(`Falha ao criar conta a pagar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async getAllAccountsPayable(): Promise<AccountsPayable[]> {
    try {
      const { data, error } = await supabase
        .from('accounts_payable')
        .select(`
          *,
          suppliers (
            id,
            name,
            contact_info
          )
        `)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar contas a pagar:', error);
      throw new Error(`Falha ao buscar contas a pagar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async getPendingAccountsPayable(): Promise<AccountsPayable[]> {
    try {
      const { data, error } = await supabase
        .from('accounts_payable')
        .select(`
          *,
          suppliers (
            id,
            name,
            contact_info
          )
        `)
        .eq('status', 'pending')
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar contas pendentes:', error);
      throw new Error(`Falha ao buscar contas pendentes: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async getOverdueAccountsPayable(): Promise<AccountsPayable[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('accounts_payable')
        .select(`
          *,
          suppliers (
            id,
            name,
            contact_info
          )
        `)
        .eq('status', 'pending')
        .lt('due_date', today)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar contas vencidas:', error);
      throw new Error(`Falha ao buscar contas vencidas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async updateAccountsPayable(id: string, updates: UpdateAccountsPayable): Promise<AccountsPayable> {
    try {
      const { data, error } = await supabase
        .from('accounts_payable')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          suppliers (
            id,
            name,
            contact_info
          )
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar conta a pagar:', error);
      throw new Error(`Falha ao atualizar conta: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async makePayment(accountId: string, paymentAmount: number): Promise<AccountsPayable> {
    try {
      // Buscar dados atuais da conta
      const { data: account } = await supabase
        .from('accounts_payable')
        .select('*')
        .eq('id', accountId)
        .single();

      if (!account) {
        throw new Error('Conta a pagar não encontrada');
      }

      const newAmountPaid = (account.amount_paid || 0) + paymentAmount;
      const newBalanceDue = account.total_amount_due - newAmountPaid;
      const newStatus = newBalanceDue <= 0 ? 'paid' : 'pending';

      const { data, error } = await supabase
        .from('accounts_payable')
        .update({
          amount_paid: newAmountPaid,
          balance_due: Math.max(0, newBalanceDue),
          status: newStatus,
          paid_at: newStatus === 'paid' ? new Date().toISOString() : null
        })
        .eq('id', accountId)
        .select(`
          *,
          suppliers (
            id,
            name,
            contact_info
          )
        `)
        .single();

      if (error) throw error;

      // Criar entrada financeira para o pagamento
      await this.createPaymentEntry(data, paymentAmount);

      return data;
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
      throw new Error(`Falha ao registrar pagamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async deleteAccountsPayable(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('accounts_payable')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao deletar conta a pagar:', error);
      throw new Error(`Falha ao deletar conta: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // ==================== BUSCA E FILTROS ====================
  static async searchSuppliers(searchTerm: string): Promise<Supplier[]> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,contact_info.ilike.%${searchTerm}%`)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar fornecedores:', error);
      throw new Error(`Falha ao buscar fornecedores: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async getAccountsPayableBySupplier(supplierId: string): Promise<AccountsPayable[]> {
    try {
      const { data, error } = await supabase
        .from('accounts_payable')
        .select(`
          *,
          suppliers (
            id,
            name,
            contact_info
          )
        `)
        .eq('supplier_id', supplierId)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar contas do fornecedor:', error);
      throw new Error(`Falha ao buscar contas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async getAccountsPayableByDateRange(startDate: string, endDate: string): Promise<AccountsPayable[]> {
    try {
      const { data, error } = await supabase
        .from('accounts_payable')
        .select(`
          *,
          suppliers (
            id,
            name,
            contact_info
          )
        `)
        .gte('due_date', startDate)
        .lte('due_date', endDate)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar contas por período:', error);
      throw new Error(`Falha ao buscar contas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // ==================== ESTATÍSTICAS ====================
  static async getSupplierStats(): Promise<{
    totalSuppliers: number;
    activeSuppliers: number;
    totalAccountsPayable: number;
    pendingAmount: number;
    overdueAmount: number;
  }> {
    try {
      const [suppliers, accounts, overdueAccounts] = await Promise.all([
        supabase
          .from('suppliers')
          .select('active', { count: 'exact' }),
        
        supabase
          .from('accounts_payable')
          .select('balance_due, status'),
        
        supabase
          .from('accounts_payable')
          .select('balance_due')
          .eq('status', 'pending')
          .lt('due_date', new Date().toISOString().split('T')[0])
      ]);

      if (suppliers.error) throw suppliers.error;
      if (accounts.error) throw accounts.error;
      if (overdueAccounts.error) throw overdueAccounts.error;

      const totalSuppliers = suppliers.count || 0;
      const activeSuppliers = suppliers.data?.filter(s => s.active).length || 0;
      const totalAccountsPayable = accounts.data?.length || 0;
      const pendingAmount = accounts.data?.filter(a => a.status === 'pending')
        .reduce((sum, a) => sum + (a.balance_due || 0), 0) || 0;
      const overdueAmount = overdueAccounts.data?.reduce((sum, a) => sum + (a.balance_due || 0), 0) || 0;

      return {
        totalSuppliers,
        activeSuppliers,
        totalAccountsPayable,
        pendingAmount,
        overdueAmount
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas de fornecedores:', error);
      throw new Error(`Falha ao buscar estatísticas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async getSupplierPerformanceReport(
    startDate: string,
    endDate: string
  ): Promise<Array<{
    supplier: Supplier;
    totalPurchases: number;
    totalSpent: number;
    onTimePayments: number;
    latePayments: number;
  }>> {
    try {
      const { data: accounts, error } = await supabase
        .from('accounts_payable')
        .select(`
          supplier_id,
          total_amount_due,
          due_date,
          paid_at,
          status,
          suppliers (
            id,
            name,
            contact_info
          )
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (error) throw error;

      // Agrupar por fornecedor
      const supplierMap = new Map();

      accounts?.forEach(account => {
        if (!account.supplier_id || !account.suppliers) return;

        const supplierId = account.supplier_id;
        if (!supplierMap.has(supplierId)) {
          supplierMap.set(supplierId, {
            supplier: account.suppliers,
            accounts: []
          });
        }

        supplierMap.get(supplierId).accounts.push(account);
      });

      // Calcular métricas
      return Array.from(supplierMap.values()).map(({ supplier, accounts }) => {
        const totalPurchases = accounts.length;
        const totalSpent = accounts.reduce((sum: number, a: any) => sum + (a.total_amount_due || 0), 0);
        
        const paidAccounts = accounts.filter((a: any) => a.status === 'paid');
        const onTimePayments = paidAccounts.filter((a: any) => {
          if (!a.paid_at || !a.due_date) return false;
          return new Date(a.paid_at) <= new Date(a.due_date);
        }).length;
        
        const latePayments = paidAccounts.length - onTimePayments;

        return {
          supplier,
          totalPurchases,
          totalSpent,
          onTimePayments,
          latePayments
        };
      });
    } catch (error) {
      console.error('Erro ao buscar relatório de fornecedores:', error);
      throw new Error(`Falha ao buscar relatório: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // ==================== MÉTODOS AUXILIARES ====================
  private static async createPaymentEntry(account: AccountsPayable, paymentAmount: number): Promise<void> {
    try {
      await supabase
        .from('payments')
        .insert([{
          amount: paymentAmount,
          payment_date: new Date().toISOString(),
          payment_type: 'expense',
          description: `Pagamento para ${account.suppliers?.name || 'Fornecedor'} - ${account.description}`
        }]);
    } catch (error) {
      console.error('Erro ao criar entrada de pagamento:', error);
    }
  }
}
