import { supabase } from '@/lib/supabase';
import { Client, CreateClient, UpdateClient } from '@/types/database';
import { Cliente } from '@/lib/supabase'; // Tipo português existente

/**
 * Serviço de Clientes ADAPTADO
 * Conecta-se à tabela 'clients' (inglês) no banco
 * Retorna dados em português para manter compatibilidade
 */
export class ClienteServiceNew {
  // ==================== ADAPTAÇÃO PT → EN ====================
  private static adaptarClienteParaClient(cliente: Omit<Cliente, 'id' | 'created_at' | 'updated_at'> & {
    rua?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    estado?: string;
  }): CreateClient {
    return {
      name: cliente.nome,
      cpf: cliente.cpf || undefined,
      phone: cliente.telefone || undefined,
      email: cliente.email || undefined,
      cep: cliente.cep || undefined,
      address: cliente.endereco || undefined,
      street: (cliente as any).rua || undefined,
      number: (cliente as any).numero || undefined,
      complement: (cliente as any).complemento || undefined,
      neighborhood: (cliente as any).bairro || undefined,
      city: cliente.cidade || undefined,
      state: (cliente as any).estado || undefined
    };
  }

  private static adaptarClientParaCliente(client: Client): Cliente & {
    rua?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    estado?: string;
  } {
    return {
      id: client.id.toString(),
      nome: client.name,
      cpf: client.cpf || '',
      telefone: client.phone || '',
      email: client.email || '',
      cep: client.cep || '',
      endereco: client.address || '',
      cidade: client.city || '',
      rua: client.street || '',
      numero: client.number || '',
      complemento: client.complement || '',
      bairro: client.neighborhood || '',
      estado: client.state || '',
      status: 'ativo', // Campo não existe na nova tabela
      created_at: client.created_at,
      updated_at: client.updated_at
    };
  }

