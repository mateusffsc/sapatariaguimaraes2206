import React, { useState, useEffect } from 'react';
import { Plus, X, Calendar, FileText, Package, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFornecedores } from '@/hooks/useFornecedores';
import { useProdutos } from '@/hooks/useProdutos';
import { useCreatePurchaseOrderMutation } from '@/hooks/usePurchaseOrders';
import { formatCurrency } from '@/lib/utils';

interface PedidoCompraModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PurchaseItem {
  id: string;
  product_id: number;
  productName: string;
  quantity_ordered: number;
  unit_price: number;
  subtotal: number;
}

export function PedidoCompraModal({ open, onOpenChange }: PedidoCompraModalProps) {
  const [supplierId, setSupplierId] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);

  // Hooks
  const { data: fornecedores = [] } = useFornecedores();
  const { data: produtos = [] } = useProdutos();
  const createPurchaseOrder = useCreatePurchaseOrderMutation();

  // Limpar formulário quando modal fecha
  useEffect(() => {
    if (!open) {
      setSupplierId('');
      setExpectedDeliveryDate('');
      setNotes('');
      setItems([]);
      setSelectedProductId('');
      setQuantity(1);
      setUnitPrice(0);
    }
  }, [open]);

  // Calcular total do pedido
  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

  // Adicionar item ao pedido
  const handleAddItem = () => {
    if (!selectedProductId || quantity <= 0 || unitPrice <= 0) {
      return;
    }

    const product = produtos.find(p => p.id.toString() === selectedProductId);
    if (!product) return;

    // Verificar se produto já está na lista
    const existingItemIndex = items.findIndex(item => item.product_id === parseInt(selectedProductId));
    
    if (existingItemIndex >= 0) {
      // Atualizar item existente
      const updatedItems = [...items];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity_ordered: quantity,
        unit_price: unitPrice,
        subtotal: quantity * unitPrice
      };
      setItems(updatedItems);
    } else {
      // Adicionar novo item
      const newItem: PurchaseItem = {
        id: Date.now().toString(),
        product_id: parseInt(selectedProductId),
        productName: product.nome,
        quantity_ordered: quantity,
        unit_price: unitPrice,
        subtotal: quantity * unitPrice
      };
      setItems([...items, newItem]);
    }

    // Limpar campos
    setSelectedProductId('');
    setQuantity(1);
    setUnitPrice(0);
  };

  // Remover item do pedido
  const handleRemoveItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  // Salvar pedido
  const handleSave = async () => {
    if (!supplierId || items.length === 0) {
      return;
    }

    const purchaseOrderData = {
      supplierId: parseInt(supplierId),
      items: items.map(item => ({
        product_id: item.product_id,
        quantity_ordered: item.quantity_ordered,
        unit_price: item.unit_price
      })),
      expectedDeliveryDate: expectedDeliveryDate || undefined,
      notes: notes || undefined
    };

    try {
      await createPurchaseOrder.mutateAsync(purchaseOrderData);
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar pedido:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Novo Pedido de Compra
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier">Fornecedor *</Label>
                  <Select value={supplierId} onValueChange={setSupplierId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o fornecedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {fornecedores.map((fornecedor) => (
                        <SelectItem key={fornecedor.id} value={fornecedor.id.toString()}>
                          {fornecedor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deliveryDate">Data de Entrega Prevista</Label>
                  <Input
                    id="deliveryDate"
                    type="date"
                    value={expectedDeliveryDate}
                    onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  placeholder="Observações sobre o pedido..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Adicionar Produtos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Adicionar Produtos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-2">
                  <Label>Produto</Label>
                  <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {produtos.map((produto) => (
                        <SelectItem key={produto.id} value={produto.id.toString()}>
                          {produto.nome}
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
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Preço Unitário</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                  />
                </div>

                <Button onClick={handleAddItem} disabled={!selectedProductId || quantity <= 0 || unitPrice <= 0}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Produtos */}
          {items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Produtos do Pedido</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-center">Quantidade</TableHead>
                      <TableHead className="text-right">Preço Unit.</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.productName}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.quantity_ordered}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.unit_price)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.subtotal)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Total */}
                <div className="flex justify-end mt-4 pt-4 border-t">
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Total do Pedido</div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(totalAmount)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botões */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!supplierId || items.length === 0 || createPurchaseOrder.isPending}
            >
              {createPurchaseOrder.isPending ? 'Salvando...' : 'Criar Pedido'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 