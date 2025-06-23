import { supabase } from '../lib/supabase';
import type { 
  CompanySettings, 
  SystemSettings, 
  CreateCompanySettings, 
  UpdateCompanySettings,
  CreateSystemSettings,
  UpdateSystemSettings
} from '../types/database';

export class ConfigService {
  // ==================== CONFIGURAÇÕES DA EMPRESA ====================
  
  static async obterConfiguracaoEmpresa(): Promise<CompanySettings | null> {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return data;
    } catch (error) {
      console.error('Erro ao obter configuração da empresa:', error);
      throw new Error(`Falha ao obter configuração da empresa: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async criarConfiguracaoEmpresa(dados: CreateCompanySettings): Promise<CompanySettings> {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .insert([dados])
        .select('*')
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Erro ao criar configuração da empresa:', error);
      throw new Error(`Falha ao criar configuração da empresa: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async atualizarConfiguracaoEmpresa(id: number, dados: UpdateCompanySettings): Promise<CompanySettings> {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .update(dados)
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Erro ao atualizar configuração da empresa:', error);
      throw new Error(`Falha ao atualizar configuração da empresa: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async criarOuAtualizarConfiguracaoEmpresa(dados: UpdateCompanySettings): Promise<CompanySettings> {
    try {
      const configuracaoExistente = await this.obterConfiguracaoEmpresa();
      
      if (configuracaoExistente) {
        return await this.atualizarConfiguracaoEmpresa(configuracaoExistente.id, dados);
      } else {
        return await this.criarConfiguracaoEmpresa({
          company_name: dados.company_name || 'Minha Empresa',
          ...dados
        } as CreateCompanySettings);
      }
    } catch (error) {
      console.error('Erro ao criar ou atualizar configuração da empresa:', error);
      throw new Error(`Falha ao salvar configuração da empresa: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // ==================== CONFIGURAÇÕES DO SISTEMA ====================

  static async listarConfiguracoesSistema(categoria?: string): Promise<SystemSettings[]> {
    try {
      let query = supabase
        .from('system_settings')
        .select('*')
        .order('category', { ascending: true })
        .order('setting_key', { ascending: true });

      if (categoria) {
        query = query.eq('category', categoria);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Erro ao listar configurações do sistema:', error);
      throw new Error(`Falha ao listar configurações do sistema: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async obterConfiguracaoSistema(chave: string): Promise<SystemSettings | null> {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('setting_key', chave)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return data;
    } catch (error) {
      console.error('Erro ao obter configuração do sistema:', error);
      throw new Error(`Falha ao obter configuração do sistema: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async definirConfiguracaoSistema(
    chave: string, 
    valor: string | number | boolean | object, 
    opcoes?: {
      tipo?: 'string' | 'number' | 'boolean' | 'json';
      descricao?: string;
      categoria?: string;
      isPublic?: boolean;
    }
  ): Promise<SystemSettings> {
    try {
      const valorString = typeof valor === 'object' ? JSON.stringify(valor) : String(valor);
      const tipo = opcoes?.tipo || this.detectarTipo(valor);
      
      const configuracaoExistente = await this.obterConfiguracaoSistema(chave);
      
      const dadosConfiguracao = {
        setting_key: chave,
        setting_value: valorString,
        setting_type: tipo,
        description: opcoes?.descricao,
        category: opcoes?.categoria || 'geral',
        is_public: opcoes?.isPublic ?? false,
      };

      if (configuracaoExistente) {
        const { data, error } = await supabase
          .from('system_settings')
          .update(dadosConfiguracao)
          .eq('setting_key', chave)
          .select('*')
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('system_settings')
          .insert([dadosConfiguracao])
          .select('*')
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Erro ao definir configuração do sistema:', error);
      throw new Error(`Falha ao definir configuração do sistema: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async obterValorConfiguracao<T = string>(chave: string, valorPadrao?: T): Promise<T> {
    try {
      const configuracao = await this.obterConfiguracaoSistema(chave);
      
      if (!configuracao) {
        return valorPadrao as T;
      }

      return this.converterValor<T>(configuracao.setting_value, configuracao.setting_type);
    } catch (error) {
      console.error(`Erro ao obter valor da configuração ${chave}:`, error);
      return valorPadrao as T;
    }
  }

  static async excluirConfiguracaoSistema(chave: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('system_settings')
        .delete()
        .eq('setting_key', chave);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao excluir configuração do sistema:', error);
      throw new Error(`Falha ao excluir configuração do sistema: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // ==================== CONFIGURAÇÕES PADRÃO ====================

  static async inicializarConfiguracoesDefaut(): Promise<void> {
    try {
      const configuracoesDefault = [
        { chave: 'sistema.nome', valor: 'SapatariaPro', descricao: 'Nome do sistema', categoria: 'sistema' },
        { chave: 'sistema.versao', valor: '1.0.0', descricao: 'Versão do sistema', categoria: 'sistema' },
        { chave: 'backup.automatico', valor: true, descricao: 'Backup automático habilitado', categoria: 'backup' },
        { chave: 'backup.frequencia', valor: 'diario', descricao: 'Frequência do backup automático', categoria: 'backup' },
        { chave: 'notificacoes.email', valor: true, descricao: 'Notificações por email habilitadas', categoria: 'notificacoes' },
        { chave: 'estoque.alerta_minimo', valor: 10, descricao: 'Quantidade mínima para alerta de estoque', categoria: 'estoque' },
        { chave: 'os.prazo_padrao', valor: 7, descricao: 'Prazo padrão para entrega de OS (dias)', categoria: 'os' },
      ];

      for (const config of configuracoesDefault) {
        const existe = await this.obterConfiguracaoSistema(config.chave);
        if (!existe) {
          await this.definirConfiguracaoSistema(
            config.chave, 
            config.valor, 
            {
              descricao: config.descricao,
              categoria: config.categoria,
              isPublic: true
            }
          );
        }
      }
    } catch (error) {
      console.error('Erro ao inicializar configurações padrão:', error);
      throw new Error(`Falha ao inicializar configurações padrão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // ==================== MÉTODOS AUXILIARES ====================

  private static detectarTipo(valor: any): 'string' | 'number' | 'boolean' | 'json' {
    if (typeof valor === 'boolean') return 'boolean';
    if (typeof valor === 'number') return 'number';
    if (typeof valor === 'object') return 'json';
    return 'string';
  }

  private static converterValor<T>(valor: string, tipo: string): T {
    switch (tipo) {
      case 'boolean':
        return (valor === 'true') as T;
      case 'number':
        return Number(valor) as T;
      case 'json':
        try {
          return JSON.parse(valor) as T;
        } catch {
          return valor as T;
        }
      default:
        return valor as T;
    }
  }
} 