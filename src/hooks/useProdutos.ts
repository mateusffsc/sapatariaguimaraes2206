import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ProductService, type Produto } from '../services/productService';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const PRODUTOS_QUERY_KEYS = {
  all: ['produtos'] as const,
  lists: () => [...PRODUTOS_QUERY_KEYS.all, 'list'] as const,
  list: (filters: string) => [...PRODUTOS_QUERY_KEYS.lists(), { filters }] as const,
  details: () => [...PRODUTOS_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...PRODUTOS_QUERY_KEYS.details(), id] as const,
  stats: () => [...PRODUTOS_QUERY_KEYS.all, 'stats'] as const,
  estoque: () => [...PRODUTOS_QUERY_KEYS.all, 'estoque'] as const,
  movimentacoes: (produtoId: string) => [...PRODUTOS_QUERY_KEYS.all, 'movimentacoes', produtoId] as const,
};

// ============================================================================
// HOOKS DE QUERY
// ============================================================================

// Listar todos os produtos
export function useProdutos() {
  return useQuery({
    queryKey: PRODUTOS_QUERY_KEYS.lists(),
    queryFn: ProductService.listarProdutos,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
}

// Buscar produtos por termo
export function useBuscarProdutos(termo: string) {
  return useQuery({
    queryKey: PRODUTOS_QUERY_KEYS.list(termo),
    queryFn: () => ProductService.buscarProdutos(termo),
    enabled: termo.length >= 2, // Só busca com 2+ caracteres
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Obter produto por ID
export function useProduto(id: string) {
  return useQuery({
    queryKey: PRODUTOS_QUERY_KEYS.detail(id),
    queryFn: () => ProductService.obterProdutoPorId(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
}

// Produtos com estoque baixo
export function useProdutosEstoqueBaixo(limite: number = 10) {
  return useQuery({
    queryKey: [...PRODUTOS_QUERY_KEYS.estoque(), 'baixo', limite],
    queryFn: () => ProductService.listarProdutosComEstoqueBaixo(limite),
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Resumo do estoque
export function useResumoEstoque() {
  return useQuery({
    queryKey: PRODUTOS_QUERY_KEYS.stats(),
    queryFn: ProductService.obterResumoEstoque,
    staleTime: 1 * 60 * 1000, // 1 minuto
    gcTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Contagem de produtos
export function useContarProdutos() {
  return useQuery({
    queryKey: [...PRODUTOS_QUERY_KEYS.stats(), 'count'],
    queryFn: ProductService.contarProdutos,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
}

// Movimentações de um produto
export function useMovimentacoesProduto(produtoId: string, limite: number = 50) {
  return useQuery({
    queryKey: PRODUTOS_QUERY_KEYS.movimentacoes(produtoId),
    queryFn: () => ProductService.obterMovimentacoesProduto(produtoId, limite),
    enabled: !!produtoId,
    staleTime: 1 * 60 * 1000, // 1 minuto
    gcTime: 5 * 60 * 1000, // 5 minutos
  });
}

// ============================================================================
// HOOKS DE MUTATION
// ============================================================================

// Criar produto
export function useCriarProduto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (produto: Omit<Produto, 'id' | 'created_at' | 'updated_at'>) =>
      ProductService.criarProduto(produto),
    onSuccess: (novoProduto) => {
      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: PRODUTOS_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PRODUTOS_QUERY_KEYS.stats() });
      queryClient.invalidateQueries({ queryKey: PRODUTOS_QUERY_KEYS.estoque() });

      // Adicionar à cache
      queryClient.setQueryData(
        PRODUTOS_QUERY_KEYS.detail(novoProduto.id.toString()),
        novoProduto
      );

      toast.success('Produto criado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao criar produto:', error);
      toast.error(`Erro ao criar produto: ${error.message}`);
    },
  });
}

// Atualizar produto
export function useAtualizarProduto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      id, 
      produto 
    }: { 
      id: string; 
      produto: Partial<Omit<Produto, 'id' | 'created_at' | 'updated_at'>> 
    }) =>
      ProductService.atualizarProduto(id, produto),
    onSuccess: (produtoAtualizado, { id }) => {
      // Atualizar cache específico
      queryClient.setQueryData(
        PRODUTOS_QUERY_KEYS.detail(id),
        produtoAtualizado
      );

      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: PRODUTOS_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PRODUTOS_QUERY_KEYS.stats() });
      queryClient.invalidateQueries({ queryKey: PRODUTOS_QUERY_KEYS.estoque() });

      toast.success('Produto atualizado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao atualizar produto:', error);
      toast.error(`Erro ao atualizar produto: ${error.message}`);
    },
  });
}

// Excluir produto
export function useExcluirProduto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ProductService.excluirProduto(id),
    onSuccess: (_, id) => {
      // Remover da cache
      queryClient.removeQueries({ queryKey: PRODUTOS_QUERY_KEYS.detail(id) });
      queryClient.removeQueries({ queryKey: PRODUTOS_QUERY_KEYS.movimentacoes(id) });

      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: PRODUTOS_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PRODUTOS_QUERY_KEYS.stats() });
      queryClient.invalidateQueries({ queryKey: PRODUTOS_QUERY_KEYS.estoque() });

      toast.success('Produto excluído com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao excluir produto:', error);
      toast.error(`Erro ao excluir produto: ${error.message}`);
    },
  });
}

