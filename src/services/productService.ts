import { supabase } from '../lib/supabase';
import type { 
  Product, 
  StockMovement, 
  StockMovementType,
  CreateProduct, 
  UpdateProduct,
  CreateStockMovement,
  StockMovementWithRelations 
} from '../types/database';

// ============================================================================
// INTERFACES PARA O SISTEMA (Português)
// ============================================================================

export interface Produto {
  id: number;
  nome: string;
  descricao?: string;
  preco_venda: number;
  estoque_atual: number;
  created_at: string;
  updated_at: string;
}

export interface MovimentacaoEstoque {
  id: number;
  produto_id: number;
  tipo_movimento: 'compra' | 'venda' | 'ajuste' | 'uso_em_os';
  quantidade_alterada: number;
  motivo?: string;
  timestamp: string;
  usuario_id: number;
}

export interface ProdutoComEstoque extends Produto {
  movimentacoes_recentes?: MovimentacaoEstoque[];
  total_vendido?: number;
  valor_total_estoque?: number;
  precisa_reposicao?: boolean;
}

// ============================================================================
// MAPPERS ESPECÍFICOS PARA PRODUTOS
// ============================================================================

class ProductMapper {
  // Product EN → Produto PT
  static productToProduto(product: Product): Produto {
    return {
      id: product.id,
      nome: product.name,
      descricao: product.description,
      preco_venda: product.price,
      estoque_atual: product.stock_quantity,
      created_at: product.created_at,
      updated_at: product.updated_at,
    };
  }

  // Produto PT → CreateProduct EN
  static produtoToCreateProduct(produto: Partial<Produto>): CreateProduct {
    return {
      name: produto.nome || '',
      description: produto.descricao,
      price: produto.preco_venda || 0,
      stock_quantity: produto.estoque_atual || 0,
    };
  }

  // StockMovement EN → MovimentacaoEstoque PT
  static stockMovementToMovimentacao(movement: StockMovement, quantidadeAnterior: number = 0): MovimentacaoEstoque {
    return {
      id: movement.id,
      produto_id: movement.product_id,
      tipo_movimento: this.mapMovementTypeToPT(movement.movement_type),
      quantidade_alterada: movement.quantity_change,
      motivo: movement.description,
      timestamp: movement.timestamp,
      usuario_id: movement.created_by_user_id,
    };
  }

  // Mapear tipos de movimento
  static mapMovementTypeToPT(type: StockMovementType): 'compra' | 'venda' | 'ajuste' | 'uso_em_os' {
    const typeMap: Record<StockMovementType, 'compra' | 'venda' | 'ajuste' | 'uso_em_os'> = {
      'purchase': 'compra',
      'sale': 'venda',
      'adjustment': 'ajuste',
      'usage_in_os': 'uso_em_os',
    };
    return typeMap[type] || 'ajuste';
  }

  static mapMovementTypeToEN(type: 'compra' | 'venda' | 'ajuste' | 'uso_em_os'): StockMovementType {
    const typeMap: Record<'compra' | 'venda' | 'ajuste' | 'uso_em_os', StockMovementType> = {
      'compra': 'purchase',
      'venda': 'sale',
      'ajuste': 'adjustment',
      'uso_em_os': 'usage_in_os',
    };
    return typeMap[type] || 'adjustment';
  }

  // Converter arrays
  static productsToProdutos(products: Product[]): Produto[] {
    return products.map(product => this.productToProduto(product));
  }

  static stockMovementsToMovimentacoes(movements: StockMovement[]): MovimentacaoEstoque[] {
    return movements.map(movement => this.stockMovementToMovimentacao(movement));
  }
}

// ============================================================================
// SERVIÇO PRINCIPAL DE PRODUTOS
// ============================================================================

export class ProductService {
  // ============================================================================
  // MÉTODOS DE LISTAGEM E BUSCA
  // ============================================================================

