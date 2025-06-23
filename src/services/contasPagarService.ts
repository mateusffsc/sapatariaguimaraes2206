import { supabase } from '../lib/supabase';
import { 
  AccountsPayable, 
  AccountsPayableWithRelations, 
  CreateAccountsPayable, 
  UpdateAccountsPayable,
  AccountsPayableStatus,
  Supplier
} from '../types/database';

export class ContasPagarService {
  // ============================================================================
  // LISTAGEM E CONSULTAS
  // ============================================================================

  static async listarContasPagar(filtros?: {
    status?: AccountsPayableStatus;
    vencimentoAte?: string;
    vencimentoDe?: string;
    fornecedorId?: number;
    limit?: number;
    offset?: number;
  }): Promise<AccountsPayableWithRelations[]> {
    let query = supabase
      .from('accounts_payable')
      .select(`
        *,
        supplier:suppliers!accounts_payable_supplier_id_fkey (
          id,
          name,
          contact_info
        )
      `)
      .order('due_date', { ascending: true });

    if (filtros?.status) {
      query = query.eq('status', filtros.status);
    }

    if (filtros?.vencimentoAte) {
      query = query.lte('due_date', filtros.vencimentoAte);
    }

    if (filtros?.vencimentoDe) {
      query = query.gte('due_date', filtros.vencimentoDe);
    }

    if (filtros?.fornecedorId) {
      query = query.eq('supplier_id', filtros.fornecedorId);
    }

    if (filtros?.limit) {
      query = query.limit(filtros.limit);
    }

    if (filtros?.offset) {
      query = query.range(filtros.offset, (filtros.offset + (filtros.limit || 50)) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Erro ao listar contas a pagar: ${error.message}`);
    }

    return data || [];
  }

  static async obterContaPagar(id: number): Promise<AccountsPayableWithRelations | null> {
    const { data, error } = await supabase
      .from('accounts_payable')
      .select(`
        *,
        supplier:suppliers!accounts_payable_supplier_id_fkey (
          id,
          name,
          contact_info
        )
      `)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Erro ao obter conta a pagar: ${error.message}`);
    }

    return data;
  }

  static async listarContasVencidas(): Promise<AccountsPayableWithRelations[]> {
    const hoje = new Date().toISOString().split('T')[0];
    
    return this.listarContasPagar({
      status: 'open',
      vencimentoAte: hoje
    });
  }

  static async listarContasVencendoEm(dias: number): Promise<AccountsPayableWithRelations[]> {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() + dias);
    const dataLimiteStr = dataLimite.toISOString().split('T')[0];
    const hoje = new Date().toISOString().split('T')[0];
    
