import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { 
  Package, Save, X, History, TrendingUp, TrendingDown, RotateCcw,
  ArrowUpCircle, ArrowDownCircle, Settings, Calendar, User
} from 'lucide-react';
import { toast } from 'sonner';
import { useProdutos, useAjustarEstoque, useMovimentacoesProduto } from '../../hooks/useProdutos';
import type { Produto, MovimentacaoEstoque } from '../../services/productService';

interface MovimentacaoEstoqueModalProps {
  isOpen: boolean;
  onClose: () => void;
  produto?: Produto | null;
}

export function MovimentacaoEstoqueModal({ isOpen, onClose, produto }: MovimentacaoEstoqueModalProps) {
  const [activeTab, setActiveTab] = useState('movimentacao');
  const [tipoMovimentacao, setTipoMovimentacao] = useState<'entrada' | 'saida'>('entrada');
  const [quantidade, setQuantidade] = useState('');
  const [motivo, setMotivo] = useState('');
  const [produtoSelecionado, setProdutoSelecionado] = useState<string>('');

  const { data: produtos } = useProdutos();
  const ajustarEstoque = useAjustarEstoque();
  const { data: movimentacoes, isLoading: loadingMovimentacoes } = useMovimentacoesProduto(
    produto?.id.toString() || produtoSelecionado,
    100
  );

  useEffect(() => {
    if (produto) {
      setProdutoSelecionado(produto.id.toString());
      setActiveTab('movimentacao');
    } else {
      setProdutoSelecionado('');
    }
  }, [produto, isOpen]);

  const resetForm = () => {
    setTipoMovimentacao('entrada');
    setQuantidade('');
    setMotivo('');
    if (!produto) {
      setProdutoSelecionado('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!produtoSelecionado) {
      toast.error('Selecione um produto');
      return;
    }

    if (!quantidade || parseInt(quantidade) <= 0) {
      toast.error('Quantidade deve ser maior que zero');
      return;
    }

    if (!motivo.trim()) {
      toast.error('Motivo é obrigatório');
      return;
    }

    try {
      let quantidadeAjuste = parseInt(quantidade);
      
      if (tipoMovimentacao === 'saida') {
        quantidadeAjuste = -quantidadeAjuste;
      }

      await ajustarEstoque.mutateAsync({
        produtoId: produtoSelecionado,
        quantidade: quantidadeAjuste,
        motivo: motivo.trim()
      });

      resetForm();
      
      if (!produto) {
        onClose();
      }
    } catch (error) {
      console.error('Erro ao registrar movimentação:', error);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getTipoMovimentacaoIcon = (tipo: string) => {
    const icons = {
      'compra': <ArrowUpCircle className="h-4 w-4 text-green-600" />,
      'venda': <ArrowDownCircle className="h-4 w-4 text-red-600" />,
      'ajuste': <RotateCcw className="h-4 w-4 text-blue-600" />,
      'uso_em_os': <Settings className="h-4 w-4 text-orange-600" />
    };
    return icons[tipo as keyof typeof icons] || <Package className="h-4 w-4" />;
  };

  const getTipoMovimentacaoLabel = (tipo: string) => {
    const labels = {
      'compra': 'Entrada',
      'venda': 'Venda',
      'ajuste': 'Ajuste',
      'uso_em_os': 'Uso em OS'
    };
    return labels[tipo as keyof typeof labels] || tipo;
  };

  const getTipoMovimentacaoBadge = (tipo: string) => {
    const variants = {
      'compra': 'bg-green-100 text-green-800 border-green-200',
      'venda': 'bg-red-100 text-red-800 border-red-200',
      'ajuste': 'bg-blue-100 text-blue-800 border-blue-200',
      'uso_em_os': 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return variants[tipo as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const formatarData = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  const produtoAtual = produto || produtos?.find(p => p.id.toString() === produtoSelecionado);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Movimentação de Estoque
            {produtoAtual && (
              <Badge variant="outline" className="ml-2">
                {produtoAtual.nome}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="movimentacao">Nova Movimentação</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="movimentacao" className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-6">
              {!produto && (
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <Label htmlFor="produto">Produto *</Label>
                      <Select value={produtoSelecionado} onValueChange={setProdutoSelecionado}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o produto" />
                        </SelectTrigger>
                        <SelectContent>
                          {produtos?.map((prod) => (
                            <SelectItem key={prod.id} value={prod.id.toString()}>
                              <div>
                                <div className="font-medium">{prod.nome}</div>
                                <div className="text-sm text-gray-500">
                                  Estoque atual: {prod.estoque_atual}
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <Label>Tipo de Movimentação *</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          tipoMovimentacao === 'entrada'
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setTipoMovimentacao('entrada')}
                      >
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-green-600" />
                          <div>
                            <div className="font-medium">Entrada</div>
                            <div className="text-sm text-gray-500">Compra/Reposição</div>
                          </div>
                        </div>
                      </div>

                      <div
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          tipoMovimentacao === 'saida'
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setTipoMovimentacao('saida')}
                      >
                        <div className="flex items-center gap-2">
                          <TrendingDown className="h-5 w-5 text-red-600" />
                          <div>
                            <div className="font-medium">Saída</div>
                            <div className="text-sm text-gray-500">Ajuste/Perda</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {produtoAtual && (
                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{produtoAtual.nome}</h3>
                        <p className="text-sm text-gray-500">
                          {produtoAtual.descricao || 'Sem descrição'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          {produtoAtual.estoque_atual}
                        </div>
                        <div className="text-sm text-gray-500">Estoque atual</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantidade">Quantidade *</Label>
                      <Input
                        id="quantidade"
                        type="number"
                        min="1"
                        value={quantidade}
                        onChange={(e) => setQuantidade(e.target.value)}
                        placeholder="Digite a quantidade"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Resultado</Label>
                      <div className="p-2 bg-gray-100 rounded-md">
                        {produtoAtual && quantidade ? (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Novo estoque:</span>
                            <span className="font-medium">
                              {tipoMovimentacao === 'entrada' 
                                ? produtoAtual.estoque_atual + parseInt(quantidade || '0')
                                : produtoAtual.estoque_atual - parseInt(quantidade || '0')
                              }
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="motivo">Motivo *</Label>
                    <Textarea
                      id="motivo"
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      placeholder="Descreva o motivo da movimentação..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={ajustarEstoque.isPending}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={ajustarEstoque.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {ajustarEstoque.isPending ? 'Salvando...' : 'Registrar Movimentação'}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="historico" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Histórico de Movimentações
                  {produtoAtual && (
                    <Badge variant="outline">
                      {produtoAtual.nome}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!produtoSelecionado ? (
                  <div className="text-center py-8 text-gray-500">
                    <History className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p>Selecione um produto para ver o histórico</p>
                  </div>
                ) : loadingMovimentacoes ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-16 bg-gray-200 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : !movimentacoes?.length ? (
                  <div className="text-center py-8 text-gray-500">
                    <History className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p>Nenhuma movimentação encontrada</p>
                  </div>
                ) : (
                  <ScrollArea className="h-96">
                    <div className="space-y-3">
                      {movimentacoes.map((movimentacao) => (
                        <div
                          key={movimentacao.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-3">
                            {getTipoMovimentacaoIcon(movimentacao.tipo_movimento)}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {getTipoMovimentacaoLabel(movimentacao.tipo_movimento)}
                                </span>
                                <Badge 
                                  variant="outline" 
                                  className={getTipoMovimentacaoBadge(movimentacao.tipo_movimento)}
                                >
                                  {movimentacao.quantidade_alterada > 0 ? '+' : ''}
                                  {movimentacao.quantidade_alterada}
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-500">
                                {movimentacao.motivo || 'Sem descrição'}
                              </div>
                            </div>
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatarData(movimentacao.timestamp)}
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              <User className="h-3 w-3" />
                              Usuário {movimentacao.usuario_id}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 