// ============================================================================
// HOOKS DE ESTOQUE
// ============================================================================

// Ajustar estoque
export function useAjustarEstoque() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      produtoId, 
      quantidade, 
      motivo 
    }: { 
      produtoId: string; 
      quantidade: number; 
      motivo?: string 
    }) =>
      ProductService.ajustarEstoque(produtoId, quantidade, motivo),
    onSuccess: (_, { produtoId }) => {
      // Invalidar dados do produto
      queryClient.invalidateQueries({ queryKey: PRODUTOS_QUERY_KEYS.detail(produtoId) });
      queryClient.invalidateQueries({ queryKey: PRODUTOS_QUERY_KEYS.movimentacoes(produtoId) });

      // Invalidar listas e estatísticas
      queryClient.invalidateQueries({ queryKey: PRODUTOS_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PRODUTOS_QUERY_KEYS.stats() });
      queryClient.invalidateQueries({ queryKey: PRODUTOS_QUERY_KEYS.estoque() });

      toast.success('Estoque ajustado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao ajustar estoque:', error);
      toast.error(`Erro ao ajustar estoque: ${error.message}`);
    },
  });
}

// Baixar estoque
export function useBaixarEstoque() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      produtoId, 
      quantidade, 
      tipo, 
      referenciaId 
    }: { 
      produtoId: string; 
      quantidade: number; 
      tipo?: 'venda' | 'uso_em_os';
      referenciaId?: number;
    }) =>
      ProductService.baixarEstoque(produtoId, quantidade, tipo, referenciaId),
    onSuccess: (_, { produtoId }) => {
      // Invalidar dados do produto
      queryClient.invalidateQueries({ queryKey: PRODUTOS_QUERY_KEYS.detail(produtoId) });
      queryClient.invalidateQueries({ queryKey: PRODUTOS_QUERY_KEYS.movimentacoes(produtoId) });

      // Invalidar listas e estatísticas
      queryClient.invalidateQueries({ queryKey: PRODUTOS_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PRODUTOS_QUERY_KEYS.stats() });
      queryClient.invalidateQueries({ queryKey: PRODUTOS_QUERY_KEYS.estoque() });

      toast.success('Estoque baixado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao baixar estoque:', error);
      toast.error(`Erro ao baixar estoque: ${error.message}`);
    },
  });
}

// Entrada de mercadoria
export function useEntradaMercadoria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      produtoId, 
      quantidade, 
      motivo,
      fornecedorId
    }: { 
      produtoId: string; 
      quantidade: number; 
      motivo?: string;
      fornecedorId?: number;
    }) =>
      ProductService.entradaMercadoria(produtoId, quantidade, motivo, fornecedorId),
    onSuccess: (_, { produtoId }) => {
      // Invalidar dados do produto
      queryClient.invalidateQueries({ queryKey: PRODUTOS_QUERY_KEYS.detail(produtoId) });
      queryClient.invalidateQueries({ queryKey: PRODUTOS_QUERY_KEYS.movimentacoes(produtoId) });

      // Invalidar listas e estatísticas
      queryClient.invalidateQueries({ queryKey: PRODUTOS_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PRODUTOS_QUERY_KEYS.stats() });
      queryClient.invalidateQueries({ queryKey: PRODUTOS_QUERY_KEYS.estoque() });

      toast.success('Entrada de mercadoria registrada com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao registrar entrada de mercadoria:', error);
      toast.error(`Erro ao registrar entrada: ${error.message}`);
    },
  });
}

// ============================================================================
// HOOKS UTILITÁRIOS
// ============================================================================

// Validar estoque suficiente
export function useValidarEstoque() {
  return useMutation({
    mutationFn: ({ 
      produtoId, 
      quantidade 
    }: { 
      produtoId: string; 
      quantidade: number 
    }) =>
      ProductService.validarEstoqueSuficiente(produtoId, quantidade),
    onError: (error: Error) => {
      console.error('Erro ao validar estoque:', error);
    },
  });
} 