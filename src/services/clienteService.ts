import { supabase, type Cliente } from '../lib/supabase'

export class ClienteService {
  static async listarClientes(): Promise<Cliente[]> {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('nome', { ascending: true })

    if (error) {
      throw new Error(`Erro ao listar clientes: ${error.message}`)
    }

    return data || []
  }

  static async buscarClientes(termo: string): Promise<Cliente[]> {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .or(`nome.ilike.%${termo}%,cpf.ilike.%${termo}%,telefone.ilike.%${termo}%`)
      .order('nome', { ascending: true })

    if (error) {
      throw new Error(`Erro ao buscar clientes: ${error.message}`)
    }

    return data || []
  }

  static async obterClientePorId(id: string): Promise<Cliente | null> {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Erro ao obter cliente: ${error.message}`)
    }

    return data
  }

  static async obterClientePorCPF(cpf: string): Promise<Cliente | null> {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('cpf', cpf)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Erro ao obter cliente por CPF: ${error.message}`)
    }

    return data
  }

  static async criarCliente(cliente: Omit<Cliente, 'id' | 'created_at' | 'updated_at'>): Promise<Cliente> {
    const { data, error } = await supabase
      .from('clientes')
      .insert([cliente])
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao criar cliente: ${error.message}`)
    }

    return data
  }

  static async atualizarCliente(id: string, cliente: Partial<Omit<Cliente, 'id' | 'created_at' | 'updated_at'>>): Promise<Cliente> {
    const { data, error } = await supabase
      .from('clientes')
      .update({ ...cliente, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao atualizar cliente: ${error.message}`)
    }

    return data
  }

  static async excluirCliente(id: string): Promise<void> {
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Erro ao excluir cliente: ${error.message}`)
    }
  }

  static async listarClientesAtivos(): Promise<Cliente[]> {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('status', 'ativo')
      .order('nome', { ascending: true })

    if (error) {
      throw new Error(`Erro ao listar clientes ativos: ${error.message}`)
    }

    return data || []
  }

  static async contarClientes(): Promise<number> {
    const { count, error } = await supabase
      .from('clientes')
      .select('*', { count: 'exact', head: true })

    if (error) {
      throw new Error(`Erro ao contar clientes: ${error.message}`)
    }

    return count || 0
  }

  static async contarClientesAtivos(): Promise<number> {
    const { count, error } = await supabase
      .from('clientes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ativo')

    if (error) {
      throw new Error(`Erro ao contar clientes ativos: ${error.message}`)
    }

    return count || 0
  }
} 