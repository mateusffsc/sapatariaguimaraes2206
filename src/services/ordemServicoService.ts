import { supabase, type OrdemServico, type Cliente } from '../lib/supabase'

export class OrdemServicoService {
  static async listarOrdens(): Promise<OrdemServico[]> {
    const { data, error } = await supabase
      .from('ordens_servico')
      .select(`
        *,
        cliente:clientes(*)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Erro ao listar ordens de serviço: ${error.message}`)
    }

    return data || []
  }

  static async buscarOrdens(termo: string): Promise<OrdemServico[]> {
    const { data, error } = await supabase
      .from('ordens_servico')
      .select(`
        *,
        cliente:clientes(*)
      `)
      .or(`numero.ilike.%${termo}%,artigo.ilike.%${termo}%,descricao.ilike.%${termo}%`)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Erro ao buscar ordens de serviço: ${error.message}`)
    }

    return data || []
  }

  static async buscarOrdensPorCliente(clienteId: string): Promise<OrdemServico[]> {
    const { data, error } = await supabase
      .from('ordens_servico')
      .select(`
        *,
        cliente:clientes(*)
      `)
      .eq('cliente_id', clienteId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Erro ao buscar ordens por cliente: ${error.message}`)
    }

    return data || []
  }

  static async obterOrdemPorId(id: string): Promise<OrdemServico | null> {
    const { data, error } = await supabase
      .from('ordens_servico')
      .select(`
        *,
        cliente:clientes(*)
      `)
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Erro ao obter ordem de serviço: ${error.message}`)
    }

    return data
  }

  static async obterOrdemPorNumero(numero: string): Promise<OrdemServico | null> {
    const { data, error } = await supabase
      .from('ordens_servico')
      .select(`
        *,
        cliente:clientes(*)
      `)
      .eq('numero', numero)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Erro ao obter ordem por número: ${error.message}`)
    }

    return data
  }

  static async criarOrdem(ordem: Omit<OrdemServico, 'id' | 'created_at' | 'updated_at' | 'cliente'>): Promise<OrdemServico> {
    // Gerar número sequencial
    const numero = await this.gerarNumeroOS()
    
    const { data, error } = await supabase
      .from('ordens_servico')
      .insert([{ ...ordem, numero }])
      .select(`
        *,
        cliente:clientes(*)
      `)
      .single()

    if (error) {
      throw new Error(`Erro ao criar ordem de serviço: ${error.message}`)
    }

    return data
  }

  static async atualizarOrdem(id: string, ordem: Partial<Omit<OrdemServico, 'id' | 'created_at' | 'updated_at' | 'cliente'>>): Promise<OrdemServico> {
    // Calcular valor restante se valor_total ou valor_entrada foram atualizados
    if (ordem.valor_total !== undefined || ordem.valor_entrada !== undefined) {
      const ordemAtual = await this.obterOrdemPorId(id)
      if (ordemAtual) {
        const valorTotal = ordem.valor_total ?? ordemAtual.valor_total
        const valorEntrada = ordem.valor_entrada ?? ordemAtual.valor_entrada
        ordem.valor_restante = valorTotal - valorEntrada
      }
    }

    const { data, error } = await supabase
      .from('ordens_servico')
      .update({ ...ordem, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`
        *,
        cliente:clientes(*)
      `)
      .single()

    if (error) {
      throw new Error(`Erro ao atualizar ordem de serviço: ${error.message}`)
    }

    return data
  }

  static async atualizarStatus(id: string, status: OrdemServico['status']): Promise<OrdemServico> {
    const updateData: any = { 
      status, 
      updated_at: new Date().toISOString() 
    }

    // Se estiver marcando como entregue, definir data de entrega real
    if (status === 'entregue') {
      updateData.data_entrega_real = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('ordens_servico')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        cliente:clientes(*)
      `)
      .single()

    if (error) {
      throw new Error(`Erro ao atualizar status da ordem: ${error.message}`)
    }

    return data
  }

  static async excluirOrdem(id: string): Promise<void> {
    const { error } = await supabase
      .from('ordens_servico')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Erro ao excluir ordem de serviço: ${error.message}`)
    }
  }

  static async listarOrdensPorStatus(status: OrdemServico['status']): Promise<OrdemServico[]> {
    const { data, error } = await supabase
      .from('ordens_servico')
      .select(`
        *,
        cliente:clientes(*)
      `)
      .eq('status', status)
      .order('data_entrega_prevista', { ascending: true })

    if (error) {
      throw new Error(`Erro ao listar ordens por status: ${error.message}`)
    }

    return data || []
  }

  static async contarOrdensPorStatus(): Promise<Record<OrdemServico['status'], number>> {
    const { data, error } = await supabase
      .from('ordens_servico')
      .select('status')

    if (error) {
      throw new Error(`Erro ao contar ordens por status: ${error.message}`)
    }

    const counts = {
      'orçamento': 0,
      'em-andamento': 0,
      'pronto': 0,
      'entregue': 0,
      'cancelada': 0
    }

    data?.forEach(ordem => {
      counts[ordem.status]++
    })

    return counts
  }

  static async obterOrdensVencidas(): Promise<OrdemServico[]> {
    const hoje = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('ordens_servico')
      .select(`
        *,
        cliente:clientes(*)
      `)
      .in('status', ['em-andamento', 'pronto'])
      .lt('data_entrega_prevista', hoje)
      .order('data_entrega_prevista', { ascending: true })

    if (error) {
      throw new Error(`Erro ao obter ordens vencidas: ${error.message}`)
    }

    return data || []
  }

  static async calcularTicketMedio(): Promise<number> {
    const { data, error } = await supabase
      .from('ordens_servico')
      .select('valor_total')
      .eq('status', 'entregue')

    if (error) {
      throw new Error(`Erro ao calcular ticket médio: ${error.message}`)
    }

    if (!data || data.length === 0) return 0

    const total = data.reduce((sum, ordem) => sum + ordem.valor_total, 0)
    return total / data.length
  }

  private static async gerarNumeroOS(): Promise<string> {
    const { data, error } = await supabase
      .from('ordens_servico')
      .select('numero')
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      throw new Error(`Erro ao gerar número da OS: ${error.message}`)
    }

    if (!data || data.length === 0) {
      return 'OS-000001'
    }

    const ultimoNumero = data[0].numero
    const numeroAtual = parseInt(ultimoNumero.split('-')[1]) + 1
    return `OS-${numeroAtual.toString().padStart(6, '0')}`
  }
} 