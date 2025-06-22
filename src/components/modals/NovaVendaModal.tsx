import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Separator } from '../ui/separator';
import { Switch } from '../ui/switch';
import { 
  ShoppingCart, 
  User, 
  Plus, 
  Minus, 
  Trash2, 
  Package, 
  DollarSign,
  CreditCard,
  AlertCircle
} from 'lucide-react';
import { useClientes } from '../../hooks/useClientes';
import { useProdutos } from '../../hooks/useProdutos';
import { useCreateVendaCompleta } from '../../hooks/useVendas';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'sonner';
import { CreateSaleData, Client } from '../../types/database';
import { Produto } from '../../services/productService';
import { ClienteInlineForm } from './ClienteInlineForm';

const FORMAS_PAGAMENTO = [
  { value: 'dinheiro', label: 'Dinheiro', icon: '💰' },
  { value: 'pix', label: 'PIX', icon: '📱' },
  { value: 'debito', label: 'Cartão de Débito', icon: '💳' },
  { value: 'credito', label: 'Cartão de Crédito', icon: '💳' },
  { value: 'transferencia', label: 'Transferência', icon: '🏦' },
];

interface NovaVendaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ItemVenda {
  produtoId: number;
  produto: Produto;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
}

export function NovaVendaModal({ isOpen, onClose }: NovaVendaModalProps) {
  const [clienteId, setClienteId] = useState<string>('');
  const [itensVenda, setItensVenda] = useState<ItemVenda[]>([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState<string>('');
  const [quantidadeProduto, setQuantidadeProduto] = useState<number>(1);
  const [formaPagamento, setFormaPagamento] = useState<string>('dinheiro');
  const [mostrarNovoCliente, setMostrarNovoCliente] = useState<boolean>(false);

  const { data: clientes, refetch: refetchClientes } = useClientes();
  const { data: produtos } = useProdutos();
  const criarVenda = useCreateVendaCompleta();
  const { user } = useAuth();

  // Cálculos
  const totalVenda = useMemo(() => {
    return itensVenda.reduce((total, item) => total + item.subtotal, 0);
  }, [itensVenda]);

  const quantidadeItens = useMemo(() => {
    return itensVenda.reduce((total, item) => total + item.quantidade, 0);
  }, [itensVenda]);

  const resetForm = () => {
    setClienteId('');
    setItensVenda([]);
    setProdutoSelecionado('');
    setQuantidadeProduto(1);
    setFormaPagamento('dinheiro');
    setMostrarNovoCliente(false);
  };

  const handleAddProduto = () => {
    if (!produtoSelecionado) {
      toast.error('Selecione um produto');
      return;
    }

    if (quantidadeProduto <= 0) {
      toast.error('Quantidade deve ser maior que zero');
      return;
    }

    const produto = produtos?.find(p => p.id.toString() === produtoSelecionado);
    if (!produto) {
      toast.error('Produto não encontrado');
      return;
    }

    // Verificar estoque suficiente
    const quantidadeJaAdicionada = itensVenda
      .filter(item => item.produtoId === produto.id)
      .reduce((sum, item) => sum + item.quantidade, 0);

    if (quantidadeJaAdicionada + quantidadeProduto > produto.estoque_atual) {
      toast.error(`Estoque insuficiente. Disponível: ${produto.estoque_atual - quantidadeJaAdicionada}`);
      return;
    }

    // Verificar se produto já foi adicionado
    const itemExistente = itensVenda.find(item => item.produtoId === produto.id);
    
    if (itemExistente) {
      // Atualizar item existente
      const novosItens = itensVenda.map(item => 
        item.produtoId === produto.id 
          ? {
              ...item,
              quantidade: item.quantidade + quantidadeProduto,
              subtotal: (item.quantidade + quantidadeProduto) * item.precoUnitario
            }
          : item
      );
      setItensVenda(novosItens);
    } else {
      // Adicionar novo item
      const novoItem: ItemVenda = {
        produtoId: produto.id,
        produto,
        quantidade: quantidadeProduto,
        precoUnitario: produto.preco_venda,
        subtotal: quantidadeProduto * produto.preco_venda
      };
      setItensVenda([...itensVenda, novoItem]);
    }

    // Reset campos de produto
    setProdutoSelecionado('');
    setQuantidadeProduto(1);
  };

  const handleUpdateQuantidade = (produtoId: number, novaQuantidade: number) => {
    if (novaQuantidade <= 0) {
      handleRemoveProduto(produtoId);
      return;
    }

    const produto = produtos?.find(p => p.id === produtoId);
    if (!produto) return;

    // Verificar estoque
    if (novaQuantidade > produto.estoque_atual) {
      toast.error(`Estoque insuficiente. Disponível: ${produto.estoque_atual}`);
      return;
    }

    const novosItens = itensVenda.map(item => 
      item.produtoId === produtoId 
        ? {
            ...item,
            quantidade: novaQuantidade,
            subtotal: novaQuantidade * item.precoUnitario
          }
        : item
    );
    setItensVenda(novosItens);
  };

  const handleRemoveProduto = (produtoId: number) => {
    setItensVenda(itensVenda.filter(item => item.produtoId !== produtoId));
  };

  const handleClienteCriado = async (novoCliente: any) => {
    // Atualizar lista de clientes
    await refetchClientes();
    
    // Selecionar o novo cliente
    setClienteId(novoCliente.id.toString());
    
    // Ocultar formulário de novo cliente
    setMostrarNovoCliente(false);
    
    toast.success('Cliente criado e selecionado com sucesso!');
  };

  const handleCancelarNovoCliente = () => {
    setMostrarNovoCliente(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    if (itensVenda.length === 0) {
      toast.error('Adicione pelo menos um produto à venda');
      return;
    }

    const vendaData: CreateSaleData = {
      client_id: clienteId ? parseInt(clienteId) : undefined,
      total_price: totalVenda,
      payment_status: 'paid', // Todas as formas de pagamento são consideradas pagas à vista
      is_credit_sale: false,
      created_by_user_id: parseInt(user.id),
      payment_method: formaPagamento,
    };

    const items = itensVenda.map(item => ({
      product_id: item.produtoId,
      quantity: item.quantidade,
      unit_price: item.precoUnitario
    }));

    try {
      await criarVenda.mutateAsync({
        vendaData,
        items
      });
      
      resetForm();
      onClose();
    } catch (error) {
      console.error('Erro ao criar venda:', error);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const clienteSelecionado = clientes?.find(c => c.id === clienteId);
  const produtosDisponiveis = produtos?.filter(p => p.estoque_atual > 0) || [];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Nova Venda
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Formulário de Novo Cliente */}
          {mostrarNovoCliente && (
            <ClienteInlineForm
              onClienteCreated={handleClienteCriado}
              onCancel={handleCancelarNovoCliente}
            />
          )}

          {/* Seleção do Cliente */}
          {!mostrarNovoCliente && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="cliente">Cliente (Opcional)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setMostrarNovoCliente(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Criar Novo Cliente
                </Button>
              </div>
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente ou deixe em branco para venda balcão" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sem_cliente">🏪 Venda Balcão (sem cliente)</SelectItem>
                  {clientes?.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{cliente.nome}</div>
                          <div className="text-sm text-gray-500">{cliente.telefone}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {clienteSelecionado && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">{clienteSelecionado.nome}</span>
                    <span className="text-gray-500">•</span>
                    <span>{clienteSelecionado.telefone}</span>
                    {clienteSelecionado.email && (
                      <>
                        <span className="text-gray-500">•</span>
                        <span>{clienteSelecionado.email}</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Adicionar Produtos */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="h-5 w-5" />
                  <h3 className="font-medium">Adicionar Produtos</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Produto</Label>
                    <Select value={produtoSelecionado} onValueChange={setProdutoSelecionado}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o produto" />
                      </SelectTrigger>
                      <SelectContent>
                        {produtosDisponiveis.map((produto) => (
                          <SelectItem key={produto.id} value={produto.id.toString()}>
                            <div className="flex items-center justify-between w-full">
                              <div>
                                <div className="font-medium">{produto.nome}</div>
                                <div className="text-sm text-gray-500">
                                  {formatCurrency(produto.preco_venda)} • Estoque: {produto.estoque_atual}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Quantidade</Label>
                    <Input
                      type="number"
                      min="1"
                      value={quantidadeProduto}
                      onChange={(e) => setQuantidadeProduto(parseInt(e.target.value) || 1)}
                    />
                  </div>

                  <div className="flex items-end">
                    <Button 
                      type="button" 
                      onClick={handleAddProduto}
                      className="w-full"
                      disabled={!produtoSelecionado}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Produtos Adicionados */}
          {itensVenda.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Produtos da Venda</h3>
                    <Badge variant="secondary">
                      {quantidadeItens} {quantidadeItens === 1 ? 'item' : 'itens'}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {itensVenda.map((item) => (
                      <div key={item.produtoId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{item.produto.nome}</div>
                          <div className="text-sm text-gray-500">
                            {formatCurrency(item.precoUnitario)} cada
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateQuantidade(item.produtoId, item.quantidade - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center">{item.quantidade}</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateQuantidade(item.produtoId, item.quantidade + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          <div className="text-right min-w-[80px]">
                            <div className="font-medium">{formatCurrency(item.subtotal)}</div>
                          </div>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveProduto(item.produtoId)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Forma de Pagamento */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="h-5 w-5" />
                  <h3 className="font-medium">Forma de Pagamento</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {FORMAS_PAGAMENTO.map((forma) => (
                    <div
                      key={forma.value}
                      className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        formaPagamento === forma.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setFormaPagamento(forma.value)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{forma.icon}</span>
                        <div>
                          <div className="font-medium">{forma.label}</div>
                        </div>
                        <div className="ml-auto">
                          <div
                            className={`w-4 h-4 rounded-full border-2 ${
                              formaPagamento === forma.value
                                ? 'border-blue-500 bg-blue-500'
                                : 'border-gray-300'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CreditCard className="h-4 w-4" />
                    <span>
                      Forma selecionada: <strong>{FORMAS_PAGAMENTO.find(f => f.value === formaPagamento)?.label}</strong>
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total da Venda */}
          {itensVenda.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="h-5 w-5" />
                    <h3 className="font-medium">Resumo da Venda</h3>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Quantidade de itens:</span>
                      <span>{quantidadeItens}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(totalVenda)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total:</span>
                      <span>{formatCurrency(totalVenda)}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {FORMAS_PAGAMENTO.find(f => f.value === formaPagamento)?.icon} {FORMAS_PAGAMENTO.find(f => f.value === formaPagamento)?.label}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            onClick={handleSubmit}
            disabled={itensVenda.length === 0 || criarVenda.isPending}
            className="min-w-[120px]"
          >
            {criarVenda.isPending ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Criando...</span>
              </div>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Finalizar Venda
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 