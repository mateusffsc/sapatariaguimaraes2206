import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  Package, 
  AlertTriangle, 
  Search, 
  Plus, 
  TrendingDown, 
  PackageX,
  Boxes,
  DollarSign,
  BarChart3,
  Edit,
  Trash2,
  MoreHorizontal
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { ProdutoModal } from '../components/modals/ProdutoModal';
import { MovimentacaoEstoqueModal } from '../components/modals/MovimentacaoEstoqueModal';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { 
  useProdutos, 
  useResumoEstoque,
  useExcluirProduto
} from '../hooks/useProdutos';
import type { Produto } from '../services/productService';

export function EstoquePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [isMovimentacaoModalOpen, setIsMovimentacaoModalOpen] = useState(false);
  const [produtoMovimentacao, setProdutoMovimentacao] = useState<Produto | null>(null);

  // Hooks para dados
  const { data: produtos, isLoading: loadingProdutos } = useProdutos();
  const { data: resumoEstoque, isLoading: loadingResumo } = useResumoEstoque();
  const excluirProduto = useExcluirProduto();

  // Filtros e busca
  const produtosFiltrados = useMemo(() => {
    if (!produtos) return [];

    let produtosFiltrados = produtos;

    // Filtro por busca
    if (searchTerm) {
      produtosFiltrados = produtosFiltrados.filter(produto =>
        produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        produto.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtros por aba
    switch (activeTab) {
      case 'estoque-baixo':
        return produtosFiltrados.filter(p => p.estoque_atual <= 10 && p.estoque_atual > 0);
      case 'sem-estoque':
        return produtosFiltrados.filter(p => p.estoque_atual === 0);
      case 'todos':
      default:
        return produtosFiltrados;
    }
  }, [produtos, searchTerm, activeTab]);

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const getStatusBadge = (estoque: number) => {
    if (estoque === 0) {
      return <Badge variant="destructive" className="bg-red-100 text-red-800">Sem Estoque</Badge>;
    }
    if (estoque <= 10) {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Estoque Baixo</Badge>;
    }
    return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Disponível</Badge>;
  };

  const handleOpenModal = (mode: 'create' | 'edit', produto?: Produto) => {
    setModalMode(mode);
    setSelectedProduto(produto || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduto(null);
  };

  const handleExcluirProduto = async (produto: Produto) => {
    if (confirm(`Tem certeza que deseja excluir o produto "${produto.nome}"?`)) {
      try {
        await excluirProduto.mutateAsync(produto.id.toString());
      } catch (error) {
        console.error('Erro ao excluir produto:', error);
      }
    }
  };

  const handleOpenMovimentacaoModal = (produto: Produto) => {
    setProdutoMovimentacao(produto);
    setIsMovimentacaoModalOpen(true);
  };

  const handleCloseMovimentacaoModal = () => {
    setIsMovimentacaoModalOpen(false);
    setProdutoMovimentacao(null);
  };

  if (loadingProdutos || loadingResumo) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Estoque"
          subtitle="Carregando dados do estoque..."
        />
        <Card>
          <CardHeader className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Gestão de Estoque"
        subtitle="Controle seus produtos e quantidades em estoque"
      />

      {/* Alertas de Estoque Crítico */}
      {(resumoEstoque?.produtos_sem_estoque ?? 0) > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Atenção!</strong> Você tem {resumoEstoque?.produtos_sem_estoque} produto(s) sem estoque.
          </AlertDescription>
        </Alert>
      )}

      {(resumoEstoque?.produtos_estoque_baixo ?? 0) > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Atenção!</strong> Você tem {resumoEstoque?.produtos_estoque_baixo} produto(s) com estoque baixo.
          </AlertDescription>
        </Alert>
      )}

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {resumoEstoque?.total_produtos || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Produtos cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor do Estoque</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatarMoeda(resumoEstoque?.valor_total_estoque || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor total em estoque
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <TrendingDown className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {resumoEstoque?.produtos_estoque_baixo || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Produtos com estoque ≤ 10
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sem Estoque</CardTitle>
            <PackageX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {resumoEstoque?.produtos_sem_estoque || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Produtos esgotados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Lista */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <TabsList className="grid w-full sm:w-fit grid-cols-3">
            <TabsTrigger value="todos" className="flex items-center gap-2">
              <Boxes className="h-4 w-4" />
              Todos ({produtos?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="estoque-baixo" className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Estoque Baixo ({resumoEstoque?.produtos_estoque_baixo || 0})
            </TabsTrigger>
            <TabsTrigger value="sem-estoque" className="flex items-center gap-2">
              <PackageX className="h-4 w-4" />
              Sem Estoque ({resumoEstoque?.produtos_sem_estoque || 0})
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none sm:w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button className="whitespace-nowrap" onClick={() => handleOpenModal('create')}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          </div>
        </div>

        <TabsContent value={activeTab} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Lista de Produtos
                {searchTerm && (
                  <Badge variant="outline" className="ml-2">
                    {produtosFiltrados.length} resultado(s)
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Gerencie seus produtos e controle o estoque
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!produtosFiltrados.length ? (
                <div className="text-center py-12 text-gray-500">
                  <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">
                    {searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">
                    {searchTerm 
                      ? 'Tente buscar por outros termos'
                      : 'Comece cadastrando seus primeiros produtos'
                    }
                  </p>
                  {!searchTerm && (
                    <Button onClick={() => handleOpenModal('create')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Cadastrar Primeiro Produto
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {produtosFiltrados.map((produto) => (
                    <div
                      key={produto.id}
                      className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                        produto.estoque_atual === 0 ? 'border-red-200 bg-red-50' :
                        produto.estoque_atual <= 10 ? 'border-yellow-200 bg-yellow-50' :
                        'border-gray-200'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Package className="h-5 w-5 text-gray-500" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{produto.nome}</h3>
                            {produto.descricao && (
                              <p className="text-sm text-gray-500">{produto.descricao}</p>
                            )}
                          </div>
                          {getStatusBadge(produto.estoque_atual)}
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm text-gray-600 ml-13">
                          <span className="flex items-center gap-1">
                            <Boxes className="h-4 w-4" />
                            Estoque: <strong>{produto.estoque_atual}</strong>
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            Preço: <strong>{formatarMoeda(produto.preco_venda)}</strong>
                          </span>
                          <span className="flex items-center gap-1">
                            <BarChart3 className="h-4 w-4" />
                            Valor Total: <strong>{formatarMoeda(produto.estoque_atual * produto.preco_venda)}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenModal('edit', produto)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenMovimentacaoModal(produto)}>
                              <Package className="h-4 w-4 mr-2" />
                              Movimentar Estoque
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleExcluirProduto(produto)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Produto */}
      <ProdutoModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        produto={selectedProduto}
        mode={modalMode}
      />

      {/* Modal de Movimentação de Estoque */}
      <MovimentacaoEstoqueModal
        isOpen={isMovimentacaoModalOpen}
        onClose={handleCloseMovimentacaoModal}
        produto={produtoMovimentacao}
      />
    </div>
  );
} 