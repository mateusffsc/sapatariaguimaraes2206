import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent } from '../ui/card';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { 
  Package, 
  DollarSign, 
  Save, 
  X,
  AlertTriangle,
  Calculator
} from 'lucide-react';
import { toast } from 'sonner';
import { useCriarProduto, useAtualizarProduto } from '../../hooks/useProdutos';
import type { Produto } from '../../services/productService';

interface ProdutoModalProps {
  isOpen: boolean;
  onClose: () => void;
  produto?: Produto | null;
  mode: 'create' | 'edit';
}

const CATEGORIAS_PRODUTO = [
  'Calçados',
  'Materiais',
  'Acessórios',
  'Ferramentas',
  'Produtos de Limpeza',
  'Tintas e Vernizes',
  'Cola e Adesivos',
  'Palmilhas',
  'Cadarços',
  'Outros'
];

export function ProdutoModal({ isOpen, onClose, produto, mode }: ProdutoModalProps) {
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    categoria: '',
    preco_venda: '',
    preco_custo: '',
    estoque_atual: '',
    estoque_minimo: '5'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const criarProduto = useCriarProduto();
  const atualizarProduto = useAtualizarProduto();

  useEffect(() => {
    if (mode === 'edit' && produto) {
      setFormData({
        nome: produto.nome || '',
        descricao: produto.descricao || '',
        categoria: 'Outros', // Valor padrão por enquanto
        preco_venda: produto.preco_venda.toString(),
        preco_custo: '', // Por enquanto vazio até implementarmos no backend
        estoque_atual: produto.estoque_atual.toString(),
        estoque_minimo: '5' // Valor padrão por enquanto
      });
    } else if (mode === 'create') {
      resetForm();
    }
  }, [mode, produto, isOpen]);

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      categoria: '',
      preco_venda: '',
      preco_custo: '',
      estoque_atual: '0',
      estoque_minimo: '5'
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    if (!formData.categoria) {
      newErrors.categoria = 'Categoria é obrigatória';
    }

    const precoVenda = parseFloat(formData.preco_venda);
    if (!formData.preco_venda || isNaN(precoVenda) || precoVenda < 0) {
      newErrors.preco_venda = 'Preço de venda deve ser um valor válido';
    }

    const precoCusto = parseFloat(formData.preco_custo);
    if (formData.preco_custo && (isNaN(precoCusto) || precoCusto < 0)) {
      newErrors.preco_custo = 'Preço de custo deve ser um valor válido';
    }

    const estoque = parseInt(formData.estoque_atual);
    if (!formData.estoque_atual || isNaN(estoque) || estoque < 0) {
      newErrors.estoque_atual = 'Estoque deve ser um número válido';
    }

    const estoqueMinimo = parseInt(formData.estoque_minimo);
    if (!formData.estoque_minimo || isNaN(estoqueMinimo) || estoqueMinimo < 0) {
      newErrors.estoque_minimo = 'Estoque mínimo deve ser um número válido';
    }

    // Validação de margem de lucro
    if (formData.preco_custo && formData.preco_venda) {
      const custo = parseFloat(formData.preco_custo);
      const venda = parseFloat(formData.preco_venda);
      
      if (venda <= custo) {
        newErrors.preco_venda = 'Preço de venda deve ser maior que o preço de custo';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const calcularMargem = () => {
    const custo = parseFloat(formData.preco_custo);
    const venda = parseFloat(formData.preco_venda);
    
    if (!isNaN(custo) && !isNaN(venda) && custo > 0) {
      return ((venda - custo) / custo * 100).toFixed(1);
    }
    return '0';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Por favor, corrija os erros do formulário');
      return;
    }

    try {
      const produtoData = {
        nome: formData.nome.trim(),
        descricao: formData.descricao.trim() || undefined,
        preco_venda: parseFloat(formData.preco_venda),
        estoque_atual: parseInt(formData.estoque_atual),
      };

      if (mode === 'create') {
        await criarProduto.mutateAsync(produtoData);
        toast.success('Produto criado com sucesso!');
      } else if (produto) {
        await atualizarProduto.mutateAsync({
          id: produto.id.toString(),
          produto: produtoData
        });
        toast.success('Produto atualizado com sucesso!');
      }

      resetForm();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      toast.error('Erro ao salvar produto. Tente novamente.');
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const formatCurrency = (value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue);
  };

  const isLoading = criarProduto.isPending || atualizarProduto.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {mode === 'create' ? 'Novo Produto' : 'Editar Produto'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Package className="h-4 w-4" />
                <h3 className="font-medium">Informações Básicas</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="nome">Nome do Produto *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => handleInputChange('nome', e.target.value)}
                    placeholder="Ex: Sapato Social Masculino"
                    className={errors.nome ? 'border-red-500' : ''}
                  />
                  {errors.nome && (
                    <span className="text-sm text-red-500 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {errors.nome}
                    </span>
                  )}
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => handleInputChange('descricao', e.target.value)}
                    placeholder="Descrição detalhada do produto..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria *</Label>
                  <Select value={formData.categoria} onValueChange={(value) => handleInputChange('categoria', value)}>
                    <SelectTrigger className={errors.categoria ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS_PRODUTO.map((categoria) => (
                        <SelectItem key={categoria} value={categoria}>
                          {categoria}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.categoria && (
                    <span className="text-sm text-red-500 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {errors.categoria}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preços */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <h3 className="font-medium">Preços</h3>
                </div>
                {formData.preco_custo && formData.preco_venda && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <Calculator className="h-3 w-3 mr-1" />
                    Margem: {calcularMargem()}%
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preco_custo">Preço de Custo</Label>
                  <Input
                    id="preco_custo"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.preco_custo}
                    onChange={(e) => handleInputChange('preco_custo', e.target.value)}
                    placeholder="0,00"
                    className={errors.preco_custo ? 'border-red-500' : ''}
                  />
                  {errors.preco_custo && (
                    <span className="text-sm text-red-500 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {errors.preco_custo}
                    </span>
                  )}
                  {formData.preco_custo && (
                    <span className="text-xs text-gray-500">
                      {formatCurrency(formData.preco_custo)}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preco_venda">Preço de Venda *</Label>
                  <Input
                    id="preco_venda"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.preco_venda}
                    onChange={(e) => handleInputChange('preco_venda', e.target.value)}
                    placeholder="0,00"
                    className={errors.preco_venda ? 'border-red-500' : ''}
                  />
                  {errors.preco_venda && (
                    <span className="text-sm text-red-500 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {errors.preco_venda}
                    </span>
                  )}
                  {formData.preco_venda && (
                    <span className="text-xs text-gray-500">
                      {formatCurrency(formData.preco_venda)}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estoque */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Package className="h-4 w-4" />
                <h3 className="font-medium">Controle de Estoque</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estoque_atual">Estoque Atual *</Label>
                  <Input
                    id="estoque_atual"
                    type="number"
                    min="0"
                    value={formData.estoque_atual}
                    onChange={(e) => handleInputChange('estoque_atual', e.target.value)}
                    placeholder="0"
                    className={errors.estoque_atual ? 'border-red-500' : ''}
                  />
                  {errors.estoque_atual && (
                    <span className="text-sm text-red-500 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {errors.estoque_atual}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estoque_minimo">Estoque Mínimo *</Label>
                  <Input
                    id="estoque_minimo"
                    type="number"
                    min="0"
                    value={formData.estoque_minimo}
                    onChange={(e) => handleInputChange('estoque_minimo', e.target.value)}
                    placeholder="5"
                    className={errors.estoque_minimo ? 'border-red-500' : ''}
                  />
                  {errors.estoque_minimo && (
                    <span className="text-sm text-red-500 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {errors.estoque_minimo}
                    </span>
                  )}
                  {formData.estoque_minimo && (
                    <span className="text-xs text-gray-500">
                      Alerta quando estoque ≤ {formData.estoque_minimo}
                    </span>
                  )}
                </div>
              </div>

              {/* Preview de Valor Total em Estoque */}
              {formData.preco_custo && formData.estoque_atual && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-blue-700">Valor Total em Estoque (custo):</span>
                    <span className="font-semibold text-blue-800">
                      {formatCurrency((parseInt(formData.estoque_atual) * parseFloat(formData.preco_custo)).toString())}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Botões */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Salvando...' : mode === 'create' ? 'Criar Produto' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 