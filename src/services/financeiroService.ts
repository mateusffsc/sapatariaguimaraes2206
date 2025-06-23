import { supabase, type MovimentacaoFinanceira, type ContaBancaria } from '../lib/supabase'

export class FinanceiroService {
  static async listarMovimentacoes(dataInicio?: string, dataFim?: string): Promise<MovimentacaoFinanceira[]> {
    let query = supabase
      .from('movimentacoes_financeiras')
      .select('*')
      .order('created_at', { ascending: false })

    if (dataInicio) {
      query = query.gte('created_at', dataInicio)
    }
    if (dataFim) {
      query = query.lte('created_at', dataFim)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Erro ao listar movimentações: ${error.message}`)
    }

    return data || []
  }

  static async obterMovimentacoesDia(data?: string): Promise<MovimentacaoFinanceira[]> {
    const dataConsulta = data || new Date().toISOString().split('T')[0]
    
    const { data: movimentacoes, error } = await supabase
      .from('movimentacoes_financeiras')
      .select('*')
      .gte('created_at', `${dataConsulta}T00:00:00.000Z`)
      .lt('created_at', `${dataConsulta}T23:59:59.999Z`)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Erro ao obter movimentações do dia: ${error.message}`)
    }

    return movimentacoes || []
  }

  static async criarMovimentacao(movimentacao: Omit<MovimentacaoFinanceira, 'id' | 'created_at' | 'updated_at'>): Promise<MovimentacaoFinanceira> {
    const { data, error } = await supabase
      .from('movimentacoes_financeiras')
      .insert([movimentacao])
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao criar movimentação: ${error.message}`)
    }

    // Se há conta bancária associada, atualizar saldo
    if (data.conta_bancaria_id) {
      await this.atualizarSaldoConta(data.conta_bancaria_id, data.tipo, data.valor)
    }

    return data
  }

  static async atualizarMovimentacao(id: string, movimentacao: Partial<Omit<MovimentacaoFinanceira, 'id' | 'created_at' | 'updated_at'>>): Promise<MovimentacaoFinanceira> {
    const { data, error } = await supabase
      .from('movimentacoes_financeiras')
      .update({ ...movimentacao, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao atualizar movimentação: ${error.message}`)
    }

    return data
  }

  static async excluirMovimentacao(id: string): Promise<void> {
    // Primeiro obter a movimentação para reverter o saldo
    const movimentacao = await this.obterMovimentacaoPorId(id)
    
    const { error } = await supabase
      .from('movimentacoes_financeiras')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Erro ao excluir movimentação: ${error.message}`)
    }

    // Reverter saldo na conta bancária
    if (movimentacao?.conta_bancaria_id) {
      const tipoReverso = movimentacao.tipo === 'entrada' ? 'saida' : 'entrada'
      await this.atualizarSaldoConta(movimentacao.conta_bancaria_id, tipoReverso, movimentacao.valor)
    }
  }

  static async obterMovimentacaoPorId(id: string): Promise<MovimentacaoFinanceira | null> {
    const { data, error } = await supabase
      .from('movimentacoes_financeiras')
      .select('*')
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Erro ao obter movimentação: ${error.message}`)
    }

    return data
  }

  static async obterResumoFinanceiro(dataInicio: string, dataFim: string): Promise<{
    totalEntradas: number
    totalSaidas: number
    saldoPeriodo: number
    movimentacoes: MovimentacaoFinanceira[]
  }> {
    const movimentacoes = await this.listarMovimentacoes(dataInicio, dataFim)
    
    const totalEntradas = movimentacoes
      .filter(m => m.tipo === 'entrada')
      .reduce((sum, m) => sum + m.valor, 0)
    
    const totalSaidas = movimentacoes
      .filter(m => m.tipo === 'saida')
      .reduce((sum, m) => sum + m.valor, 0)

    return {
      totalEntradas,
      totalSaidas,
      saldoPeriodo: totalEntradas - totalSaidas,
      movimentacoes
    }
  }

  static async obterSaldoCaixa(): Promise<number> {
    const { data, error } = await supabase
      .from('contas_bancarias')
      .select('saldo_atual')
      .eq('nome', 'CAIXA DA EMPRESA')
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Erro ao obter saldo do caixa: ${error.message}`)
    }

    return data?.saldo_atual || 0
  }

  // Contas Bancárias
  static async listarContasBancarias(): Promise<ContaBancaria[]> {
    const { data, error } = await supabase
      .from('contas_bancarias')
      .select('*')
      .eq('ativa', true)
      .order('nome', { ascending: true })

    if (error) {
      throw new Error(`Erro ao listar contas bancárias: ${error.message}`)
    }

    return data || []
  }

  static async criarContaBancaria(conta: Omit<ContaBancaria, 'id' | 'created_at' | 'updated_at'>): Promise<ContaBancaria> {
    const { data, error } = await supabase
      .from('contas_bancarias')
      .insert([conta])
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao criar conta bancária: ${error.message}`)
    }

    return data
  }

  static async atualizarContaBancaria(id: string, conta: Partial<Omit<ContaBancaria, 'id' | 'created_at' | 'updated_at'>>): Promise<ContaBancaria> {
    const { data, error } = await supabase
      .from('contas_bancarias')
      .update({ ...conta, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao atualizar conta bancária: ${error.message}`)
    }

    return data
  }

  private static async atualizarSaldoConta(contaId: string, tipo: 'entrada' | 'saida', valor: number): Promise<void> {
    const { data: conta, error: selectError } = await supabase
      .from('contas_bancarias')
      .select('saldo_atual')
      .eq('id', contaId)
      .single()

    if (selectError) {
      throw new Error(`Erro ao obter saldo da conta: ${selectError.message}`)
    }

    const novoSaldo = tipo === 'entrada' 
      ? conta.saldo_atual + valor 
      : conta.saldo_atual - valor

    const { error: updateError } = await supabase
      .from('contas_bancarias')
      .update({ 
        saldo_atual: novoSaldo,
        updated_at: new Date().toISOString()
      })
      .eq('id', contaId)

    if (updateError) {
      throw new Error(`Erro ao atualizar saldo da conta: ${updateError.message}`)
    }
  }

  // Estatísticas e Relatórios
  static async obterEstatisticasMes(ano: number, mes: number): Promise<{
    receitas: number
    despesas: number
    lucro: number
    ordensEntregues: number
    ticketMedio: number
  }> {
    const dataInicio = new Date(ano, mes - 1, 1).toISOString()
    const dataFim = new Date(ano, mes, 0, 23, 59, 59).toISOString()

    // Obter movimentações do mês
    const movimentacoes = await this.listarMovimentacoes(dataInicio, dataFim)
    
    const receitas = movimentacoes
      .filter(m => m.tipo === 'entrada')
      .reduce((sum, m) => sum + m.valor, 0)
    
    const despesas = movimentacoes
      .filter(m => m.tipo === 'saida')
      .reduce((sum, m) => sum + m.valor, 0)

    // Obter ordens entregues do mês
    const { data: ordensEntregues, error } = await supabase
      .from('ordens_servico')
      .select('valor_total')
      .eq('status', 'entregue')
      .gte('data_entrega_real', dataInicio)
      .lte('data_entrega_real', dataFim)

    if (error) {
      throw new Error(`Erro ao obter ordens do mês: ${error.message}`)
    }

    const totalOrdensEntregues = ordensEntregues?.length || 0
    const ticketMedio = totalOrdensEntregues > 0 
      ? ordensEntregues!.reduce((sum, ordem) => sum + ordem.valor_total, 0) / totalOrdensEntregues
      : 0

    return {
      receitas,
      despesas,
      lucro: receitas - despesas,
      ordensEntregues: totalOrdensEntregues,
      ticketMedio
    }
  }
} 