  // ==================== CRUD BÁSICO ====================
  static async criarCliente(cliente: Omit<Cliente, 'id' | 'created_at' | 'updated_at'>): Promise<Cliente> {
    try {
      const clientData = this.adaptarClienteParaClient(cliente);
      
      const { data, error } = await supabase
        .from('clients')
        .insert([clientData])
        .select('*')
        .single();

      if (error) throw error;
      
      return this.adaptarClientParaCliente(data);
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      throw new Error(`Falha ao criar cliente: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async listarClientes(): Promise<(Cliente & {
    rua?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    estado?: string;
  })[]> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      
      return (data || []).map(client => this.adaptarClientParaCliente(client));
    } catch (error) {
      console.error('Erro ao listar clientes:', error);
      throw new Error(`Falha ao listar clientes: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async obterClientePorId(id: string): Promise<(Cliente & {
    rua?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    estado?: string;
  }) | null> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', parseInt(id))
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return this.adaptarClientParaCliente(data);
    } catch (error) {
      console.error('Erro ao obter cliente:', error);
      throw new Error(`Falha ao obter cliente: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async atualizarCliente(id: string, updates: Partial<Omit<Cliente, 'id' | 'created_at' | 'updated_at'>>): Promise<Cliente> {
    try {
      const updateData: Partial<CreateClient> = {};
      
      if (updates.nome) updateData.name = updates.nome;
      if (updates.cpf !== undefined) updateData.cpf = updates.cpf || undefined;
      if (updates.telefone !== undefined) updateData.phone = updates.telefone || undefined;
      if (updates.email !== undefined) updateData.email = updates.email || undefined;
      if (updates.cep !== undefined) updateData.cep = updates.cep || undefined;
      if (updates.endereco !== undefined) updateData.address = updates.endereco || undefined;
      if (updates.cidade !== undefined) updateData.city = updates.cidade || undefined;

      const { data, error } = await supabase
        .from('clients')
        .update(updateData)
        .eq('id', parseInt(id))
        .select('*')
        .single();

      if (error) throw error;
      
      return this.adaptarClientParaCliente(data);
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      throw new Error(`Falha ao atualizar cliente: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async excluirCliente(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', parseInt(id));

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      throw new Error(`Falha ao excluir cliente: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // ==================== VALIDAÇÕES ====================
  static async verificarTelefoneUnico(telefone: string, excludeId?: string): Promise<boolean> {
    try {
      let query = supabase
        .from('clients')
        .select('id')
        .eq('phone', telefone);

      if (excludeId) {
        query = query.neq('id', parseInt(excludeId));
      }

      const { data, error } = await query;

      if (error) throw error;
      
      return (data || []).length === 0;
    } catch (error) {
      console.error('Erro ao verificar telefone:', error);
      return false;
    }
  }

  static async verificarEmailUnico(email: string, excludeId?: string): Promise<boolean> {
    try {
      let query = supabase
        .from('clients')
        .select('id')
        .eq('email', email);

      if (excludeId) {
        query = query.neq('id', parseInt(excludeId));
      }

      const { data, error } = await query;

      if (error) throw error;
      
      return (data || []).length === 0;
    } catch (error) {
      console.error('Erro ao verificar email:', error);
      return false;
    }
  }

  static async verificarCpfUnico(cpf: string, excludeId?: string): Promise<boolean> {
    try {
      let query = supabase
        .from('clients')
        .select('id')
        .eq('cpf', cpf);

      if (excludeId) {
        query = query.neq('id', parseInt(excludeId));
      }

      const { data, error } = await query;

      if (error) throw error;
      
      return (data || []).length === 0;
    } catch (error) {
      console.error('Erro ao verificar CPF:', error);
      return false;
    }
  }

  // ==================== BUSCA E FILTROS ====================
  static async buscarClientes(termo: string): Promise<Cliente[]> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .or(`name.ilike.%${termo}%,phone.ilike.%${termo}%,email.ilike.%${termo}%,cpf.ilike.%${termo}%`)
        .order('name', { ascending: true });

      if (error) throw error;
      
      return (data || []).map(client => this.adaptarClientParaCliente(client));
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      throw new Error(`Falha ao buscar clientes: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async listarClientesAtivos(): Promise<Cliente[]> {
    // Como não temos campo status na nova tabela, retornamos todos
    return this.listarClientes();
  }

  static async contarClientesAtivos(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      
      return count || 0;
    } catch (error) {
      console.error('Erro ao contar clientes:', error);
      throw new Error(`Falha ao contar clientes: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // ==================== MÉTODOS ESPECÍFICOS PARA NOVA TABELA ====================
  static async criarClienteDireto(clientData: CreateClient): Promise<Client> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([clientData])
        .select('*')
        .single();

      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Erro ao criar cliente direto:', error);
      throw new Error(`Falha ao criar cliente: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async obterClientePorTelefone(telefone: string): Promise<Client | null> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('phone', telefone)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao obter cliente por telefone:', error);
      throw new Error(`Falha ao buscar cliente: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async obterClientePorEmail(email: string): Promise<Client | null> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao obter cliente por email:', error);
      throw new Error(`Falha ao buscar cliente: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // ==================== MIGRAÇÃO DE DADOS ====================
  static async migrarDadosAntigos(): Promise<void> {
    try {
      // Buscar clientes da tabela antiga
      const { data: clientesAntigos, error: errorAntigos } = await supabase
        .from('clientes')
        .select('*');

      if (errorAntigos) throw errorAntigos;

      if (!clientesAntigos || clientesAntigos.length === 0) {
        console.log('Nenhum cliente encontrado na tabela antiga');
        return;
      }

      // Migrar para tabela nova
      const clientesNovos: CreateClient[] = clientesAntigos.map(cliente => ({
        name: cliente.nome,
        phone: cliente.telefone || undefined,
        email: cliente.email || undefined,
        address: cliente.endereco || undefined
      }));

      const { error: errorNovos } = await supabase
        .from('clients')
        .insert(clientesNovos);

      if (errorNovos) throw errorNovos;

      console.log(`${clientesAntigos.length} clientes migrados com sucesso!`);
    } catch (error) {
      console.error('Erro na migração:', error);
      throw new Error(`Falha na migração: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // Para manter compatibilidade com métodos específicos
  static async obterClientePorCPF(cpf: string): Promise<Cliente | null> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('cpf', cpf)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return this.adaptarClientParaCliente(data);
    } catch (error) {
      console.error('Erro ao obter cliente por CPF:', error);
      throw new Error(`Falha ao buscar cliente: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }
}

export default ClienteServiceNew; 