    return this.listarContasPagar({
      status: 'open',
      vencimentoDe: hoje,
      vencimentoAte: dataLimiteStr
    });
  }

  // ============================================================================
  // CRIAÇÃO E ATUALIZAÇÃO
  // ============================================================================

  static async criarContaPagar(conta: CreateAccountsPayable): Promise<AccountsPayable> {
    // Validações
    if (!conta.description || conta.description.trim() === '') {
      throw new Error('Descrição é obrigatória');
    }

    if (!conta.total_amount_due || conta.total_amount_due <= 0) {
      throw new Error('Valor total deve ser maior que zero');
    }

    if (!conta.due_date) {
      throw new Error('Data de vencimento é obrigatória');
    }

    const contaData = {
      ...conta,
      amount_paid: conta.amount_paid || 0,
      balance_due: conta.total_amount_due - (conta.amount_paid || 0),
      status: conta.status || 'open' as AccountsPayableStatus,
      created_by_user_id: conta.created_by_user_id || 1 // TODO: Pegar do contexto de usuário
    };

    const { data, error } = await supabase
      .from('accounts_payable')
      .insert([contaData])
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar conta a pagar: ${error.message}`);
    }

    return data;
  }

  static async atualizarContaPagar(id: number, dados: UpdateAccountsPayable): Promise<AccountsPayable> {
    // Recalcular saldo se necessário
    const dadosAtualizados = { ...dados };
    
    if (dados.total_amount_due !== undefined || dados.amount_paid !== undefined) {
      const contaAtual = await this.obterContaPagar(id);
      if (!contaAtual) {
        throw new Error('Conta a pagar não encontrada');
      }

      const novoTotal = dados.total_amount_due ?? contaAtual.total_amount_due;
      const novoPago = dados.amount_paid ?? contaAtual.amount_paid;
      
      dadosAtualizados.balance_due = novoTotal - novoPago;
      
      // Atualizar status automaticamente
      if (dadosAtualizados.balance_due <= 0) {
        dadosAtualizados.status = 'paid';
      } else if (dadosAtualizados.balance_due > 0 && contaAtual.status === 'paid') {
        dadosAtualizados.status = 'open';
      }
    }

    const { data, error } = await supabase
      .from('accounts_payable')
      .update({ ...dadosAtualizados, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar conta a pagar: ${error.message}`);
    }

    return data;
  }

  static async excluirContaPagar(id: number): Promise<void> {
    // Verificar se a conta pode ser excluída
    const conta = await this.obterContaPagar(id);
    if (!conta) {
      throw new Error('Conta a pagar não encontrada');
    }

    if (conta.amount_paid > 0) {
      throw new Error('Não é possível excluir uma conta com pagamentos realizados');
    }

    const { error } = await supabase
      .from('accounts_payable')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Erro ao excluir conta a pagar: ${error.message}`);
    }
  }

  // ============================================================================
  // PAGAMENTOS
  // ============================================================================

  static async registrarPagamento(contaId: number, valorPago: number, dataPagamento?: string): Promise<AccountsPayable> {
    if (valorPago <= 0) {
      throw new Error('Valor do pagamento deve ser maior que zero');
    }

    const conta = await this.obterContaPagar(contaId);
    if (!conta) {
      throw new Error('Conta a pagar não encontrada');
    }

    if (conta.status === 'paid') {
      throw new Error('Esta conta já está paga');
    }

    const novoValorPago = conta.amount_paid + valorPago;
    
    if (novoValorPago > conta.total_amount_due) {
      throw new Error('Valor do pagamento não pode ser maior que o saldo devedor');
    }

    // Atualizar a conta
    const contaAtualizada = await this.atualizarContaPagar(contaId, {
      amount_paid: novoValorPago
    });

    // Registrar o pagamento na tabela de payments
    await supabase
      .from('payments')
      .insert([{
        amount: valorPago,
        payment_date: dataPagamento || new Date().toISOString(),
        payment_type: 'expense',
        accounts_payable_id: contaId,
        description: `Pagamento da conta: ${conta.description}`,
        recorded_by_user_id: 1 // TODO: Pegar do contexto de usuário
      }]);

    return contaAtualizada;
  }

  static async estornarPagamento(contaId: number, valorEstorno: number): Promise<AccountsPayable> {
    if (valorEstorno <= 0) {
      throw new Error('Valor do estorno deve ser maior que zero');
    }

    const conta = await this.obterContaPagar(contaId);
    if (!conta) {
      throw new Error('Conta a pagar não encontrada');
    }

    if (conta.amount_paid < valorEstorno) {
      throw new Error('Valor do estorno não pode ser maior que o valor já pago');
    }

    const novoValorPago = conta.amount_paid - valorEstorno;
    
    return this.atualizarContaPagar(contaId, {
      amount_paid: novoValorPago
    });
  }

  // ============================================================================
  // RELATÓRIOS E ESTATÍSTICAS
  // ============================================================================

  static async obterResumoContasPagar(dataInicio?: string, dataFim?: string): Promise<{
    totalEmAberto: number;
    totalVencidas: number;
    totalPagas: number;
    totalGeral: number;
    quantidadeEmAberto: number;
    quantidadeVencidas: number;
    quantidadePagas: number;
    quantidadeTotal: number;
    proximosVencimentos: AccountsPayableWithRelations[];
  }> {
    let query = supabase
      .from('accounts_payable')
      .select('*, supplier:suppliers!accounts_payable_supplier_id_fkey (name)');

    if (dataInicio) {
      query = query.gte('due_date', dataInicio);
    }

    if (dataFim) {
      query = query.lte('due_date', dataFim);
    }

    const { data: contas, error } = await query;

    if (error) {
      throw new Error(`Erro ao obter resumo das contas: ${error.message}`);
    }

    const hoje = new Date().toISOString().split('T')[0];

    const contasEmAberto = contas?.filter(c => c.status === 'open') || [];
    const contasVencidas = contas?.filter(c => c.status === 'open' && c.due_date < hoje) || [];
    const contasPagas = contas?.filter(c => c.status === 'paid') || [];

    const totalEmAberto = contasEmAberto.reduce((sum, c) => sum + c.balance_due, 0);
    const totalVencidas = contasVencidas.reduce((sum, c) => sum + c.balance_due, 0);
    const totalPagas = contasPagas.reduce((sum, c) => sum + c.total_amount_due, 0);
    const totalGeral = totalEmAberto + totalPagas;

    // Próximos vencimentos (próximos 7 dias)
    const proximosVencimentos = await this.listarContasVencendoEm(7);

    return {
      totalEmAberto,
      totalVencidas,
      totalPagas,
      totalGeral,
      quantidadeEmAberto: contasEmAberto.length,
      quantidadeVencidas: contasVencidas.length,
      quantidadePagas: contasPagas.length,
      quantidadeTotal: contas?.length || 0,
      proximosVencimentos: proximosVencimentos.slice(0, 5) // Próximas 5
    };
  }

  static async obterContasPorFornecedor(): Promise<Record<string, {
    fornecedor: string;
    totalEmAberto: number;
    totalVencidas: number;
    quantidade: number;
  }>> {
    const { data: contas, error } = await supabase
      .from('accounts_payable')
      .select(`
        *,
        supplier:suppliers!accounts_payable_supplier_id_fkey (
          name
        )
      `)
      .eq('status', 'open');

    if (error) {
      throw new Error(`Erro ao obter contas por fornecedor: ${error.message}`);
    }

    const hoje = new Date().toISOString().split('T')[0];

    const agrupado = (contas || []).reduce((acc, conta) => {
      const fornecedor = conta.supplier?.name || 'Sem fornecedor';
      
      if (!acc[fornecedor]) {
        acc[fornecedor] = {
          fornecedor,
          totalEmAberto: 0,
          totalVencidas: 0,
          quantidade: 0
        };
      }

      acc[fornecedor].totalEmAberto += conta.balance_due;
      acc[fornecedor].quantidade += 1;

      if (conta.due_date < hoje) {
        acc[fornecedor].totalVencidas += conta.balance_due;
      }

      return acc;
    }, {} as Record<string, any>);

    return agrupado;
  }

  // ============================================================================
  // AUTOMAÇÃO E LEMBRETES
  // ============================================================================

  static async marcarStatusVencidas(): Promise<number> {
    const hoje = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('accounts_payable')
      .update({ status: 'overdue' })
      .eq('status', 'open')
      .lt('due_date', hoje)
      .select();

    if (error) {
      throw new Error(`Erro ao atualizar status das contas vencidas: ${error.message}`);
    }

    return data?.length || 0;
  }

  static async obterLembretes(): Promise<{
    vencendoHoje: AccountsPayableWithRelations[];
    vencendoAmanha: AccountsPayableWithRelations[];
    vencendoEm3Dias: AccountsPayableWithRelations[];
    vencidas: AccountsPayableWithRelations[];
  }> {
    const hoje = new Date().toISOString().split('T')[0];
    
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const amanhaStr = amanha.toISOString().split('T')[0];

    const em3Dias = new Date();
    em3Dias.setDate(em3Dias.getDate() + 3);
    const em3DiasStr = em3Dias.toISOString().split('T')[0];

    const [vencendoHoje, vencendoAmanha, vencendoEm3Dias, vencidas] = await Promise.all([
      this.listarContasPagar({ status: 'open', vencimentoDe: hoje, vencimentoAte: hoje }),
      this.listarContasPagar({ status: 'open', vencimentoDe: amanhaStr, vencimentoAte: amanhaStr }),
      this.listarContasPagar({ status: 'open', vencimentoDe: hoje, vencimentoAte: em3DiasStr }),
      this.listarContasVencidas()
    ]);

    return {
      vencendoHoje,
      vencendoAmanha,
      vencendoEm3Dias,
      vencidas
    };
  }

  // ============================================================================
  // FORNECEDORES
  // ============================================================================

  static async listarFornecedores(): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name');

    if (error) {
      throw new Error(`Erro ao listar fornecedores: ${error.message}`);
    }

    return data || [];
  }
} 