import { supabase } from '../lib/supabase';
import { DatabaseMapper, type MovimentacaoFinanceira } from '../lib/mappers';
import type { 
  Payment, 
  PaymentWithRelations,
  CreatePayment,
  UpdatePayment,
  PaymentMethod,
  BankAccount,
  PaymentType,
  CreatePaymentMethod,
  UpdatePaymentMethod
} from '../types/database';

export class PaymentService {
  // ==================== MÉTODOS PRINCIPAIS ====================
  
  static async criarPagamento(dadosMovimentacao: Omit<MovimentacaoFinanceira, 'id' | 'created_at' | 'updated_at'>): Promise<Payment> {
    try {
      // Converter dados da movimentação para formato Payment
      const paymentData = DatabaseMapper.movimentacaoToPayment(dadosMovimentacao);

      const { data, error } = await supabase
        .from('payments')
        .insert([paymentData])
        .select(`
          *,
          payment_method:payment_methods(*),
          source_bank_account:bank_accounts!payments_source_bank_account_id_fkey(*),
          destination_bank_account:bank_accounts!payments_destination_bank_account_id_fkey(*)
        `)
        .single();

      if (error) throw error;

      // Atualizar saldo das contas bancárias se necessário
      await this.atualizarSaldosContas(data);

      return data;
    } catch (error) {
      console.error('Erro ao criar pagamento:', error);
      throw new Error(`Falha ao criar pagamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async listarPagamentos(dataInicio?: string, dataFim?: string): Promise<PaymentWithRelations[]> {
    try {
      let query = supabase
        .from('payments')
        .select(`
          *,
          payment_method:payment_methods(*),
          source_bank_account:bank_accounts!payments_source_bank_account_id_fkey(*),
          destination_bank_account:bank_accounts!payments_destination_bank_account_id_fkey(*),
          service_order:service_orders(*),
          sale:sales(*)
        `)
        .order('payment_date', { ascending: false });

      if (dataInicio) {
        query = query.gte('payment_date', dataInicio);
      }
      if (dataFim) {
        query = query.lte('payment_date', dataFim);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Erro ao listar pagamentos:', error);
      throw new Error(`Falha ao listar pagamentos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async obterPagamentoPorId(id: number): Promise<PaymentWithRelations | null> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          payment_method:payment_methods(*),
          source_bank_account:bank_accounts!payments_source_bank_account_id_fkey(*),
          destination_bank_account:bank_accounts!payments_destination_bank_account_id_fkey(*),
          service_order:service_orders(*),
          sale:sales(*)
        `)
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return data;
    } catch (error) {
      console.error('Erro ao obter pagamento:', error);
      throw new Error(`Falha ao obter pagamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async atualizarPagamento(id: number, dadosMovimentacao: Partial<MovimentacaoFinanceira>): Promise<Payment> {
    try {
      // Converter dados da movimentação para formato Payment
      const paymentData = DatabaseMapper.movimentacaoToPayment(dadosMovimentacao);

      const { data, error } = await supabase
        .from('payments')
        .update(paymentData)
        .eq('id', id)
        .select(`
          *,
          payment_method:payment_methods(*),
          source_bank_account:bank_accounts!payments_source_bank_account_id_fkey(*),
          destination_bank_account:bank_accounts!payments_destination_bank_account_id_fkey(*)
        `)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Erro ao atualizar pagamento:', error);
      throw new Error(`Falha ao atualizar pagamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async excluirPagamento(id: number): Promise<void> {
    try {
      // Primeiro obter o pagamento para reverter saldos
      const pagamento = await this.obterPagamentoPorId(id);
      
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Reverter saldo nas contas bancárias
      if (pagamento) {
        await this.reverterSaldosContas(pagamento);
      }
    } catch (error) {
      console.error('Erro ao excluir pagamento:', error);
      throw new Error(`Falha ao excluir pagamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // ==================== MÉTODOS AUXILIARES ====================

  static async listarFormasPagamento(): Promise<PaymentMethod[]> {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Erro ao listar formas de pagamento:', error);
      throw new Error(`Falha ao listar formas de pagamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async criarFormaPagamento(dados: CreatePaymentMethod): Promise<PaymentMethod> {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .insert([dados])
        .select('*')
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Erro ao criar forma de pagamento:', error);
      throw new Error(`Falha ao criar forma de pagamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async obterFormaPagamento(id: number): Promise<PaymentMethod | null> {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return data;
    } catch (error) {
      console.error('Erro ao obter forma de pagamento:', error);
      throw new Error(`Falha ao obter forma de pagamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async atualizarFormaPagamento(id: number, dados: UpdatePaymentMethod): Promise<PaymentMethod> {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .update(dados)
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Erro ao atualizar forma de pagamento:', error);
      throw new Error(`Falha ao atualizar forma de pagamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async excluirFormaPagamento(id: number): Promise<void> {
    try {
      // Verificar se a forma de pagamento está sendo usada
      const { data: paymentsUsing } = await supabase
        .from('payments')
        .select('id')
        .eq('payment_method_id', id)
        .limit(1);

      if (paymentsUsing && paymentsUsing.length > 0) {
        throw new Error('Não é possível excluir esta forma de pagamento pois ela está sendo utilizada em transações.');
      }

      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao excluir forma de pagamento:', error);
      throw new Error(`Falha ao excluir forma de pagamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async listarContasBancarias(): Promise<BankAccount[]> {
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Erro ao listar contas bancárias:', error);
      throw new Error(`Falha ao listar contas bancárias: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async obterResumoFinanceiro(dataInicio: string, dataFim: string): Promise<{
    totalReceitas: number;
    totalDespesas: number;
    totalTransferencias: number;
    saldoPeriodo: number;
    pagamentos: PaymentWithRelations[];
  }> {
    try {
      const pagamentos = await this.listarPagamentos(dataInicio, dataFim);
      
      const totalReceitas = pagamentos
        .filter(p => p.payment_type === 'revenue')
        .reduce((sum, p) => sum + p.amount, 0);
      
      const totalDespesas = pagamentos
        .filter(p => p.payment_type === 'expense')
        .reduce((sum, p) => sum + p.amount, 0);

      const totalTransferencias = pagamentos
        .filter(p => p.payment_type === 'transfer')
        .reduce((sum, p) => sum + p.amount, 0);

      return {
        totalReceitas,
        totalDespesas,
        totalTransferencias,
        saldoPeriodo: totalReceitas - totalDespesas,
        pagamentos
      };
    } catch (error) {
      console.error('Erro ao obter resumo financeiro:', error);
      throw new Error(`Falha ao obter resumo financeiro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // ==================== MÉTODOS PRIVADOS ====================

  private static async atualizarSaldosContas(payment: Payment): Promise<void> {
    try {
      // Atualizar conta de origem (para saídas e transferências)
      if (payment.source_bank_account_id && (payment.payment_type === 'expense' || payment.payment_type === 'transfer')) {
        await this.atualizarSaldoConta(payment.source_bank_account_id, -payment.amount);
      }

      // Atualizar conta de destino (para entradas e transferências)
      if (payment.destination_bank_account_id && (payment.payment_type === 'revenue' || payment.payment_type === 'transfer')) {
        await this.atualizarSaldoConta(payment.destination_bank_account_id, payment.amount);
      }
    } catch (error) {
      console.error('Erro ao atualizar saldos das contas:', error);
    }
  }

  private static async reverterSaldosContas(payment: Payment): Promise<void> {
    try {
      // Reverter conta de origem
      if (payment.source_bank_account_id && (payment.payment_type === 'expense' || payment.payment_type === 'transfer')) {
        await this.atualizarSaldoConta(payment.source_bank_account_id, payment.amount);
      }

      // Reverter conta de destino
      if (payment.destination_bank_account_id && (payment.payment_type === 'revenue' || payment.payment_type === 'transfer')) {
        await this.atualizarSaldoConta(payment.destination_bank_account_id, -payment.amount);
      }
    } catch (error) {
      console.error('Erro ao reverter saldos das contas:', error);
    }
  }

  private static async atualizarSaldoConta(contaId: number, mudancaValor: number): Promise<void> {
    try {
      const { data: conta, error: selectError } = await supabase
        .from('bank_accounts')
        .select('current_balance')
        .eq('id', contaId)
        .single();

      if (selectError) throw selectError;

      const novoSaldo = conta.current_balance + mudancaValor;

      const { error: updateError } = await supabase
        .from('bank_accounts')
        .update({ current_balance: novoSaldo })
        .eq('id', contaId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Erro ao atualizar saldo da conta:', error);
      throw error;
    }
  }

  // ==================== CONVERSÕES PARA COMPATIBILIDADE ====================

  static async listarMovimentacoes(dataInicio?: string, dataFim?: string): Promise<MovimentacaoFinanceira[]> {
    try {
      const payments = await this.listarPagamentos(dataInicio, dataFim);
      return DatabaseMapper.paymentsToMovimentacoes(payments);
    } catch (error) {
      console.error('Erro ao listar movimentações:', error);
      throw new Error(`Falha ao listar movimentações: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }
} 