  static async listarProdutos(): Promise<Produto[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Erro ao listar produtos: ${error.message}`);
    }

    return (data || []).map((product: any): Produto => ({
      id: product.id,
      nome: product.name,
      descricao: product.description,
      preco_venda: product.price,
      estoque_atual: product.stock_quantity,
      created_at: product.created_at,
      updated_at: product.updated_at,
    }));
  }

  static async buscarProdutos(termo: string): Promise<Produto[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or(`name.ilike.%${termo}%,description.ilike.%${termo}%`)
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Erro ao buscar produtos: ${error.message}`);
    }

    return (data || []).map((product: any): Produto => ({
      id: product.id,
      nome: product.name,
      descricao: product.description,
      preco_venda: product.price,
      estoque_atual: product.stock_quantity,
      created_at: product.created_at,
      updated_at: product.updated_at,
    }));
  }

  static async obterProdutoPorId(id: string): Promise<Produto | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Erro ao obter produto: ${error.message}`);
    }

    if (!data) return null;

    return {
      id: data.id,
      nome: data.name,
      descricao: data.description,
      preco_venda: data.price,
      estoque_atual: data.stock_quantity,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  static async listarProdutosComEstoqueBaixo(limite: number = 10): Promise<Produto[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .lte('stock_quantity', limite)
      .order('stock_quantity', { ascending: true });

    if (error) {
      throw new Error(`Erro ao listar produtos com estoque baixo: ${error.message}`);
    }

    return (data || []).map((product: any): Produto => ({
      id: product.id,
      nome: product.name,
      descricao: product.description,
      preco_venda: product.price,
      estoque_atual: product.stock_quantity,
      created_at: product.created_at,
      updated_at: product.updated_at,
    }));
  }

  // ============================================================================
  // MÉTODOS DE CRIAÇÃO E ATUALIZAÇÃO
  // ============================================================================

  static async criarProduto(produto: Omit<Produto, 'id' | 'created_at' | 'updated_at'>): Promise<Produto> {
    const { data, error } = await supabase
      .from('products')
      .insert([{
        name: produto.nome,
        description: produto.descricao,
        price: produto.preco_venda,
        stock_quantity: produto.estoque_atual,
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar produto: ${error.message}`);
    }

    // Registrar movimentação inicial se houver estoque
    if (produto.estoque_atual > 0) {
      await this.registrarMovimentacaoEstoque({
        product_id: data.id,
        movement_type: 'adjustment',
        quantity_change: produto.estoque_atual,
        description: 'Estoque inicial do produto',
        created_by_user_id: 1,
      });
    }

    return {
      id: data.id,
      nome: data.name,
      descricao: data.description,
      preco_venda: data.price,
      estoque_atual: data.stock_quantity,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  static async atualizarProduto(
    id: string, 
    produto: Partial<Omit<Produto, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<Produto> {
    const updateData: any = {};
    
    if (produto.nome !== undefined) updateData.name = produto.nome;
    if (produto.descricao !== undefined) updateData.description = produto.descricao;
    if (produto.preco_venda !== undefined) updateData.price = produto.preco_venda;
    if (produto.estoque_atual !== undefined) updateData.stock_quantity = produto.estoque_atual;
    
    const { data, error } = await supabase
      .from('products')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar produto: ${error.message}`);
    }

    return {
      id: data.id,
      nome: data.name,
      descricao: data.description,
      preco_venda: data.price,
      estoque_atual: data.stock_quantity,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  static async excluirProduto(id: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Erro ao excluir produto: ${error.message}`);
    }
  }

  // ============================================================================
  // MÉTODOS DE CONTROLE DE ESTOQUE
  // ============================================================================

  static async ajustarEstoque(
    produtoId: string, 
    quantidade: number, 
    motivo: string = 'Ajuste de estoque'
  ): Promise<void> {
    const produto = await this.obterProdutoPorId(produtoId);
    if (!produto) {
      throw new Error('Produto não encontrado');
    }

    const novoEstoque = produto.estoque_atual + quantidade;
    if (novoEstoque < 0) {
      throw new Error('Estoque não pode ficar negativo');
    }

    const { error: updateError } = await supabase
      .from('products')
      .update({ 
        stock_quantity: novoEstoque,
        updated_at: new Date().toISOString()
      })
      .eq('id', produtoId);

    if (updateError) {
      throw new Error(`Erro ao atualizar estoque: ${updateError.message}`);
    }

    await this.registrarMovimentacaoEstoque({
      product_id: parseInt(produtoId),
      movement_type: 'adjustment',
      quantity_change: quantidade,
      description: motivo,
      created_by_user_id: 1,
    });
  }

  static async baixarEstoque(
    produtoId: string, 
    quantidade: number, 
    tipo: 'venda' | 'uso_em_os' = 'venda',
    referenciaId?: number
  ): Promise<void> {
    if (quantidade <= 0) {
      throw new Error('Quantidade deve ser positiva');
    }

    const produto = await this.obterProdutoPorId(produtoId);
    if (!produto) {
      throw new Error('Produto não encontrado');
    }

    if (produto.estoque_atual < quantidade) {
      throw new Error(`Estoque insuficiente. Disponível: ${produto.estoque_atual}, Solicitado: ${quantidade}`);
    }

    const novoEstoque = produto.estoque_atual - quantidade;
    const { error: updateError } = await supabase
      .from('products')
      .update({ 
        stock_quantity: novoEstoque,
        updated_at: new Date().toISOString()
      })
      .eq('id', produtoId);

    if (updateError) {
      throw new Error(`Erro ao baixar estoque: ${updateError.message}`);
    }

    const movementType = tipo === 'venda' ? 'sale' : 'usage_in_os';
    await this.registrarMovimentacaoEstoque({
      product_id: parseInt(produtoId),
      movement_type: movementType,
      quantity_change: -quantidade,
      description: `Baixa de estoque - ${tipo}`,
      sale_item_id: tipo === 'venda' ? referenciaId : undefined,
      service_order_item_id: tipo === 'uso_em_os' ? referenciaId : undefined,
      created_by_user_id: 1,
    });
  }

  static async entradaMercadoria(
    produtoId: string, 
    quantidade: number, 
    motivo: string = 'Entrada de mercadoria',
    fornecedorId?: number
  ): Promise<void> {
    if (quantidade <= 0) {
      throw new Error('Quantidade deve ser positiva');
    }

    const produto = await this.obterProdutoPorId(produtoId);
    if (!produto) {
      throw new Error('Produto não encontrado');
    }

    const novoEstoque = produto.estoque_atual + quantidade;
    const { error: updateError } = await supabase
      .from('products')
      .update({ 
        stock_quantity: novoEstoque,
        updated_at: new Date().toISOString()
      })
      .eq('id', produtoId);

    if (updateError) {
      throw new Error(`Erro ao atualizar estoque: ${updateError.message}`);
    }

    await this.registrarMovimentacaoEstoque({
      product_id: parseInt(produtoId),
      movement_type: 'purchase',
      quantity_change: quantidade,
      description: motivo,
      created_by_user_id: 1,
    });
  }

  // ============================================================================
  // MÉTODOS DE MOVIMENTAÇÃO
  // ============================================================================

  private static async registrarMovimentacaoEstoque(movementData: any): Promise<void> {
    const { error } = await supabase
      .from('stock_movements')
      .insert([movementData]);

    if (error) {
      throw new Error(`Erro ao registrar movimentação: ${error.message}`);
    }
  }

  static async obterMovimentacoesProduto(produtoId: string, limite: number = 50): Promise<MovimentacaoEstoque[]> {
    const { data, error } = await supabase
      .from('stock_movements')
      .select('*')
      .eq('product_id', produtoId)
      .order('timestamp', { ascending: false })
      .limit(limite);

    if (error) {
      throw new Error(`Erro ao obter movimentações: ${error.message}`);
    }

    return (data || []).map((movement: any): MovimentacaoEstoque => ({
      id: movement.id,
      produto_id: movement.product_id,
      tipo_movimento: ProductService.mapMovementTypeToPT(movement.movement_type),
      quantidade_alterada: movement.quantity_change,
      motivo: movement.description,
      timestamp: movement.timestamp,
      usuario_id: movement.created_by_user_id,
    }));
  }

  private static mapMovementTypeToPT(type: string): 'compra' | 'venda' | 'ajuste' | 'uso_em_os' {
    const typeMap: Record<string, 'compra' | 'venda' | 'ajuste' | 'uso_em_os'> = {
      'purchase': 'compra',
      'sale': 'venda',
      'adjustment': 'ajuste',
      'usage_in_os': 'uso_em_os',
    };
    return typeMap[type] || 'ajuste';
  }

  // ============================================================================
  // MÉTODOS DE RELATÓRIOS E ESTATÍSTICAS
  // ============================================================================

  static async obterResumoEstoque(): Promise<{
    total_produtos: number;
    valor_total_estoque: number;
    produtos_estoque_baixo: number;
    produtos_sem_estoque: number;
  }> {
    const { data, error } = await supabase
      .from('products')
      .select('stock_quantity, price');

    if (error) {
      throw new Error(`Erro ao obter resumo do estoque: ${error.message}`);
    }

    const produtos = data || [];
    
    return {
      total_produtos: produtos.length,
      valor_total_estoque: produtos.reduce((sum: number, p: any) => sum + (p.stock_quantity * p.price), 0),
      produtos_estoque_baixo: produtos.filter((p: any) => p.stock_quantity <= 10 && p.stock_quantity > 0).length,
      produtos_sem_estoque: produtos.filter((p: any) => p.stock_quantity === 0).length,
    };
  }

  static async contarProdutos(): Promise<number> {
    const { count, error } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    if (error) {
      throw new Error(`Erro ao contar produtos: ${error.message}`);
    }

    return count || 0;
  }

  static async validarEstoqueSuficiente(produtoId: string, quantidadeNecessaria: number): Promise<boolean> {
    const produto = await this.obterProdutoPorId(produtoId);
    return produto ? produto.estoque_atual >= quantidadeNecessaria : false;
  }
}

export default ProductService; 